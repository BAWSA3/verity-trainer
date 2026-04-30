/**
 * Personality field validator (zodiac + likes/dislikes).
 *
 * Mirrors checkTrainerName's tri-layer pattern but accepts an array of
 * user-typed chips. The OpenAI moderation endpoint accepts arrays —
 * one batched call covers all chips at once.
 *
 * Short-circuits on first fail. Static layers always run; OpenAI is
 * skipped gracefully if OPENAI_API_KEY is missing.
 */

import { SLURS, PROFANITY, CRUDE, findBlocklistMatch } from './blocklist';
import { VALID_ZODIACS } from '../personality';
import type { TrainerPersonality } from '@/types/trainer';

// Note: BRANDS and PROFANITY blocklists intentionally NOT applied to personality
// chips.
//
// Likes/dislikes are SUPPOSED to mention brands and platforms ("instagram
// aesthetic", "google docs", "openai drama") — that's signal, not impersonation.
//
// PROFANITY blocklist uses substring matching after collapsing repeated chars,
// which means common AI-generated chips like "podcasting" → "podcasting" or
// "pissed off" → "pisedof" can trip blocked entries (`piss`). Real X content
// frequently contains profanity context — false positives are too high. The
// AI is constrained by its system prompt to avoid profanity, and OpenAI omni-
// moderation (when configured) catches actual abuse with proper context.
//
// SLURS still blocks (highest legal/PR risk; tiny curated list). Trainer name
// still gets the full tri-layer (slurs + profanity + brands + OpenAI) — see
// check-name.ts. Personality is the lower-risk surface.

export type PersonalityReason =
  | 'count'
  | 'length'
  | 'invalid_chars'
  | 'slur'
  | 'openai'
  | 'openai_error'
  | 'invalid_zodiac';

export interface PersonalityCheckResult {
  ok: boolean;
  reason?: PersonalityReason;
  field?: 'zodiac' | 'likes' | 'dislikes';
  match?: string;
}

const MAX_CHIPS = 5;
const MAX_CHIP_LEN = 24;
const MIN_CHIP_LEN = 1;

// Allow lowercase letters, digits, spaces, hyphens, ampersand, apostrophe.
// Specifically blocks unicode + punctuation soup that can hide slurs.
const VALID_CHIP_RE = /^[a-z0-9 \-&']+$/;

export async function checkPersonality(
  p: TrainerPersonality,
): Promise<PersonalityCheckResult> {
  // 1. zodiac
  if (p.zodiac && !VALID_ZODIACS.has(p.zodiac)) {
    return { ok: false, reason: 'invalid_zodiac', field: 'zodiac' };
  }

  // 2. count + per-chip shape (likes then dislikes)
  for (const field of ['likes', 'dislikes'] as const) {
    const arr = p[field] ?? [];
    if (!Array.isArray(arr)) {
      return { ok: false, reason: 'count', field };
    }
    if (arr.length > MAX_CHIPS) {
      return { ok: false, reason: 'count', field };
    }
    for (const chip of arr) {
      if (typeof chip !== 'string') {
        return { ok: false, reason: 'invalid_chars', field, match: String(chip) };
      }
      const trimmed = chip.trim();
      if (trimmed.length < MIN_CHIP_LEN || trimmed.length > MAX_CHIP_LEN) {
        return { ok: false, reason: 'length', field, match: trimmed };
      }
      if (!VALID_CHIP_RE.test(trimmed.toLowerCase())) {
        return { ok: false, reason: 'invalid_chars', field, match: trimmed };
      }
    }
  }

  // 3. blocklists — slurs only. Profanity + brands intentionally skipped (see top).
  for (const field of ['likes', 'dislikes'] as const) {
    for (const chip of p[field]) {
      const slurHit = findBlocklistMatch(chip, SLURS);
      if (slurHit) return { ok: false, reason: 'slur', field, match: slurHit };
    }
  }

  // 4. OpenAI moderation — single batched call across all chips
  const apiKey = process.env.OPENAI_API_KEY;
  const allChips = [...p.likes, ...p.dislikes];
  if (apiKey && allChips.length > 0) {
    try {
      const res = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'omni-moderation-latest',
          input: allChips,
        }),
      });
      if (!res.ok) {
        console.warn('[moderation] OpenAI personality HTTP', res.status);
        return { ok: true, reason: 'openai_error' };
      }
      const data = (await res.json()) as {
        results?: Array<{ flagged?: boolean }>;
      };
      const flaggedIdx = data.results?.findIndex((r) => r?.flagged === true) ?? -1;
      if (flaggedIdx >= 0) {
        const field = flaggedIdx < p.likes.length ? 'likes' : 'dislikes';
        return {
          ok: false,
          reason: 'openai',
          field,
          match: allChips[flaggedIdx],
        };
      }
    } catch (err) {
      console.warn('[moderation] OpenAI personality threw', err);
      return { ok: true, reason: 'openai_error' };
    }
  }

  return { ok: true };
}

/**
 * Scrubs AI-generated chips against the strict layer (SLURS + PROFANITY +
 * CRUDE). Returns chips with offending entries dropped. Runs only static
 * lists — fast, deterministic, no network. Used inside /api/generate-trainer
 * so model output never reaches the UI with crude content. User-typed input
 * keeps using checkPersonality() above (lenient — chips can mention brands
 * + benign profanity adjacent terms without false-positive trips).
 *
 * Each dropped chip is reported via the `dropped` array so the route handler
 * can decide to backfill defaults + console.log for blocklist tuning.
 */
export interface ChipScrubResult {
  cleaned: string[];
  dropped: Array<{ chip: string; match: string; layer: 'slur' | 'profanity' | 'crude' }>;
}

export function scrubAIChips(chips: readonly string[]): ChipScrubResult {
  const cleaned: string[] = [];
  const dropped: ChipScrubResult['dropped'] = [];
  for (const chip of chips) {
    if (typeof chip !== 'string') continue;
    const slur = findBlocklistMatch(chip, SLURS);
    if (slur) { dropped.push({ chip, match: slur, layer: 'slur' }); continue; }
    const profanity = findBlocklistMatch(chip, PROFANITY);
    if (profanity) { dropped.push({ chip, match: profanity, layer: 'profanity' }); continue; }
    const crude = findBlocklistMatch(chip, CRUDE);
    if (crude) { dropped.push({ chip, match: crude, layer: 'crude' }); continue; }
    cleaned.push(chip);
  }
  return { cleaned, dropped };
}
