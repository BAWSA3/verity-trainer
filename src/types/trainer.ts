export type Gender = 'male' | 'female';

export type Category =
  | 'gender'
  | 'body'
  | 'facialHair'
  | 'hair'
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
  gender: Gender;
  body: string;       // skin tone id (porcelain, light, ..., ebony)
  facialHair: string; // 'none' | shadow | beard | trimmed | goatee | chevron | handlebar
  hair: string;
  face: string;       // 'none' | sunnies | nerd | round-frame | secretary | mask
  top: string;
  bottom: string;
  shoes: string;      // 'none' | sneakers | boots | hi-tops | low-tops | fold-boot
  neck: string;       // 'none' | chain | simple | beaded-lg | beaded-sm
  accessory: string;  // hat (existing)
}

export interface SignupData {
  email: string;
  xHandle: string;
  trainerName: string;
  trainerConfig: TrainerConfig;
}
