// Shared pure helpers for the V4 card chassis. Both the React/DOM renderer
// (TrainerCardV4.tsx) and the satori-based OG route (/api/og) call these so
// the two surfaces stay in lockstep.

/**
 * Flatten a list of ability/weakness names to the comma-and-ampersand form
 * used in the reference PNGs:
 *   1 → "FOO"
 *   2 → "FOO & BAR"
 *   3 → "FOO, BAR, & BAZ"
 *   0 / undefined → "—"
 * Output is ALL CAPS regardless of input casing.
 */
export function formatList(items?: string[]): string {
  const list = (items ?? []).filter((s) => s && s.trim().length > 0).map((s) => s.toUpperCase());
  if (list.length === 0) return '—';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} & ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, & ${list[list.length - 1]}`;
}

/**
 * Derive a 5-digit zero-padded MEMBER # from a card id seed. Placeholder until
 * the backend ships a real auto-increment column (per spec §6 — Member # is
 * "DB auto-increment, tied to waitlist position"). Same id → same number.
 */
export function deriveMemberNo(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const n = Math.abs(hash) % 99999;
  return `#${String(n).padStart(5, '0')}`;
}

