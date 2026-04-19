import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkTrainerName } from '@/lib/moderation/check-name';
import { checkHandle } from '@/lib/moderation/check-handle';
import { checkTrainerConfig } from '@/lib/moderation/check-config';
import { isDisposableEmail, emailDomain } from '@/lib/moderation/disposable-domains';
import { checkSignupRate, extractIp, hashIp } from '@/lib/rate-limit';

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

  try {
    const body = await req.json();
    const { email, xHandle, trainerName, trainerConfig } = body ?? {};

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

    // 7. Upsert the signup
    const { data, error: dbErr } = await supabaseAdmin
      .from('trainer_signups')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          x_handle: xHandle?.toLowerCase().trim().replace(/^@/, '') || null,
          trainer_name: trainerName.toUpperCase().slice(0, 12),
          trainer_config: trainerConfig,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single();

    if (dbErr) {
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

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('[signup] unexpected error:', err);
    return NextResponse.json({ error: 'System error.' }, { status: 500 });
  }
}
