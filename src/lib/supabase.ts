import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy-init so missing env doesn't crash the build's page-data collection.
// In dev, missing creds make the routes return 503 at request time, not build time.
let cached: SupabaseClient | null = null;

// Supabase renamed env vars in late 2025; read either so old + new envs both work.
export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or _PUBLISHABLE_KEY) in .env.local',
    );
  }
  cached = createClient(url, key);
  return cached;
}

// Back-compat: a Proxy that lazy-instantiates on first property access.
// Existing callers do `import { supabase } from '@/lib/supabase'`; this keeps
// that interface working while moving the actual createClient to first-use.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});
