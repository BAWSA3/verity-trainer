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

export interface TrainerPersonality {
  zodiac: Zodiac | '';
  likes: string[];     // 0-5 entries, each <=24 chars
  dislikes: string[];  // 0-5 entries, each <=24 chars
  // Optional show-on-card masks. Same length as likes/dislikes; absent or
  // mismatched length = treat all as shown. AI generates 5 each so the user
  // can curate which to surface on the public trainer card.
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
  // Optional one-line AI explanation surfaced as a subtitle on /card/[id]
  // and the OG image. Only present for AI-generated trainers; clamped to
  // 400 chars upstream by generate-trainer.ts.
  reasoning?: string;
}
