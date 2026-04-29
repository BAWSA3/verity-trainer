import type {
  TrainerConfig,
  TrainerPersonality,
  StoredTrainer,
  Gender,
} from '@/types/trainer';

// Two `trainer_signups.trainer_config` JSONB shapes coexist:
//
//   v1 (legacy, pre-2026-04-29): bare TrainerConfig with old keys
//     { gender:'male'|'female', face, neck, accessory, facialHair, ... }
//
//   v2 (current): { schemaVersion: 2, config: TrainerConfig, personality: TrainerPersonality }
//
// Read paths MUST go through unpackTrainer() — direct row.trainer_config
// usage will misrender legacy rows.

const LEGACY_TO_V2_GENDER: Record<string, Gender> = {
  male: 'm',
  female: 'f',
  m: 'm',
  f: 'f',
};

interface UnpackedTrainer {
  config: TrainerConfig;
  personality: TrainerPersonality;
}

const EMPTY_PERSONALITY: TrainerPersonality = {
  zodiac: '',
  likes: [],
  dislikes: [],
};

export function unpackTrainer(row: { trainer_config: unknown }): UnpackedTrainer {
  const raw = row?.trainer_config;
  if (!raw || typeof raw !== 'object') {
    return { config: emptyConfig(), personality: EMPTY_PERSONALITY };
  }

  const obj = raw as Record<string, unknown>;

  // v2 path
  if ((obj.schemaVersion as number) === 2 && obj.config && obj.personality) {
    return {
      config: normalizeConfig(obj.config as Record<string, unknown>),
      personality: normalizePersonality(obj.personality as Record<string, unknown>),
    };
  }

  // v1 path: bare config, no personality
  return {
    config: normalizeConfig(obj),
    personality: EMPTY_PERSONALITY,
  };
}

export function packTrainer(
  config: TrainerConfig,
  personality: TrainerPersonality,
): StoredTrainer {
  return { schemaVersion: 2, config, personality };
}

function normalizeConfig(raw: Record<string, unknown>): TrainerConfig {
  const get = (k: string): string =>
    typeof raw[k] === 'string' ? (raw[k] as string) : '';

  // Gender migrates 'male'|'female' -> 'm'|'f'
  const rawGender = get('gender');
  const gender = (LEGACY_TO_V2_GENDER[rawGender] ?? '') as Gender | '';

  return {
    gender: gender as TrainerConfig['gender'],
    body: get('body'),
    hair: get('hair'),
    hairColor: get('hairColor') || 'black',
    top: get('top'),
    bottom: get('bottom'),
    shoes: get('shoes'),

    // Optional layers — default to 'none' if missing.
    // Legacy rows had `accessory`, `face`, `neck`, `facialHair` — we drop
    // those entirely. The new optional layers don't exist on legacy rows,
    // which is fine: they default to 'none' and the renderer skips them.
    outerwear: get('outerwear') || 'none',
    hat: get('hat') || 'none',
    glasses: get('glasses') || 'none',
    expression: get('expression') || 'none',
  };
}

function normalizePersonality(raw: Record<string, unknown>): TrainerPersonality {
  const zodiac = typeof raw.zodiac === 'string' ? raw.zodiac : '';
  const likes = Array.isArray(raw.likes)
    ? raw.likes.filter((s): s is string => typeof s === 'string').slice(0, 5)
    : [];
  const dislikes = Array.isArray(raw.dislikes)
    ? raw.dislikes.filter((s): s is string => typeof s === 'string').slice(0, 5)
    : [];
  return {
    zodiac: zodiac as TrainerPersonality['zodiac'],
    likes,
    dislikes,
  };
}

function emptyConfig(): TrainerConfig {
  return {
    gender: '',
    body: '',
    hair: '',
    hairColor: 'black',
    top: '',
    bottom: '',
    shoes: '',
    outerwear: 'none',
    hat: 'none',
    glasses: 'none',
    expression: 'none',
  };
}
