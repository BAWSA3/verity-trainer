import { NextRequest, NextResponse } from 'next/server';
import { fetchXProfile } from '@/lib/x-profile';
import { generateTrainer } from '@/lib/ai/generate-trainer';
import { scrubAIChips } from '@/lib/moderation/check-personality';
import type { TrainerPersonality } from '@/types/trainer';

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
  if (p.knownFor) out.knownFor = p.knownFor;
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
}

export async function POST(req: NextRequest) {
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

  try {
    const profile = await fetchXProfile(handle);
    const trainer = await generateTrainer(profile, {
      regenerate: !!body.regenerate,
      hint: typeof body.hint === 'string' ? body.hint : undefined,
    });
    const cleanedPersonality = scrubPersonality(trainer.personality, handle);
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
