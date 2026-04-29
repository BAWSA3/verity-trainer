// Trait catalog adapter — thin layer over public/sprites/limezu/manifest.json.
//
// Pre-V1 redesign this file was 54KB of hand-coded pixel arrays. It's now a
// shim that exposes the same public surface (CATEGORIES, INITIAL_CONFIG,
// REQUIRED_FOR_GENERATE, isReadyToGenerate) sourced from the generated
// manifest. Adding/removing trait options is a manifest change, not a code
// change.

import type { Category, TrainerConfig, TrainerOption } from '@/types/trainer';
import manifest from '../../public/sprites/limezu/manifest.json';

// ---- manifest types (loose — matches the JSON shape) ----
interface ManifestValue {
  id: string;
  label?: string;
  file?: string;
  gender?: 'm' | 'f';
  hex?: string;
}
interface ManifestCategory {
  values: ManifestValue[];
  gendered?: boolean;
  optional?: boolean;
  supportsColor?: boolean;
}
interface Manifest {
  version: number;
  spriteWidth: number;
  spriteHeight: number;
  bustCrop: { x: number; y: number; w: number; h: number };
  categories: Record<string, ManifestCategory>;
}
const MANIFEST = manifest as Manifest;

// ---- public surface ----

export interface TraitCategory {
  key: keyof TrainerConfig;
  label: string;
  options: TrainerOption[];
  /** True when the user MUST pick a value before Generate is allowed. */
  required: boolean;
  /** When true, the option list is filtered by current `gender`. */
  gendered: boolean;
}

// Order is the order the categories appear in the customizer (and check-config
// validates). Keep `gender` first — it gates the gendered lookups for body/top/bottom/outerwear.
const CATEGORY_LABELS: { key: keyof TrainerConfig; label: string }[] = [
  { key: 'gender',     label: 'Gender' },
  { key: 'body',       label: 'Skin' },
  { key: 'hair',       label: 'Hair' },
  { key: 'hairColor',  label: 'Hair Color' },
  { key: 'top',        label: 'Top' },
  { key: 'bottom',     label: 'Bottom' },
  { key: 'shoes',      label: 'Shoes' },
  { key: 'outerwear',  label: 'Outerwear' },
  { key: 'hat',        label: 'Hat' },
  { key: 'glasses',    label: 'Glasses' },
  { key: 'expression', label: 'Expression' },
];

// Required-for-generate categories — empty string for any of these blocks Generate.
// Optional categories use 'none' as the "not picked" sentinel and are always allowed empty.
export const REQUIRED_FOR_GENERATE: ReadonlyArray<keyof TrainerConfig> = [
  'gender', 'body', 'hair', 'hairColor', 'top', 'bottom', 'shoes',
];

const REQUIRED_SET: ReadonlySet<string> = new Set<string>(REQUIRED_FOR_GENERATE as readonly string[]);

// Hardcoded gender options — not from manifest because gender doesn't have sprites of its own.
const GENDER_OPTIONS: TrainerOption[] = [
  { id: 'm', label: 'Male' },
  { id: 'f', label: 'Female' },
];

function manifestToOptions(cat: ManifestCategory | undefined): TrainerOption[] {
  if (!cat) return [];
  return cat.values.map((v) => ({ id: v.id, label: v.label ?? v.id }));
}

export const CATEGORIES: TraitCategory[] = CATEGORY_LABELS.map(({ key, label }) => {
  if (key === 'gender') {
    return { key, label, options: GENDER_OPTIONS, required: true, gendered: false };
  }
  const cat = MANIFEST.categories[key as Category];
  let options = manifestToOptions(cat);

  // For optional categories, prepend a 'none' option so the customizer can show "no hat".
  if (cat?.optional) {
    options = [{ id: 'none', label: 'None' }, ...options];
  }

  return {
    key,
    label,
    options,
    required: REQUIRED_SET.has(key),
    gendered: cat?.gendered ?? false,
  };
});

export const INITIAL_CONFIG: TrainerConfig = {
  // Required slots blank — user picks before Generate enables.
  gender: '',
  body: '',
  hair: '',
  hairColor: 'black',
  top: '',
  bottom: '',
  shoes: '',
  // Optional slots default to 'none'.
  outerwear: 'none',
  hat: 'none',
  glasses: 'none',
  expression: 'none',
};

export function isReadyToGenerate(config: TrainerConfig): boolean {
  for (const key of REQUIRED_FOR_GENERATE) {
    const value = config[key];
    if (!value || value === 'none') return false;
  }
  return true;
}

// ---- sprite-path helpers (used by TrainerSprite + OG route) ----

const ROOT = '/sprites/limezu';

export function bodyPath(gender: 'm' | 'f', id: string): string {
  return `${ROOT}/body/${gender}/${id}.png`;
}
export function hairPath(colorId: string, styleId: string): string {
  return `${ROOT}/hair/${colorId}/${styleId}.png`;
}
export function topPath(gender: 'm' | 'f', id: string): string {
  return `${ROOT}/top/${gender}/${id}.png`;
}
export function bottomPath(gender: 'm' | 'f', id: string): string {
  return `${ROOT}/bottom/${gender}/${id}.png`;
}
export function shoesPath(id: string): string {
  return `${ROOT}/shoes/${id}.png`;
}
export function outerwearPath(gender: 'm' | 'f', id: string): string {
  return `${ROOT}/outerwear/${gender}/${id}.png`;
}
export function hatPath(id: string): string {
  return `${ROOT}/hat/${id}.png`;
}
export function glassesPath(id: string): string {
  return `${ROOT}/glasses/${id}.png`;
}
export function expressionPath(id: string): string {
  return `${ROOT}/expression/${id}.png`;
}

export const SPRITE_DIMS = {
  width: MANIFEST.spriteWidth,
  height: MANIFEST.spriteHeight,
  bustCrop: MANIFEST.bustCrop,
} as const;
