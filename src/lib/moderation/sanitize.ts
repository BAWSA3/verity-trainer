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
