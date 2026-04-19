export type Gender = 'male' | 'female';

// Empty-string sentinel used in INITIAL_CONFIG to mean "user hasn't picked
// this trait yet". Required-for-generate categories use this when blank.
export type MaybeGender = Gender | '';

export type Category =
  | 'gender'
  | 'body'
  | 'facialHair'
  | 'hair'
  | 'hairColor'
  | 'face'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'neck'
  | 'accessory';

export interface TrainerOption {
  id: string;
  label: string;
  pixels: string[][]; // 32x32 grid of hex colors ("" = transparent) — legacy fallback
}

export interface TrainerConfig {
  // Required-for-generate categories use '' as the "not yet picked" sentinel.
  // Once the user hits Generate, all of these are guaranteed non-empty
  // (enforced by isReadyToGenerate + SignupGate client gate).
  gender: MaybeGender;
  body: string;       // skin tone id; '' if unset
  hair: string;       // style id; '' if unset
  hairColor: string;  // '' if unset
  top: string;        // '' if unset
  bottom: string;     // '' if unset
  shoes: string;      // '' if unset

  // Optional categories — default to 'none', never empty.
  facialHair: string; // 'none' | shadow | beard | ...
  face: string;       // 'none' | sunnies | ...
  neck: string;       // 'none' | chain | ...
  accessory: string;  // 'none' | hat id ...
}

export interface SignupData {
  email: string;
  xHandle: string;
  trainerName: string;
  trainerConfig: TrainerConfig;
}
