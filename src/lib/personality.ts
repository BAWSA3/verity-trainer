import type { Zodiac } from '@/types/trainer';

export const ZODIAC_OPTIONS: { id: Zodiac; label: string; glyph: string }[] = [
  { id: 'aries',       label: 'Aries',       glyph: '♈' },
  { id: 'taurus',      label: 'Taurus',      glyph: '♉' },
  { id: 'gemini',      label: 'Gemini',      glyph: '♊' },
  { id: 'cancer',      label: 'Cancer',      glyph: '♋' },
  { id: 'leo',         label: 'Leo',         glyph: '♌' },
  { id: 'virgo',       label: 'Virgo',       glyph: '♍' },
  { id: 'libra',       label: 'Libra',       glyph: '♎' },
  { id: 'scorpio',     label: 'Scorpio',     glyph: '♏' },
  { id: 'sagittarius', label: 'Sagittarius', glyph: '♐' },
  { id: 'capricorn',   label: 'Capricorn',   glyph: '♑' },
  { id: 'aquarius',    label: 'Aquarius',    glyph: '♒' },
  { id: 'pisces',      label: 'Pisces',      glyph: '♓' },
];

export const ZODIAC_GLYPHS: Record<Zodiac, string> = Object.fromEntries(
  ZODIAC_OPTIONS.map((z) => [z.id, z.glyph]),
) as Record<Zodiac, string>;

// Stat modifiers applied to CHARISMA in generateStats(). Sums to 0 across
// signs so no single zodiac is universally better — variance only.
export const ZODIAC_MODIFIERS: Record<Zodiac, number> = {
  aries:        +5,
  taurus:       -2,
  gemini:       +4,
  cancer:       -3,
  leo:          +5,
  virgo:        -1,
  libra:        +2,
  scorpio:      +3,
  sagittarius:  +4,
  capricorn:    -4,
  aquarius:     +1,
  pisces:       -2,
};

export function isValidZodiac(value: unknown): value is Zodiac {
  return typeof value === 'string'
    && ZODIAC_OPTIONS.some((z) => z.id === value);
}

export const VALID_ZODIACS: ReadonlySet<string> = new Set(ZODIAC_OPTIONS.map((z) => z.id));
