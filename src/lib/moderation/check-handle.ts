/**
 * X/Twitter handle validator.
 *   - Format: alphanumeric + underscore, 1–15 chars (X rules).
 *   - Slur blocklist.
 * Optional field — empty / missing handle is allowed.
 */

import { SLURS, findBlocklistMatch } from './blocklist';

export interface HandleCheckResult {
  ok: boolean;
  reason?: 'format' | 'slur';
  match?: string;
}

const HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/;

export function checkHandle(raw: string | null | undefined): HandleCheckResult {
  if (!raw) return { ok: true };
  const h = raw.replace(/^@/, '').trim();
  if (!h) return { ok: true };
  if (!HANDLE_REGEX.test(h)) return { ok: false, reason: 'format' };
  const slurHit = findBlocklistMatch(h, SLURS);
  if (slurHit) return { ok: false, reason: 'slur', match: slurHit };
  return { ok: true };
}
