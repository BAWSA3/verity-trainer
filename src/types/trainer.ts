export type Category = 'body' | 'hair' | 'top' | 'bottom' | 'accessory';

export interface TrainerOption {
  id: string;
  label: string;
  pixels: string[][]; // 32x32 grid of hex colors ("" = transparent)
}

export interface TrainerConfig {
  body: string;
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
