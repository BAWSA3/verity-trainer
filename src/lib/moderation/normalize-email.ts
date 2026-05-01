// Canonical email normalization, mirrors the Supabase normalize_email() SQL
// function. Used to detect Gmail-alias / dot-trick collisions BEFORE the DB
// rejects the insert, so we can return a friendlier error.
//
// Rules:
//   1. lowercase, trim
//   2. strip everything after `+` in the local part (works for any provider)
//   3. for gmail.com / googlemail.com: strip dots from local part, fold to
//      gmail.com domain
//   4. other providers: pass through (case-folded)

const GMAIL_HOSTS = new Set(['gmail.com', 'googlemail.com']);

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (!lower) return null;
  const at = lower.indexOf('@');
  if (at <= 0) return lower; // no @, nothing to normalize

  let local = lower.slice(0, at);
  let domain = lower.slice(at + 1);

  // Strip +tag (every provider lets you do this; it's local-part addressing)
  const plusIdx = local.indexOf('+');
  if (plusIdx >= 0) local = local.slice(0, plusIdx);

  if (GMAIL_HOSTS.has(domain)) {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }

  return `${local}@${domain}`;
}
