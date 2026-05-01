import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import { ZODIAC_MODIFIERS } from './personality';

// Deterministic stat generation. Same (config, personality) -> same stats,
// so the OG image's stats always match the page's stats.

export function hashConfig(c: TrainerConfig, p: TrainerPersonality): number {
  const str = [
    c.body, c.hair, c.hairColor, c.outfit,
    c.eyes, c.accessory,
    p.zodiac, ...p.likes, ...p.dislikes,
  ].join('-');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// V3 trainer-coded stats: PRESENCE, WIT, TASTE, RESOLVE.
// The shape replaces v2's style/charisma/street/luck. Legacy v2 rows still
// compute these (with `likes` length defaulting to 0 for influence on RESOLVE).
export interface TrainerStats {
  presence: number;
  wit: number;
  taste: number;
  resolve: number;
}

export const STAT_LABELS: Record<keyof TrainerStats, string> = {
  presence: 'PRESENCE',
  wit: 'WIT',
  taste: 'TASTE',
  resolve: 'RESOLVE',
};

const MIN_STAT = 40;
const MAX_STAT = 100;
const RANGE = MAX_STAT - MIN_STAT + 1;
const clamp = (n: number) => Math.max(MIN_STAT, Math.min(MAX_STAT, n));

export function generateStats(c: TrainerConfig, p: TrainerPersonality): TrainerStats {
  const h = hashConfig(c, p);
  const zodiacMod = p.zodiac ? (ZODIAC_MODIFIERS[p.zodiac as Zodiac] ?? 0) : 0;
  const accessoryBonus = c.accessory && c.accessory !== 'none' ? 8 : 0;
  // Resolve was previously boosted by likes count. With v3 abilities replacing
  // likes, fall back to abilities count or knownFor presence as the bonus.
  const lateBonus = (p.abilities?.length ?? p.likes?.length ?? 0) * 2;
  return {
    presence: clamp(MIN_STAT + (h % RANGE) + zodiacMod),
    wit:      clamp(MIN_STAT + ((h >> 8)  % RANGE)),
    taste:    clamp(MIN_STAT + ((h >> 16) % RANGE) + accessoryBonus),
    resolve:  clamp(MIN_STAT + ((h >> 24) % RANGE) + lateBonus),
  };
}
