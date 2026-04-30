import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy service-role client — see comment in supabase.ts. Missing env at build
// time yields a runtime 503 instead of a build crash.
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase admin env missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
    );
  }
  cached = createClient(url, key);
  return cached;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});
