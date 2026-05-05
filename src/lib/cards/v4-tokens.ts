import type { TierKey } from '@/types/trainer';

// V4 card chassis tokens — driven by the 5 reference PNGs the design lead
// produced (design-templates/red.png, green.png, blue.png, black label.png,
// special.png). One token bundle per tier; the V4 component renders a single
// JSX layout and swaps colors via this map.
//
// Where spec and reference PNG disagreed, the reference PNGs win (e.g. spec
// claims red tier inner panel = #ff3131 but the reference shows white). See
// `verity-trainer-card-spec.md` for the spec text; this map is the implemented
// truth.

export interface CardPalette {
  /** Outer card background. May be a CSS color string or a linear-gradient(...). */
  outerBg: string;
  /** Inner content panel (table + abilities/weaknesses + QR area). */
  innerBg: string;
  /** 1px stroke around the inner panel. */
  innerBorder: string;
  /** "VERITY CARD" header band text color. */
  headerText: string;
  /** Display name + handle text color. */
  nameText: string;
  /** Quote text color. */
  quoteText: string;
  /** TRAINER vertical text color. */
  trainerText: string;
  /** Bottom URL text color. */
  urlText: string;
  /** Verity logo mark color (matches urlText). */
  markColor: string;
}

// Spec §5 — values are the source of truth. The inner panel and outer card
// share the same background on most tiers (only the inner panel BORDER
// distinguishes them visually); the spec calls this out explicitly.

const NEAR_MINT: CardPalette = {
  outerBg: '#ff3131',
  innerBg: '#ff3131',
  innerBorder: '#ffffff',
  headerText: '#ffffff',
  nameText: '#000000',
  quoteText: '#000000',
  trainerText: '#ffffff',
  urlText: '#ffffff',
  markColor: '#ffffff',
};

const MINT: CardPalette = {
  outerBg: 'linear-gradient(90deg, #a8bfb2 0%, #2d5043 100%)',
  innerBg: '#dcdbd6',
  innerBorder: '#000000',
  headerText: '#000000',
  nameText: '#000000',
  quoteText: '#000000',
  trainerText: '#436457',
  urlText: '#000000',
  markColor: '#436457',
};

const GEM: CardPalette = {
  outerBg: '#468bd5',
  innerBg: '#468bd5',
  innerBorder: '#ffffff',
  headerText: '#ffde59',
  nameText: '#e7ded7',
  quoteText: '#e7ded7',
  trainerText: '#ffde59',
  urlText: '#ffde59',
  markColor: '#ffde59',
};

const BLACK_LABEL: CardPalette = {
  outerBg: '#000000',
  innerBg: '#000000',
  innerBorder: '#ffde59',
  headerText: '#ffde59',
  nameText: '#ffde59',
  quoteText: '#ffde59',
  trainerText: '#ffde59',
  urlText: '#ffde59',
  markColor: '#ffde59',
};

const FOUNDER: CardPalette = {
  outerBg: 'linear-gradient(90deg, #fff7ad 0%, #d984d3 100%)',
  innerBg: 'linear-gradient(90deg, #fff7ad 0%, #d984d3 100%)',
  innerBorder: '#000000',
  headerText: '#000000',
  nameText: '#000000',
  quoteText: '#000000',
  trainerText: '#000000',
  urlText: '#000000',
  markColor: '#000000',
};

export const TIER_PALETTES: Record<TierKey, CardPalette> = {
  'near-mint':   NEAR_MINT,
  'mint':        MINT,
  'gem':         GEM,
  'black-label': BLACK_LABEL,
  'founder':     FOUNDER,
};

// Per-claim probability weights, per spec §6.1. FOUNDER is intentionally
// excluded — it's pre-seeded server-side at a target claim number, not
// rolled here. If the trainer row already carries `tier`, prefer that.
const TIER_WEIGHTS: Record<Exclude<TierKey, 'founder'>, number> = {
  'near-mint':   60,
  'mint':        30,
  'gem':         9,
  'black-label': 1,
};

const ROLLABLE: ReadonlyArray<Exclude<TierKey, 'founder'>> =
  ['near-mint', 'mint', 'gem', 'black-label'] as const;

/**
 * Deterministic tier roll from a string seed (typically the card UUID).
 * Used as a *visual fallback* when the trainer row has no `tier` field —
 * the canonical roll happens server-side at signup. Same id → same tier.
 *
 * Founder is never returned here. Founder is awarded to the pre-seeded
 * winning claim by the backend; once that lands, the row carries
 * `tier: 'founder'` and `unpackTrainer` returns it directly.
 */
export function rollTierFromSeed(seed: string): TierKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  const total = ROLLABLE.reduce((sum, t) => sum + TIER_WEIGHTS[t], 0);
  const roll = Math.abs(hash) % total;
  let cum = 0;
  for (const t of ROLLABLE) {
    cum += TIER_WEIGHTS[t];
    if (roll < cum) return t;
  }
  return 'near-mint';
}

/** Pick the palette to render. Prefer DB-stored tier; fall back to deterministic roll. */
export function resolveTier(stored: TierKey | undefined, seed: string): TierKey {
  if (stored) return stored;
  return rollTierFromSeed(seed);
}
