import { NextRequest, NextResponse } from 'next/server';
import { fetchXProfile } from '@/lib/x-profile';
import { generateTrainer } from '@/lib/ai/generate-trainer';
import { scrubAIChips, checkQuote } from '@/lib/moderation/check-personality';
import { checkRateLimit, extractIp, hashIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkOrigin } from '@/lib/origin-check';
import type { TrainerPersonality } from '@/types/trainer';
// Mirrors the deterministic pool used by mockTrainer for keyless dev. When a
// live AI quote gets flagged, we silently substitute one of these so the user
// never sees the unsafe original. Same pool, same hash logic, predictable.
import { mockQuoteForHash } from '@/lib/ai/mock-quotes';

export const runtime = 'nodejs';

// Safe-default chip pools used to backfill a slot after the strict scrubber
// drops an AI-generated chip. Hand-picked to be evergreen + on-brand for a
// pixel-art trainer card. These are NEVER user-typed — they only fill
// vacancies created by the AI producing crude content.
const FALLBACK_LIKES = [
  'pixel art', 'lo-fi tracks', 'vintage finds', 'good design',
  'shipping at 2am', 'small details', 'old school', 'building tools',
];
const FALLBACK_DISLIKES = [
  'hype drops', 'doomscrolling', 'ai slop', 'bad ux',
  'meetings', 'stale takes', 'broken builds',
];

function backfill(cleaned: string[], pool: readonly string[], target: number): string[] {
  const out = [...cleaned];
  const used = new Set(out.map((c) => c.toLowerCase()));
  for (const candidate of pool) {
    if (out.length >= target) break;
    if (used.has(candidate.toLowerCase())) continue;
    out.push(candidate);
    used.add(candidate.toLowerCase());
  }
  return out;
}

function scrubPersonality(p: TrainerPersonality, handle: string): TrainerPersonality {
  // V3 abilities/knownFor are AI-prompted to be brand-safe; the signup-time
  // moderation pipeline (check-personality.ts) is the backstop. Legacy
  // likes/dislikes (v2) still go through the chip scrubber when present.
  const out: TrainerPersonality = {
    zodiac: p.zodiac,
    likes: [],
    dislikes: [],
  };
  if (p.likes && p.likes.length > 0) {
    const likes = scrubAIChips(p.likes);
    out.likes = backfill(likes.cleaned, FALLBACK_LIKES, p.likes.length);
    if (likes.dropped.length) console.warn(`[generate-trainer] dropped AI likes for @${handle}:`, likes.dropped);
  }
  if (p.dislikes && p.dislikes.length > 0) {
    const dislikes = scrubAIChips(p.dislikes);
    out.dislikes = backfill(dislikes.cleaned, FALLBACK_DISLIKES, p.dislikes.length);
    if (dislikes.dropped.length) console.warn(`[generate-trainer] dropped AI dislikes for @${handle}:`, dislikes.dropped);
  }
  if (p.abilities && p.abilities.length > 0) out.abilities = p.abilities;
  if (p.quote) out.quote = p.quote;
  return out;
}

// POST /api/generate-trainer
//   body: { handle: string, regenerate?: boolean, hint?: string }
//   returns: { config, personality, reasoning, source: 'live' | 'mock', profile: { handle, name, source } }
//
// The auth-gated production version reads the X handle from the Supabase
// session; for the prototype, the handle comes from the request body so we
// can demo without OAuth wiring.

interface RequestBody {
  handle?: string;
  regenerate?: boolean;
  hint?: string;
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  // Origin allow-list — see /lib/origin-check.ts. Cross-origin bot POSTs
  // without browser-y headers get rejected before we hit Anthropic.
  const originCheck = checkOrigin(req);
  if (!originCheck.ok) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const handle = (body.handle ?? '').trim().replace(/^@/, '');
  if (!handle || !/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
    return NextResponse.json({ error: 'invalid_handle' }, { status: 400 });
  }

  // Cloudflare Turnstile — verify before spending money on AI + SocialData.
  // No-op when TURNSTILE_SECRET_KEY is unset (dev / preview).
  const ip = extractIp(req);
  const turnstile = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstile.ok && turnstile.reason !== 'no_key') {
    return NextResponse.json(
      { error: 'verification_failed', message: 'Captcha verification failed. Refresh and try again.' },
      { status: 403 },
    );
  }

  // AI cost guard — 10 generations per IP per hour. Independent budget
  // from /api/signup so a few real claims don't lock out re-rolls. Wrapped
  // in try/catch so a Supabase outage / missing-env never escapes to a
  // 500 with empty body — degrade to no-rate-limit instead.
  try {
    const ipHash = hashIp(ip);
    const rate = await checkRateLimit(ipHash, {
      action: 'generate-trainer',
      max: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: 'Too many generations from your network. Try again later.',
          retryAfter: rate.retryAfter,
        },
        {
          status: 429,
          headers: rate.retryAfter ? { 'Retry-After': String(rate.retryAfter) } : undefined,
        },
      );
    }
  } catch (rateErr) {
    console.warn('[generate-trainer] rate-limit subsystem unavailable, proceeding:', rateErr);
  }

  try {
    const profile = await fetchXProfile(handle);
    const trainer = await generateTrainer(profile, {
      regenerate: !!body.regenerate,
      hint: typeof body.hint === 'string' ? body.hint : undefined,
    });
    const cleanedPersonality = scrubPersonality(trainer.personality, handle);

    // Post-AI quote moderation. The system prompt enumerates hard-blocks
    // (race / sex / orientation / religion / disability) but Claude can
    // still misfire on sparse profiles. checkQuote runs OpenAI omni-mod;
    // flagged quotes are silently substituted from the mock pool so the
    // user never sees the unsafe original.
    if (cleanedPersonality.quote) {
      const quoteCheck = await checkQuote(cleanedPersonality.quote);
      if (!quoteCheck.ok) {
        console.warn(
          `[generate-trainer] quote flagged for @${handle}:`,
          quoteCheck.reason,
          quoteCheck.categories ?? quoteCheck.match ?? '',
        );
        // Hash the handle to pick a deterministic substitute so a re-roll
        // for the same user lands on the same fallback (no randomness drift).
        let h = 0;
        for (let i = 0; i < handle.length; i++) {
          h = ((h << 5) - h + handle.charCodeAt(i)) | 0;
        }
        cleanedPersonality.quote = mockQuoteForHash(Math.abs(h));
      }
    }

    return NextResponse.json({
      config: trainer.config,
      personality: cleanedPersonality,
      reasoning: trainer.reasoning,
      source: trainer.source,
      profile: {
        handle: profile.handle,
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        followers: profile.followers,
        source: profile.source,
      },
    });
  } catch (err) {
    console.error('[generate-trainer] failed:', err);
    return NextResponse.json(
      { error: 'generation_failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
