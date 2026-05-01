// Origin / Referer header allow-list for state-changing API routes.
//
// Cheap CSRF defense + "rejects naive bot scripts that hit the API directly
// without setting any browser-y headers". Doesn't replace Turnstile + rate
// limit; it just shaves off the lazy-attacker traffic.
//
// Allowed origins:
//   - NEXT_PUBLIC_APP_URL (the canonical prod URL)
//   - localhost / 127.0.0.1 on any port (dev)
//   - any subdomain of the same apex domain (preview deployments via *.vercel.app)
//
// Returns ok=false when neither Origin nor Referer matches. Same-origin
// browser POSTs always pass; cross-origin browser POSTs are blocked by
// CORS before they hit us anyway, so this is mostly catching curl/bot.

export interface OriginCheckResult {
  ok: boolean;
  reason?: 'no_headers' | 'origin_disallowed' | 'invalid_url';
  origin?: string;
}

function getAllowedHosts(): Set<string> {
  const hosts = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try { hosts.add(new URL(appUrl).host); } catch {}
  }
  // Localhost + 127.0.0.1 always allowed (dev). Port-agnostic.
  hosts.add('localhost');
  hosts.add('127.0.0.1');
  return hosts;
}

function hostFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export function checkOrigin(req: Request): OriginCheckResult {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  if (!origin && !referer) return { ok: false, reason: 'no_headers' };

  const allowed = getAllowedHosts();
  const candidates = [origin, referer]
    .map((v) => hostFromHeader(v))
    .filter((h): h is string => !!h);

  if (candidates.length === 0) return { ok: false, reason: 'invalid_url' };

  for (const host of candidates) {
    // Strip port for matching (localhost:3000 → localhost)
    const bare = host.split(':')[0];
    if (allowed.has(bare)) return { ok: true, origin: host };
    // Vercel preview / branch domains: *.vercel.app
    if (bare.endsWith('.vercel.app')) return { ok: true, origin: host };
    // Same apex domain match — strip subdomain prefix and compare
    for (const allowedHost of allowed) {
      if (bare === allowedHost) return { ok: true, origin: host };
      // verity-trainer.vercel.app vs verity-trainer-l17.vercel.app etc.
      if (allowedHost !== 'localhost' && allowedHost !== '127.0.0.1') {
        const allowedApex = allowedHost.split('.').slice(-2).join('.');
        if (bare.endsWith('.' + allowedApex) || bare === allowedApex) {
          return { ok: true, origin: host };
        }
      }
    }
  }

  return { ok: false, reason: 'origin_disallowed', origin: candidates[0] };
}
