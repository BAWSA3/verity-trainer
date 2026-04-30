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

import { PROFANITY, SLURS, findBlocklistMatch } from './blocklist';
import { VALID_ZODIACS } from '../personality';
import type { TrainerPersonality } from '@/types/trainer';

// Note: BRANDS blocklist intentionally NOT applied to personality chips.
// Likes/dislikes are SUPPOSED to mention brands and platforms ("instagram
// aesthetic", "google docs", "openai drama") — that's signal, not impersonation.
// Brand-blocklist only applies to trainer names (where impersonation matters).

export type PersonalityReason =
  | 'count'
  | 'length'
  | 'invalid_chars'
  | 'slur'
  | 'profanity'
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

  // 3. blocklists — slurs + profanity only (brands intentionally skipped — see top)
  for (const field of ['likes', 'dislikes'] as const) {
    for (const chip of p[field]) {
      const slurHit = findBlocklistMatch(chip, SLURS);
      if (slurHit) return { ok: false, reason: 'slur', field, match: slurHit };
      const profHit = findBlocklistMatch(chip, PROFANITY);
      if (profHit) return { ok: false, reason: 'profanity', field, match: profHit };
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
