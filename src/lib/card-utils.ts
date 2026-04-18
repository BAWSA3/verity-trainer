import { TrainerConfig } from '@/types/trainer';
import {
  BODY_OPTIONS,
  HAIR_OPTIONS,
  TOP_OPTIONS,
  BOTTOM_OPTIONS,
  ACCESSORY_OPTIONS,
} from './trainer-options';

// ---------------------------------------------------------------------------
// Hash + stat generation
// ---------------------------------------------------------------------------

export function hashConfig(config: TrainerConfig): number {
  const str = [
    config.gender,
    config.body,
    config.hair,
    config.top,
    config.bottom,
    config.accessory,
    config.facialHair,
    config.face,
    config.neck,
    config.shoes,
  ].join('-');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateStats(config: TrainerConfig) {
  const h = hashConfig(config);
  return {
    style: 40 + (h % 61),         // 40-100
    drip: 40 + ((h >> 8) % 61),   // 40-100
    flex: 40 + ((h >> 16) % 61),  // 40-100
  };
}

// ---------------------------------------------------------------------------
// Encoding (used for shareable short URLs — legacy, may not be actively used)
// Kept for backward compat; not worth expanding for new categories
// ---------------------------------------------------------------------------

export function encodeConfig(config: TrainerConfig): string {
  const g = config.gender === 'female' ? 1 : 0;
  const bo = BODY_OPTIONS.findIndex(o => o.id === config.body);
  const h = HAIR_OPTIONS.findIndex(o => o.id === config.hair);
  const t = TOP_OPTIONS.findIndex(o => o.id === config.top);
  const b = BOTTOM_OPTIONS.findIndex(o => o.id === config.bottom);
  const a = ACCESSORY_OPTIONS.findIndex(o => o.id === config.accessory);
  return `${g}-${bo}-${h}-${t}-${b}-${a}`;
}

export function decodeConfig(encoded: string): TrainerConfig {
  const parts = encoded.split('-').map(Number);
  const hasGender = parts.length === 6;
  const [g, bo, h, t, b, a] = hasGender ? parts : [0, ...parts];
  return {
    gender: g === 1 ? 'female' : 'male',
    body: BODY_OPTIONS[bo]?.id ?? BODY_OPTIONS[1].id,
    hair: HAIR_OPTIONS[h]?.id ?? HAIR_OPTIONS[0].id,
    top: TOP_OPTIONS[t]?.id ?? TOP_OPTIONS[0].id,
    bottom: BOTTOM_OPTIONS[b]?.id ?? BOTTOM_OPTIONS[0].id,
    accessory: ACCESSORY_OPTIONS[a]?.id ?? ACCESSORY_OPTIONS[0].id,
    // New categories default to sensible values; shareable URLs don't encode these
    facialHair: 'none',
    face: 'none',
    neck: 'none',
    shoes: 'sneakers',
  };
}
