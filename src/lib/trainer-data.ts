import type {
  TrainerConfig,
  TrainerPersonality,
  StoredTrainer,
} from '@/types/trainer';

// Two `trainer_signups.trainer_config` JSONB shapes coexist:
//
//   v1 (pre-2026-04-29 / pre-LimeZu, includes both the very early gender-split
//       Mana Seed schema and the gender-neutral Mana Seed v2):
//     either bare TrainerConfig or { schemaVersion: 2, config: <Mana Seed> }
//     Mana Seed shape: { body, hair, hairColor, outfit, cloak, face, hat }
//
//   v2 (current, LimeZu): { schemaVersion: 2,
//     config: { body, hair, hairColor, outfit, eyes, accessory },
//     personality: { zodiac, likes, dislikes },
//     source?: 'ai' | 'manual' }
//
// Mana Seed-era rows survive the parse but render as blank silhouettes since
// their cloak/face/hat fields don't map onto LimeZu's slots — those users
// will need to revisit /create.

interface UnpackedTrainer {
  config: TrainerConfig;
  personality: TrainerPersonality;
  source?: 'ai' | 'manual';
  reasoning?: string;
  referredBy?: string;
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

  // schemaVersion 2 path — covers BOTH Mana Seed v2 and LimeZu v2 shapes.
  // Mana Seed-era configs lack eyes/accessory; normalizeConfig fills with 'none'.
  if ((obj.schemaVersion as number) === 2 && obj.config && obj.personality) {
    const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning : undefined;
    const referredBy = typeof obj.referredBy === 'string'
      ? obj.referredBy.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || undefined
      : undefined;
    return {
      config: normalizeConfig(obj.config as Record<string, unknown>),
      personality: normalizePersonality(obj.personality as Record<string, unknown>),
      source: obj.source === 'ai' || obj.source === 'manual' ? obj.source : undefined,
      reasoning,
      referredBy,
    };
  }

  // Pre-schemaVersion path: bare config object, no personality. Best-effort —
  // returns a blank config where legacy fields don't map.
  return {
    config: normalizeConfig(obj),
    personality: EMPTY_PERSONALITY,
  };
}

export function packTrainer(
  config: TrainerConfig,
  personality: TrainerPersonality,
  source?: 'ai' | 'manual',
  reasoning?: string,
  referredBy?: string,
): StoredTrainer {
  const stored: StoredTrainer = { schemaVersion: 2, config, personality };
  if (source) stored.source = source;
  if (reasoning) stored.reasoning = reasoning.slice(0, 400);
  if (referredBy) {
    const cleaned = referredBy.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
    if (cleaned) stored.referredBy = cleaned;
  }
  return stored;
}

function normalizeConfig(raw: Record<string, unknown>): TrainerConfig {
  const get = (k: string): string =>
    typeof raw[k] === 'string' ? (raw[k] as string) : '';

  return {
    body: get('body'),
    hair: get('hair'),
    hairColor: get('hairColor'),
    outfit: get('outfit'),
    eyes: get('eyes') || 'none',
    accessory: get('accessory') || 'none',
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

  const rawShownLikes = Array.isArray(raw.shownLikes)
    ? raw.shownLikes.map((v) => v === true)
    : undefined;
  const rawShownDislikes = Array.isArray(raw.shownDislikes)
    ? raw.shownDislikes.map((v) => v === true)
    : undefined;

  // V3 abilities — { name, description }[]. Cap at 2 entries.
  const abilities = Array.isArray(raw.abilities)
    ? (raw.abilities as unknown[])
        .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
        .map((a) => ({
          name: typeof a.name === 'string' ? a.name.slice(0, 32) : '',
          description: typeof a.description === 'string' ? a.description.slice(0, 140) : '',
        }))
        .filter((a) => a.name.length > 0)
        .slice(0, 2)
    : undefined;

  const knownFor = typeof raw.knownFor === 'string'
    ? raw.knownFor.slice(0, 200)
    : undefined;

  const out: TrainerPersonality = {
    zodiac: zodiac as TrainerPersonality['zodiac'],
    likes,
    dislikes,
  };
  if (rawShownLikes && rawShownLikes.length === likes.length) {
    out.shownLikes = rawShownLikes;
  }
  if (rawShownDislikes && rawShownDislikes.length === dislikes.length) {
    out.shownDislikes = rawShownDislikes;
  }
  if (abilities && abilities.length > 0) out.abilities = abilities;
  if (knownFor) out.knownFor = knownFor;
  return out;
}

function emptyConfig(): TrainerConfig {
  return {
    body: '',
    hair: '',
    hairColor: '',
    outfit: '',
    eyes: 'none',
    accessory: 'none',
  };
}
