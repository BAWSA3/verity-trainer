import type { TierKey } from '@/types/trainer';

// V5 card tokens — shared between the DOM renderer (TrainerCardV5.tsx)
// and the OG image route (/api/og). Keeps the two surfaces in lockstep.

// Short tier codes for the metadata pills on the card body.
export const TIER_CODES: Record<TierKey, string> = {
  'near-mint':   'NM01',
  'mint':        'MT02',
  'gem':         'GM03',
  'black-label': 'BL04',
  'founder':     'F1/1',
};

// PSA-style numeric grades — communicates rarity in a TCG-native way.
// FOUNDER 1/1 always grades a perfect 10; rarity descends from there.
export const TIER_GRADES: Record<TierKey, string> = {
  'near-mint':   '8.0',
  'mint':        '8.5',
  'gem':         '9.0',
  'black-label': '9.5',
  'founder':     '10.0',
};

// Full tier display names for the slab strip.
export const TIER_DISPLAY: Record<TierKey, string> = {
  'near-mint':   'NEAR MINT',
  'mint':        'MINT',
  'gem':         'GEM',
  'black-label': 'BLACK LABEL',
  'founder':     'FOUNDER 1/1',
};

// Hero block bg per tier — solid tier color with a radial spotlight
// behind the character. Pixel-art scenes were tried but felt too busy.
export const HERO_BG: Record<TierKey, string> = {
  'near-mint':   'radial-gradient(ellipse 75% 70% at 50% 55%, #ff5454 0%, #ff3131 45%, #b81818 100%)',
  'mint':        'radial-gradient(ellipse 75% 70% at 50% 55%, #c5d8c8 0%, #6b9583 50%, #2d5043 100%)',
  'gem':         'radial-gradient(ellipse 75% 70% at 50% 55%, #6ba6e0 0%, #468bd5 50%, #1f548c 100%)',
  'black-label': 'radial-gradient(ellipse 75% 70% at 50% 55%, #2a2a2a 0%, #141414 50%, #000000 100%)',
  'founder':     'radial-gradient(ellipse 75% 70% at 50% 55%, #ffe989 0%, #f0a8e0 50%, #b35aa5 100%)',
};
