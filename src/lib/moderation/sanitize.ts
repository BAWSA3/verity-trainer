/**
 * Read-time name sanitizer — last-resort backstop for public pages.
 *
 * If a bad name somehow lands in the DB (bug, historical data, direct
 * Supabase write), the public /card/[id] page and OG image still render
 * a clean "TRAINER" fallback instead of the offending string.
 *
 * Uses only the static layers (blocklist + brands) since this runs on
 * every read and we don't want an OpenAI call per page-view.
 */

import { PROFANITY, SLURS, findBlocklistMatch } from './blocklist';
import { BRANDS } from './brand-blocklist';

const FALLBACK = 'TRAINER';

export function sanitizeNameForDisplay(name: string | null | undefined): string {
  if (!name) return FALLBACK;
  const trimmed = name.trim();
  if (!trimmed) return FALLBACK;
  if (findBlocklistMatch(trimmed, SLURS)) return FALLBACK;
  if (findBlocklistMatch(trimmed, PROFANITY)) return FALLBACK;
  if (findBlocklistMatch(trimmed, BRANDS)) return FALLBACK;
  return trimmed.toUpperCase().slice(0, 12);
}

/**
 * Read-time chip sanitizer for likes/dislikes on public pages.
 * Drops any chip that hits the static blocklists. Static-only — no OpenAI.
 * Returns up to 5 chips, each truncated to 24 chars.
 */
export function sanitizeChipsForDisplay(chips: string[] | null | undefined): string[] {
  if (!Array.isArray(chips)) return [];
  const out: string[] = [];
  for (const chip of chips) {
    if (typeof chip !== 'string') continue;
    const trimmed = chip.trim();
    if (!trimmed) continue;
    if (findBlocklistMatch(trimmed, SLURS)) continue;
    if (findBlocklistMatch(trimmed, PROFANITY)) continue;
    if (findBlocklistMatch(trimmed, BRANDS)) continue;
    out.push(trimmed.slice(0, 24));
    if (out.length >= 5) break;
  }
  return out;
}
