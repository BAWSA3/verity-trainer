// Trainer schema — V2 LimeZu (2026-04-29 redesign)
//
// LimeZu's Modern Interiors Character Generator is a paper-doll layered system.
// Layer order (bottom to top), per LimeZu's CHARACTER_GENERATOR.txt:
//   body      — skin tone variant
//   outfit    — single-piece clothing (top + bottom combined)
//   eyes      — eye style + color
//   hair      — hair style + color variant
//   accessory — hat / glasses / backpack / mustache (single optional slot)
//
// Sprites are 48 wide × 96 tall PNG, in 4 cardinal directions:
//   south (-s) - default front view, used for share cards + customizer
//   east  (-e), west (-w), north (-n) — available for V2 4-direction features
//
// Legacy v1 rows in trainer_signups.trainer_config use the pre-LimeZu Mana Seed
// shape ({ body, hair, hairColor, outfit, cloak, face, hat }). The unpackTrainer()
// adapter in src/lib/trainer-data.ts normalizes those into this shape on read —
// legacy rows render as blank silhouettes since their old top/bottom/face fields
// don't map onto LimeZu's slot model. Pre-launch app — accepted.

export const DIRECTIONS = ['s', 'e', 'w', 'n'] as const;
export type Direction = (typeof DIRECTIONS)[number];

// Tier system — TCG grading-coded rarity for the launch drop. Capacities
// are enforced server-side via the tier_supply table + roll_tier() RPC;
// rolling is weighted by remaining supply so distribution stays close
// to target even as rare tiers deplete.
export type TierKey = 'founder' | 'black-label' | 'gem' | 'mint' | 'near-mint';
export const TIER_KEYS: readonly TierKey[] = ['founder', 'black-label', 'gem', 'mint', 'near-mint'] as const;
export const TIER_CAPACITY: Record<TierKey, number> = {
  'founder': 1,
  'black-label': 30,
  'gem': 270,
  'mint': 900,
  'near-mint': 1800,
};
export const TIER_LABELS: Record<TierKey, string> = {
  'founder': 'FOUNDER',
  'black-label': 'BLACK LABEL',
  'gem': 'GEM',
  'mint': 'MINT',
  'near-mint': 'NEAR MINT',
};

export type Zodiac =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Category =
  | 'body'      // skin tone variant
  | 'eyes'      // eye style (optional, defaults 'none')
  | 'hair'      // hair style
  | 'hairColor' // hair color variant suffix on the hair PNG
  | 'outfit'    // single-piece outfit
  | 'accessory'; // optional hat / glasses / backpack / etc.

export interface TrainerOption {
  id: string;
  label: string;
}

export interface TrainerConfig {
  // Required-for-generate (must be non-empty before Generate enables).
  body: string;       // e.g. '01'..'09' (skin tone)
  hair: string;       // hair style id (e.g. '01'..'29')
  hairColor: string;  // hair color variant id (e.g. '01'..'07')
  outfit: string;     // outfit id (e.g. '01'..'33')

  // Optional layers — default to 'none', never empty string.
  eyes: string;
  accessory: string;
}

// V3 ability — Pokédex-style named flavor produced by the AI generator.
export interface TrainerAbility {
  /** Short title, ~16 char max (e.g. "Quick Wit"). */
  name: string;
  /** One-line description, ~80 char max. */
  description: string;
}

export interface TrainerPersonality {
  zodiac: Zodiac | '';
  // V3 — AI-generated, surfaced on the share card. 0-2 abilities.
  abilities?: TrainerAbility[];
  // V3.2 — Pokémon-style weaknesses paired with abilities. 0-2 entries,
  // same { name, description } shape. Same brand-safe floor as abilities.
  weaknesses?: TrainerAbility[];
  // V3.1 — sharp-edge roast quote (replaces V3 'knownFor' tagline).
  // Brand-safe floor: no race/sex/orientation/religion/disability content;
  // self-roast about productivity / online behavior / aesthetic / niches OK.
  quote?: string;
  /** @deprecated V3 only — read via unpackTrainer for back-compat. */
  knownFor?: string;

  // V2 legacy — likes/dislikes are deprecated in favour of abilities/quote
  // but kept for back-compat reads of pre-2026-05-01 rows.
  likes: string[];
  dislikes: string[];
  shownLikes?: boolean[];
  shownDislikes?: boolean[];
}

export interface SignupData {
  email: string;
  xHandle: string;
  trainerName: string;
  trainerConfig: TrainerConfig;
  trainerPersonality: TrainerPersonality;
}

// Stored shape for trainer_signups.trainer_config JSONB (v2).
// v1 rows omit schemaVersion + use the pre-LimeZu shape — see trainer-data.ts.
export interface StoredTrainer {
  schemaVersion: 2;
  config: TrainerConfig;
  personality: TrainerPersonality;
  source?: 'ai' | 'manual';
  reasoning?: string;
  // X handle of the trainer card whose QR scan brought this user here.
  referredBy?: string;
  // Rolled at signup time via roll_tier() RPC. Absent for legacy rows.
  tier?: TierKey;
  // V5 — AI-generated hero art (chibi character per user). Stored as
  // either a base64 data URI (`data:image/...`) or a public HTTPS URL.
  // When absent, the V5 card falls back to the LimeZu sprite renderer.
  heroArtSrc?: string;
}
