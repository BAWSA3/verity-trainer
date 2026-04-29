// Trainer schema — V2 (post hi-fi pixel redesign, 2026-04-29)
//
// Legacy v1 rows in `trainer_signups.trainer_config` use a flat shape with
// {face,neck,accessory,facialHair} and 'male'/'female' gender values. The
// `unpackTrainer()` adapter in `src/lib/trainer-data.ts` normalizes those
// into this shape on read — no SQL migration runs.

export type Gender = 'm' | 'f';

// '' is the "user hasn't picked this required slot yet" sentinel for the
// customizer's blank-start UX. Server-side `checkTrainerConfig` rejects
// '' for any REQUIRED_FOR_GENERATE field, blocking direct-API bypass.
export type MaybeGender = Gender | '';

export type Zodiac =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Category =
  | 'gender'
  | 'body'
  | 'hair'
  | 'hairColor'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'outerwear'
  | 'hat'
  | 'glasses'
  | 'expression';

export interface TrainerOption {
  id: string;
  label: string;
}

export interface TrainerConfig {
  // Required-for-generate. '' = unpicked.
  gender: MaybeGender;
  body: string;
  hair: string;
  hairColor: string;
  top: string;
  bottom: string;
  shoes: string;

  // Optional layers — default to 'none', never empty.
  outerwear: string;
  hat: string;
  glasses: string;
  expression: string;
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
