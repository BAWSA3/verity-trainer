/**
 * Profanity + slur blocklist for trainer names and X handles.
 *
 * These are the hard floors — things we will never allow through. The
 * OpenAI moderation layer catches nuance beyond this; this layer catches
 * the obvious stuff fast without needing an API call.
 *
 * Entries are NORMALIZED: lowercase, alphanumeric only, repeats NOT collapsed.
 * The normalizer below strips everything else from input before matching,
 * so `F-U-C-K` and `f*ck` and `F U C K` all collapse to `fuck`.
 */

// Common profanity — safe to include; not slurs. Exact matches.
export const PROFANITY: readonly string[] = [
  'fuck', 'fuk', 'fck', 'fuq', 'fux',
  'shit', 'sht', 'shyt',
  'bitch', 'biatch', 'btch',
  'asshole', 'azzhole', 'ashole',
  'bastard',
  'dick', 'dik',
  'cock',
  'pussy', 'pussi',
  'cunt', 'kunt',
  'whore', 'hoe', 'hoar',
  'slut',
  'piss',
  'jackoff', 'jerkoff',
  'dildo',
  'nude', 'naked', 'nudes',
  'boobs', 'boobies', 'titties',
  'penis', 'vagina',
];

// Slurs — universal block, no exceptions. Intentionally not exhaustive;
// the OpenAI layer catches gaps. Kept in a separate const so reviewers
// can tune the two lists independently.
export const SLURS: readonly string[] = [
  // racial
  'nigger', 'nigga', 'nigr', 'n1gger', 'n1gga',
  'chink', 'gook', 'spic', 'wetback', 'coon',
  'kike', 'hymie',
  'paki', 'sandnigger',
  // homophobic / transphobic
  'faggot', 'fag', 'fgt', 'f4g', 'dyke', 'tranny',
  // ableist
  'retard', 'retarded', 'ret4rd',
];

/**
 * Normalize input for blocklist matching.
 *   - lowercase
 *   - strip anything that isn't a-z0-9
 *   - collapse repeated chars (nnnnn → n) to defeat simple padding
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Check input against a list. Returns the matching entry if found.
 * Blocklist entries are also normalized at match time so stored forms
 * like `nigga` and `nigg4` match inputs that collapse similarly.
 */
export function findBlocklistMatch(
  input: string,
  list: readonly string[],
): string | null {
  const normalized = normalize(input);
  if (!normalized) return null;
  for (const entry of list) {
    const normEntry = normalize(entry);
    if (!normEntry) continue;
    if (normalized === normEntry || normalized.includes(normEntry)) {
      return entry;
    }
  }
  return null;
}
