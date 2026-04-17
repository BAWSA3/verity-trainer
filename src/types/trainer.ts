export type Gender = 'male' | 'female';

export type Category = 'gender' | 'body' | 'hair' | 'top' | 'bottom' | 'accessory';

export interface TrainerOption {
  id: string;
  label: string;
  pixels: string[][]; // 32x32 grid of hex colors ("" = transparent) — legacy fallback
}

export interface TrainerConfig {
  gender: Gender;
  body: string;     // skin tone id (porcelain, light, ..., ebony)
  hair: string;
  top: string;
  bottom: string;
  accessory: string;
}

export interface SignupData {
  email: string;
  xHandle: string;
  trainerName: string;
  trainerConfig: TrainerConfig;
}
