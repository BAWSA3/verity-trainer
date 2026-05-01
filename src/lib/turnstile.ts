// Cloudflare Turnstile server-side verification.
//
// Pairs with src/components/TurnstileWidget.tsx — the widget produces a
// short-lived token on the client; the server posts it to Cloudflare's
// siteverify endpoint to confirm the user is a real human (or at least
// not an obvious bot).
//
// Configuration:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY    — public, embedded in client widget
//   TURNSTILE_SECRET_KEY               — server-only, used to verify
//
// When TURNSTILE_SECRET_KEY is unset, verification short-circuits to ok=true
// so dev / preview environments can run without infrastructure. In prod the
// env var is set and unverified tokens get rejected.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  ok: boolean;
  /** Reason the verification was rejected (or 'no_key' for unconfigured envs). */
  reason?:
    | 'no_token'
    | 'no_key'
    | 'invalid_token'
    | 'expired_token'
    | 'duplicate_token'
    | 'timeout_or_duplicate'
    | 'network_error'
    | 'unknown';
  errorCodes?: string[];
}

interface CloudflareVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // No secret configured — fail open. Dev / preview path. The widget on the
  // client also no-ops when the public key is unset, so the missing token
  // path here is the expected flow during local development.
  if (!secret) {
    return { ok: true, reason: 'no_key' };
  }

  if (!token || typeof token !== 'string' || token.length < 10) {
    return { ok: false, reason: 'no_token' };
  }

  try {
    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (remoteIp) body.append('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      console.warn('[turnstile] verify HTTP', res.status);
      return { ok: false, reason: 'network_error' };
    }
    const data = (await res.json()) as CloudflareVerifyResponse;
    if (data.success) return { ok: true };

    // Map Cloudflare error codes to our internal reasons.
    const codes = data['error-codes'] ?? [];
    let reason: TurnstileVerifyResult['reason'] = 'unknown';
    if (codes.includes('timeout-or-duplicate')) reason = 'timeout_or_duplicate';
    else if (codes.includes('invalid-input-response')) reason = 'invalid_token';
    else if (codes.includes('expired-input-response')) reason = 'expired_token';
    return { ok: false, reason, errorCodes: codes };
  } catch (err) {
    console.warn('[turnstile] verify threw:', err);
    return { ok: false, reason: 'network_error' };
  }
}
