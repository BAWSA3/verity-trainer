/**
 * Server-side trainer-config validation.
 *
 * The client-side customizer disables Generate until required slots are
 * filled with valid catalog IDs — but the /api/signup endpoint is open
 * to direct POSTs. Without this check, a bad actor could send:
 *   { top: "", bottom: "", shoes: "" }
 * and get a nearly-naked trainer through.
 *
 * This validator confirms every field:
 *   - exists and is a string
 *   - matches a known catalog ID for its category
 *   - required-for-render fields are non-empty and not 'none'
 */

import { CATEGORIES, REQUIRED_FOR_GENERATE } from '@/lib/trainer-options';

export type ConfigCheckReason =
  | 'missing'
  | 'invalid_type'
  | 'unknown_id'
  | 'required_empty'
  | 'required_none';

export interface ConfigCheckResult {
  ok: boolean;
  reason?: ConfigCheckReason;
  field?: string;
  value?: string;
}

// Build an { [categoryKey]: Set<validIds> } lookup from the catalog once.
// Optional categories also accept the 'none' sentinel.
function buildValidIdMap(): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  for (const cat of CATEGORIES) {
    const set = new Set(cat.options.map((o) => o.id));
    // Optional categories may carry 'none' even if the manifest didn't list it.
    if (!REQUIRED_FOR_GENERATE.includes(cat.key)) set.add('none');
    map[cat.key] = set;
  }
  return map;
}

const VALID_IDS = buildValidIdMap();

// Which keys must be present on the config object. Mirrors TrainerConfig shape.
const ALL_KEYS = [
  'gender',
  'body',
  'hair',
  'hairColor',
  'top',
  'bottom',
  'shoes',
  'outerwear',
  'hat',
  'glasses',
  'expression',
] as const;

const REQUIRED = new Set<string>(REQUIRED_FOR_GENERATE);

export function checkTrainerConfig(raw: unknown): ConfigCheckResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, reason: 'missing' };
  }

  const config = raw as Record<string, unknown>;

  for (const key of ALL_KEYS) {
    const value = config[key];

    // 1. presence + type
    if (value === undefined || value === null) {
      return { ok: false, reason: 'missing', field: key };
    }
    if (typeof value !== 'string') {
      return { ok: false, reason: 'invalid_type', field: key };
    }

    // 2. required-for-generate fields must be non-empty and not 'none'
    if (REQUIRED.has(key)) {
      if (value === '') {
        return { ok: false, reason: 'required_empty', field: key };
      }
      if (value === 'none') {
        return { ok: false, reason: 'required_none', field: key };
      }
    }

    // 3. must be a known catalog ID for this category.
    //    Skip the check when the value is '' for optional fields stored as ''
    //    (none of our optional fields do this today — they use 'none' — but
    //    future categories might).
    const validSet = VALID_IDS[key];
    if (!validSet) {
      // Category not in our catalog (shouldn't happen)
      return { ok: false, reason: 'unknown_id', field: key, value };
    }
    if (!validSet.has(value)) {
      return { ok: false, reason: 'unknown_id', field: key, value };
    }
  }

  return { ok: true };
}
