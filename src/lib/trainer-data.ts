import type {
  TrainerConfig,
  TrainerPersonality,
  StoredTrainer,
} from '@/types/trainer';

// Two `trainer_signups.trainer_config` JSONB shapes coexist:
//
//   v1 (legacy, pre-2026-04-29): bare TrainerConfig with old keys
//     { gender:'male'|'female', body, hair, hairColor, top, bottom, shoes,
//       face, neck, accessory, facialHair }
//
//   v2 (current, Mana Seed paper-doll model): { schemaVersion: 2,
//     config: { body, hair, hairColor, outfit, cloak, face, hat },
//     personality: { zodiac, likes, dislikes } }
//
// Reads MUST go through unpackTrainer() — direct row.trainer_config usage
// will misrender legacy rows.

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

  // v1 path: bare config, no personality. Best-effort migration —
  // v1's top/bottom/face/neck/accessory don't map cleanly onto Mana Seed's
  // unified outfit + paper-doll layers, so legacy rows render as a blank
  // body. Trainers from v1 will need to revisit /create to pick a v2 config.
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

  return {
    body: get('body'),
    hair: get('hair'),
    hairColor: get('hairColor'),
    outfit: get('outfit'),
    cloak: get('cloak') || 'none',
    face: get('face') || 'none',
    hat: get('hat') || 'none',
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
    body: '',
    hair: '',
    hairColor: '',
    outfit: '',
    cloak: 'none',
    face: 'none',
    hat: 'none',
  };
}
