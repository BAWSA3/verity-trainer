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
  return checkRateLimit(ipHash, { action: 'signup', max: MAX_ATTEMPTS, windowMs: WINDOW_MS });
}

/**
 * Generic rate-limit check, partitioned by `action`. Used for per-endpoint
 * caps — e.g. /api/generate-trainer wants its own budget separate from
 * /api/signup so a few real signups don't drain the AI-cost budget for the
 * whole IP.
 */
export interface RateLimitOptions {
  action: 'signup' | 'generate-trainer';
  max: number;
  windowMs: number;
}

export async function checkRateLimit(
  ipHash: string,
  opts: RateLimitOptions,
): Promise<RateCheckResult> {
  const windowStart = new Date(Date.now() - opts.windowMs).toISOString();

  const { count, error: countErr } = await supabaseAdmin
    .from('signup_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('action', opts.action)
    .gte('created_at', windowStart);

  if (countErr) {
    console.warn(`[rate-limit:${opts.action}] count query failed, failing open:`, countErr);
    return { ok: true };
  }

  if ((count ?? 0) >= opts.max) {
    const { data: oldest } = await supabaseAdmin
      .from('signup_attempts')
      .select('created_at')
      .eq('ip_hash', ipHash)
      .eq('action', opts.action)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    let retryAfter = Math.ceil(opts.windowMs / 1000);
    if (oldest?.created_at) {
      const freeAt = new Date(oldest.created_at).getTime() + opts.windowMs;
      retryAfter = Math.max(1, Math.ceil((freeAt - Date.now()) / 1000));
    }
    return { ok: false, retryAfter };
  }

  const { error: insertErr } = await supabaseAdmin
    .from('signup_attempts')
    .insert({ ip_hash: ipHash, action: opts.action });
  if (insertErr) {
    console.warn(`[rate-limit:${opts.action}] insert failed:`, insertErr);
    // Fail open — don't block real users on a DB hiccup
  }

  return { ok: true };
}
