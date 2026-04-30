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

// Common profanity + sexual/NSFW terms — safe to block; not slurs.
// Matched as substrings against normalized input (lowercase, alphanumeric-only,
// collapsed repeats) so variants like "porn3" or "p o r n" catch too.
export const PROFANITY: readonly string[] = [
  // Classic profanity
  'fuck', 'fuk', 'fck', 'fuq', 'fux', 'fxck', 'phuck',
  'shit', 'sht', 'shyt', 'shyte',
  'bitch', 'biatch', 'btch', 'bich',
  'asshole', 'azzhole', 'ashole', 'asshat',
  'bastard',
  'dick', 'dik', 'd1ck', 'dck',
  'cock', 'c0ck',
  'pussy', 'pussi', 'pu55y', 'pussay',
  'cunt', 'kunt', 'c0nt',
  'whore', 'hoar', 'whor',
  'slut', 'slvt',
  'piss',
  'jackoff', 'jerkoff', 'jerkof',

  // Sexual / NSFW
  'porn', 'porno', 'pornstar', 'pornhub', 'p0rn', 'pr0n', 'pohrn', 'pawn',
  'sex', 's3x', 'sx', 'sxy', 'sexy', 'sexi',
  'xxx', 'xxxx',
  'nsfw',
  'anal', 'anul',
  'horny', 'h0rny', 'hrny',
  'jizz', 'jism', 'cum', 'kum', 'cumshot', 'cumming',
  'orgasm', 'cumslut',
  'rape', 'rapist', 'r4pe',
  'pedo', 'pedophile', 'pedofile', 'ped0',
  'loli', 'l0li', 'shota', 'sh0ta',
  'milf', 'dilf', 'gilf',
  'gangbang', 'threesome',
  'blowjob', 'blowjb', 'handjob', 'rimjob',
  'deepthroat', 'throatfuck',
  'masturbate', 'masturbation', 'fap', 'fapping',
  'erotic', 'erotica', 'kinky',
  'fetish',
  'bdsm',
  'bukkake',
  'ejaculate', 'ejaculation',
  'clit', 'clitoris',
  'nipple', 'nipples',
  'sperm',
  'incest',
  'dildo', 'vibrator', 'buttplug',
  'nude', 'naked', 'nudes', 'nude4',
  'boobs', 'boobies', 'boobie', 'titties', 'tittie', 'titty', 'tits',
  'penis', 'vagina', 'vulva',
  'ballsack', 'scrotum', 'testicle', 'testicles',
  'stripper', 'stripclub',
  'hentai', 'ecchi',
  'onlyfans',
  'escort',
  'camgirl', 'camboy',
];

// Crude / sexual slang the PROFANITY list misses. AI-output-only — gets
// added on top of PROFANITY when scrubbing model output. Keep this tight:
// every entry should have ZERO legitimate use as a chip. If a term has
// any common non-sexual meaning, leave it out and rely on OpenAI moderation
// instead. Tune by adding what AI generation repeatedly emits in dev logs.
export const CRUDE: readonly string[] = [
  'coochie', 'kooch', 'cooch',
  'thicc', 'thique',
  'bussy',
  'freaky', 'freakshow',
  'kinky',
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
