import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkTrainerName } from '@/lib/moderation/check-name';
import { checkHandle } from '@/lib/moderation/check-handle';
import { checkTrainerConfig } from '@/lib/moderation/check-config';
import { checkPersonality, checkQuote } from '@/lib/moderation/check-personality';
import { mockQuoteForHash } from '@/lib/ai/mock-quotes';
import { isDisposableEmail, emailDomain } from '@/lib/moderation/disposable-domains';
import { checkSignupRate, extractIp, hashIp } from '@/lib/rate-limit';
import { packTrainer } from '@/lib/trainer-data';
import { normalizeEmail } from '@/lib/moderation/normalize-email';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkOrigin } from '@/lib/origin-check';
import type { TrainerPersonality } from '@/types/trainer';

const EMPTY_PERSONALITY: TrainerPersonality = { zodiac: '', likes: [], dislikes: [] };

/**
 * SHA-256 hash an email for audit-log storage so the audit table never
 * contains plaintext PII. trainer_signups keeps plaintext for newsletter use.
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

/**
 * POST /api/signup
 *
 * Pipeline:
 *   1. Rate limit (5/hour per IP) — 429 if exceeded
 *   2. Basic validation (required fields, email format) — 400
 *   3. Trainer name moderation (slurs / profanity / brands / OpenAI) — 400
 *   4. X handle validation (format + slur) — 400
 *   5. Upsert into trainer_signups
 *   6. Append to signup_audit_log (success or flagged)
 *
 * Every path logs to audit so admins can review patterns.
 */
export async function POST(req: NextRequest) {
  const ip = extractIp(req);
  const ipHash = hashIp(ip);

  async function logAudit(params: {
    email?: string | null;
    trainerName?: string | null;
    xHandle?: string | null;
    flagged: boolean;
    flagReason?: string;
    flagMatch?: string;
  }) {
    try {
      // Hash the email before writing to audit log — reduces PII blast radius
      // if the audit table is ever exposed. Plaintext email lives only in
      // trainer_signups where it's needed for the newsletter.
      const emailForAudit = params.email ? hashEmail(params.email) : null;
      await supabaseAdmin.from('signup_audit_log').insert({
        email: emailForAudit,
        trainer_name: params.trainerName ?? null,
        x_handle: params.xHandle ?? null,
        ip_hash: ipHash,
        flagged: params.flagged,
        flag_reason: params.flagReason ?? null,
        flag_match: params.flagMatch ?? null,
      });
    } catch (err) {
      console.warn('[signup] audit log write failed:', err);
    }
  }

  // Origin allow-list — blocks naive cross-origin bot POSTs without setting
  // browser-y headers. Same-origin browser submissions pass automatically.
  const originCheck = checkOrigin(req);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: 'Forbidden.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const {
      email, xHandle, trainerName, trainerConfig, trainerPersonality,
      reasoning, referredBy, turnstileToken,
    } = body ?? {};
    const personality: TrainerPersonality = trainerPersonality ?? EMPTY_PERSONALITY;
    const aiReasoning = typeof reasoning === 'string' && reasoning.trim() ? reasoning.trim() : undefined;

    // 0. Cloudflare Turnstile verification — short-circuits ok when no
    // secret configured (dev / preview), enforces in prod. Run BEFORE the
    // rate-limit + DB checks so trivially-bad bots don't even hit our DB.
    const turnstile = await verifyTurnstile(turnstileToken, ip);
    if (!turnstile.ok && turnstile.reason !== 'no_key') {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: `turnstile_${turnstile.reason ?? 'unknown'}`,
      });
      return NextResponse.json(
        { error: 'Verification failed. Refresh the page and try again.' },
        { status: 403 },
      );
    }
    // Referral handle (the X handle of the trainer card whose QR was scanned).
    // Sanitize to X handle rules even though it's user-supplied via localStorage.
    const referrerHandle = typeof referredBy === 'string'
      ? referredBy.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || undefined
      : undefined;

    // 1. Rate limit
    const rate = await checkSignupRate(ipHash);
    if (!rate.ok) {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: 'rate_limit',
      });
      return NextResponse.json(
        {
          error: 'Too many signups from your network. Please try again later.',
          retryAfter: rate.retryAfter,
        },
        {
          status: 429,
          headers: rate.retryAfter
            ? { 'Retry-After': String(rate.retryAfter) }
            : undefined,
        },
      );
    }

    // 2. Basic validation
    if (!email || !trainerName || !trainerConfig) {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: 'missing_fields',
      });
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: 'email_format',
      });
      return NextResponse.json(
        { error: 'That email address looks invalid.' },
        { status: 400 },
      );
    }

    // 3. Disposable email check — reject known throwaway providers
    if (isDisposableEmail(email)) {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: 'disposable_email',
        flagMatch: emailDomain(email) ?? undefined,
      });
      return NextResponse.json(
        {
          error:
            'Please use a non-disposable email address — we send drop notifications to your inbox.',
        },
        { status: 400 },
      );
    }

    // 4. Trainer name moderation (tri-layer)
    const nameCheck = await checkTrainerName(trainerName);
    if (!nameCheck.ok) {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: nameCheck.reason,
        flagMatch: nameCheck.match,
      });
      const friendly =
        nameCheck.reason === 'length'
          ? 'Trainer name must be 2–12 characters.'
          : nameCheck.reason === 'brand'
          ? "That name looks like a protected brand. Try something original."
          : "That trainer name isn't allowed. Try another.";
      return NextResponse.json({ error: friendly }, { status: 400 });
    }

    // 5. X handle validation (optional field)
    if (xHandle) {
      const handleCheck = checkHandle(xHandle);
      if (!handleCheck.ok) {
        await logAudit({
          email,
          trainerName,
          xHandle,
          flagged: true,
          flagReason: `handle_${handleCheck.reason}`,
          flagMatch: handleCheck.match,
        });
        const friendly =
          handleCheck.reason === 'format'
            ? 'X handle should be letters, numbers, or underscores (max 15).'
            : "That handle isn't allowed.";
        return NextResponse.json({ error: friendly }, { status: 400 });
      }
    }

    // 6. Trainer config validation — ensure every field matches the catalog.
    //    Blocks direct-API bypass of client-side blank-start + required-slot rules.
    const configCheck = checkTrainerConfig(trainerConfig);
    if (!configCheck.ok) {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: `config_${configCheck.reason}`,
        flagMatch: configCheck.field,
      });
      return NextResponse.json(
        { error: "Your trainer isn't fully designed yet. Please finish the customizer and try again." },
        { status: 400 },
      );
    }

    // 7. Personality validation (zodiac + likes/dislikes). Same tri-layer
    //    blocklist + OpenAI moderation as the trainer name.
    const personalityCheck = await checkPersonality(personality);
    if (!personalityCheck.ok) {
      console.error('[signup] personality flagged:', {
        reason: personalityCheck.reason,
        field: personalityCheck.field,
        match: personalityCheck.match,
      });
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: `personality_${personalityCheck.reason}`,
        flagMatch: personalityCheck.match,
      });
      const friendly =
        personalityCheck.reason === 'count'
          ? 'Too many likes/dislikes. Max 5 each.'
          : personalityCheck.reason === 'length'
          ? 'Each like/dislike must be between 1 and 24 characters.'
          : personalityCheck.reason === 'invalid_chars'
          ? 'Likes/dislikes can only contain letters, numbers, spaces, and hyphens.'
          : personalityCheck.reason === 'invalid_zodiac'
          ? 'Invalid zodiac selection.'
          : "That entry isn't allowed. Try something else.";
      return NextResponse.json({ error: friendly }, { status: 400 });
    }

    // 7.3. Quote re-moderation (defense in depth). The /api/generate-trainer
    // route already moderates the AI quote, but a tampered client could
    // submit a different quote in personality.quote. Run the same gate;
    // on flag, silently substitute from the safe mock pool keyed by handle.
    if (personality.quote) {
      const quoteCheck = await checkQuote(personality.quote);
      if (!quoteCheck.ok) {
        console.warn(
          '[signup] quote re-flagged at submission:',
          quoteCheck.reason,
          quoteCheck.categories ?? quoteCheck.match ?? '',
        );
        const handleSeed = (xHandle ?? email).toLowerCase();
        let h = 0;
        for (let i = 0; i < handleSeed.length; i++) {
          h = ((h << 5) - h + handleSeed.charCodeAt(i)) | 0;
        }
        personality.quote = mockQuoteForHash(Math.abs(h));
      }
    }

    // 7.4. Anti-farming pre-check — has this X handle or this normalized
    // email already claimed? Done BEFORE the tier roll so we don't burn a
    // tier slot on a request that's about to fail the unique constraint.
    const xHandleNormalized = xHandle?.toLowerCase().trim().replace(/^@/, '') || null;
    const emailNormalized = normalizeEmail(email);
    let claimedAlready = false;
    if (xHandleNormalized) {
      const { data } = await supabaseAdmin
        .from('trainer_signups')
        .select('id')
        .eq('x_handle', xHandleNormalized)
        .maybeSingle();
      if (data?.id) claimedAlready = true;
    }
    if (!claimedAlready && emailNormalized) {
      const { data } = await supabaseAdmin
        .from('trainer_signups')
        .select('id')
        .eq('normalized_email', emailNormalized)
        .maybeSingle();
      if (data?.id) claimedAlready = true;
    }
    if (claimedAlready) {
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: 'already_claimed',
      });
      return NextResponse.json(
        { error: 'This X handle (or email) has already claimed a trainer card.' },
        { status: 409 },
      );
    }

    // 7.5. Roll tier — atomic weighted random across remaining supply.
    // The roll_tier() RPC locks tier_supply, picks one tier weighted by
    // remaining count, decrements, and writes a tier_roll_log row.
    let assignedTier: import('@/types/trainer').TierKey | undefined;
    try {
      const { data: tier, error: tierErr } = await supabaseAdmin.rpc('roll_tier');
      if (tierErr) {
        console.warn('[signup] roll_tier failed, claim proceeds untiered:', tierErr.message);
      } else if (typeof tier === 'string') {
        assignedTier = tier as import('@/types/trainer').TierKey;
      }
    } catch (err) {
      console.warn('[signup] roll_tier exception:', err);
    }

    // 8. Upsert the signup (v2 JSONB shape: {schemaVersion, config, personality})
    const { data, error: dbErr } = await supabaseAdmin
      .from('trainer_signups')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          x_handle: xHandle?.toLowerCase().trim().replace(/^@/, '') || null,
          trainer_name: trainerName.toUpperCase().slice(0, 12),
          trainer_config: packTrainer(
            trainerConfig,
            personality,
            aiReasoning ? 'ai' : undefined,
            aiReasoning,
            referrerHandle,
            assignedTier,
          ),
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single();

    if (dbErr) {
      // Postgres unique-violation = 23505. Hits when two requests for the
      // same X handle / normalized email race past the pre-check. The tier
      // roll is already committed; we accept the orphaned tier slot rather
      // than complicating the flow with a release-tier RPC. Pre-check above
      // catches the common case so this fires <0.1% of the time.
      const isUniqueViolation =
        (dbErr as { code?: string }).code === '23505' ||
        /duplicate key|already exists/i.test(dbErr.message ?? '');
      if (isUniqueViolation) {
        await logAudit({
          email,
          trainerName,
          xHandle,
          flagged: true,
          flagReason: 'race_already_claimed',
        });
        return NextResponse.json(
          { error: 'This X handle (or email) has already claimed a trainer card.' },
          { status: 409 },
        );
      }
      console.error('[signup] supabase upsert error:', dbErr);
      await logAudit({
        email,
        trainerName,
        xHandle,
        flagged: true,
        flagReason: 'db_error',
      });
      return NextResponse.json({ error: 'Signup failed.' }, { status: 500 });
    }

    // 6. Audit success
    await logAudit({ email, trainerName, xHandle, flagged: false });

    return NextResponse.json({ id: data.id, tier: assignedTier ?? null });
  } catch (err) {
    console.error('[signup] unexpected error:', err);
    return NextResponse.json({ error: 'System error.' }, { status: 500 });
  }
}
