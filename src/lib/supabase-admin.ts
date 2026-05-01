import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy service-role client — see comment in supabase.ts. Missing env at build
// time yields a runtime 503 instead of a build crash.
//
// Supabase renamed the env vars in late 2025:
//   SUPABASE_SERVICE_ROLE_KEY → SUPABASE_SECRET_KEY  (server)
//   NEXT_PUBLIC_SUPABASE_ANON_KEY → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (client)
// Read either so prod (which uses the new names) and older dev envs (which
// use the legacy names) both work.
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase admin env missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local',
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
