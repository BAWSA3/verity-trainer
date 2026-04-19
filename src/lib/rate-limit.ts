/**
 * Signup rate limiter — 5 signups per IP per hour.
 *
 * Uses Supabase's `signup_attempts` table as the persistent store so the
 * limit works across cold starts / serverless invocations on Vercel.
 *
 *   - One row inserted per attempt (flagged OR successful)
 *   - On check: count rows from same IP hash in last 60 minutes
 *   - Returns ok=false + retryAfter (seconds) when over the limit
 */

import crypto from 'node:crypto';
import { supabaseAdmin } from './supabase-admin';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 5;

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Extract the requester's IP from a Next.js Request. On Vercel the
 * relevant header is x-forwarded-for (possibly comma-separated). Falls
 * back to 'unknown' so dev + tests don't crash.
 */
export function extractIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export interface RateCheckResult {
  ok: boolean;
  retryAfter?: number; // seconds
}

/**
 * Call BEFORE attempting the signup. Records the attempt internally so
 * the next call sees it. Returns ok=false if the IP is already over its
 * hourly budget.
 */
export async function checkSignupRate(ipHash: string): Promise<RateCheckResult> {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  // Count recent attempts
  const { count, error: countErr } = await supabaseAdmin
    .from('signup_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', windowStart);

  if (countErr) {
    console.warn('[rate-limit] count query failed, failing open:', countErr);
    return { ok: true };
  }

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    // Figure out retryAfter — oldest attempt in window + WINDOW_MS.
    const { data: oldest } = await supabaseAdmin
      .from('signup_attempts')
      .select('created_at')
      .eq('ip_hash', ipHash)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    let retryAfter = 3600;
    if (oldest?.created_at) {
      const freeAt = new Date(oldest.created_at).getTime() + WINDOW_MS;
      retryAfter = Math.max(1, Math.ceil((freeAt - Date.now()) / 1000));
    }
    return { ok: false, retryAfter };
  }

  // Record this attempt
  const { error: insertErr } = await supabaseAdmin
    .from('signup_attempts')
    .insert({ ip_hash: ipHash });
  if (insertErr) {
    console.warn('[rate-limit] insert failed:', insertErr);
    // Fail open — don't block real users on a DB hiccup
  }

  return { ok: true };
}
