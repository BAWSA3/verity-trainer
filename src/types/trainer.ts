// Trainer schema — V2 (Mana Seed paper-doll model, 2026-04-29)
//
// Mana Seed's Character Base is gender-neutral with a unified outfit layer.
// Layer order (per Seliel's `using this base.txt` guide), lowest to highest:
//   0bas (body)
//   1out (outfit — single piece, top + bottom combined)
//   2clo (cloaks / capes / mantles)
//   3fac (face items — glasses, masks)
//   4har (hair)
//   5hat (hats / hoods)
//   6tla / 7tlb (tools — weapons / shields, skipped for V1)
//
// Legacy v1 rows in trainer_signups.trainer_config use the pre-redesign
// shape with {face, neck, accessory, facialHair, gender}. The unpackTrainer()
// adapter in src/lib/trainer-data.ts normalizes those into this shape on
// read — no SQL migration runs.

export type Zodiac =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Category =
  | 'body'      // 0bas — skin tone variant
  | 'hair'      // 4har — hair style
  | 'hairColor' // variant suffix on the hair PNG (v00..v13)
  | 'outfit'    // 1out — unified top + bottom outfit
  | 'cloak'     // 2clo — optional cloak / cape / mantle
  | 'face'      // 3fac — optional glasses / mask
  | 'hat';      // 5hat — optional hat / hood

export interface TrainerOption {
  id: string;
  label: string;
}

export interface TrainerConfig {
  // Required-for-generate (must be non-empty before Generate enables).
  body: string;       // skin-tone variant id (e.g. 'v01'..'v10')
  hair: string;       // hair style id (e.g. 'bob1', 'dap1')
  hairColor: string;  // hair variant id (e.g. 'v00'..'v13')
  outfit: string;     // outfit id (e.g. 'fstr', 'pfpn')

  // Optional layers — default to 'none', never empty string.
  cloak: string;
  face: string;
  hat: string;
}

export interface TrainerPersonality {
  zodiac: Zodiac | '';
  likes: string[];     // 0-5 entries, each <=24 chars
  dislikes: string[];  // 0-5 entries, each <=24 chars
}

export interface SignupData {
  email: string;
  xHandle: string;
  trainerName: string;
  trainerConfig: TrainerConfig;
  trainerPersonality: TrainerPersonality;
}

// Stored shape for trainer_signups.trainer_config JSONB (v2).
// v1 rows omit schemaVersion + nest config differently — see trainer-data.ts.
export interface StoredTrainer {
  schemaVersion: 2;
  config: TrainerConfig;
  personality: TrainerPersonality;
}
