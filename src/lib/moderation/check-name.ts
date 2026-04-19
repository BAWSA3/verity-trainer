/**
 * Unified trainer-name checker.
 *
 * Tri-layer:
 *   1. Length sanity (2–12 chars after trim)
 *   2. Static slur + profanity blocklist
 *   3. Brand / trademark blocklist
 *   4. OpenAI /v1/moderations (free endpoint) — catches nuance the lists miss
 *
 * Short-circuits on first fail. OpenAI layer gracefully no-ops if
 * OPENAI_API_KEY is missing — the static layers still run.
 */

import { PROFANITY, SLURS, findBlocklistMatch } from './blocklist';
import { BRANDS } from './brand-blocklist';

export type CheckReason =
  | 'length'
  | 'profanity'
  | 'slur'
  | 'brand'
  | 'openai'
  | 'openai_error';

export interface CheckResult {
  ok: boolean;
  reason?: CheckReason;
  match?: string;
}

const MIN_LEN = 2;
const MAX_LEN = 12;

export async function checkTrainerName(name: string): Promise<CheckResult> {
  const trimmed = (name ?? '').trim();

  // 1. length
  if (trimmed.length < MIN_LEN || trimmed.length > MAX_LEN) {
    return { ok: false, reason: 'length' };
  }

  // 2. slurs — hardest block, check first
  const slurHit = findBlocklistMatch(trimmed, SLURS);
  if (slurHit) return { ok: false, reason: 'slur', match: slurHit };

  // 3. profanity
  const profHit = findBlocklistMatch(trimmed, PROFANITY);
  if (profHit) return { ok: false, reason: 'profanity', match: profHit };

  // 4. brands
  const brandHit = findBlocklistMatch(trimmed, BRANDS);
  if (brandHit) return { ok: false, reason: 'brand', match: brandHit };

  // 5. OpenAI moderation (free endpoint). Skip if key missing.
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'omni-moderation-latest',
          input: trimmed,
        }),
      });
      if (!res.ok) {
        console.warn('[moderation] OpenAI moderation HTTP', res.status);
        return { ok: true, reason: 'openai_error' };
      }
      const data = (await res.json()) as {
        results?: Array<{ flagged?: boolean }>;
      };
      const flagged = data.results?.[0]?.flagged === true;
      if (flagged) return { ok: false, reason: 'openai' };
    } catch (err) {
      console.warn('[moderation] OpenAI moderation threw', err);
      // fail open — static layers already passed
      return { ok: true, reason: 'openai_error' };
    }
  }

  return { ok: true };
}
