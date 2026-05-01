-- Verity new migrations only (tiers + uniqueness) — applied to prod 2026-05-01
-- Safe to paste into Supabase SQL editor in one go.

-- ============================================
-- supabase-migration-tiers.sql
-- ============================================
-- Verity launch tier system (V3.1, 2026-05-01)
-- 4 tiers + 1 founder card, distribution mirrors TCG grading pull rates:
--   FOUNDER     · 1 card     (1/3000 ≈ 0.033%)
--   BLACK LABEL · 30 cards   (1%)
--   GEM         · 270 cards  (9%)
--   MINT        · 900 cards  (30%)
--   NEAR MINT   · 1800 cards (60%)
-- Total: 3001 supply.
--
-- The roll_tier() RPC does atomic weighted random selection by remaining
-- supply, then decrements. Race-safe via row locking inside a transaction.

create table if not exists tier_supply (
  tier        text primary key,
  capacity    int  not null check (capacity >= 0),
  remaining   int  not null check (remaining >= 0),
  -- Sort key drives the iteration order in roll_tier(); doesn't affect odds
  -- since cumulative weighting handles distribution, but stable order makes
  -- behavior predictable for testing.
  rank        int  not null,
  updated_at  timestamptz not null default now()
);

-- Idempotent seed. Existing rows are not overwritten if migration re-runs;
-- only insert the rows that don't exist yet.
insert into tier_supply (tier, capacity, remaining, rank) values
  ('founder',     1,    1,    0),
  ('black-label', 30,   30,   1),
  ('gem',         270,  270,  2),
  ('mint',        900,  900,  3),
  ('near-mint',   1800, 1800, 4)
on conflict (tier) do nothing;

-- Audit log for tier rolls — separate from signup_audit_log so we can
-- reconstruct supply history without touching that table's schema.
create table if not exists tier_roll_log (
  id          uuid primary key default gen_random_uuid(),
  tier        text not null references tier_supply(tier),
  signup_id   uuid,
  rolled_at   timestamptz not null default now()
);
create index if not exists idx_tier_roll_log_rolled_at on tier_roll_log (rolled_at);
create index if not exists idx_tier_roll_log_tier on tier_roll_log (tier);

-- roll_tier(): returns the assigned tier as text, atomically decrements
-- remaining supply, and writes an audit row. Must be called inside the
-- signup transaction so the trainer_signups insert + tier roll commit
-- atomically — if the insert fails afterward, manually re-credit supply.
create or replace function roll_tier()
returns text
language plpgsql
security definer
as $$
declare
  total_remaining int;
  roll_value      double precision;
  cumulative      int := 0;
  selected_tier   text := null;
  rec             record;
begin
  -- Lock all supply rows for the duration of this transaction. SELECT FOR
  -- UPDATE is the canonical Postgres pattern for atomic counters.
  select sum(remaining) into total_remaining
  from tier_supply
  for update;

  if total_remaining is null or total_remaining <= 0 then
    -- Sold out — fall back to NEAR MINT so signups don't fail. The launch
    -- copy assumes 3001-card cap; if you ever expand, update the seed first.
    return 'near-mint';
  end if;

  -- Weighted random across remaining supply. Iterate tiers in rank order
  -- so the cumulative sum is deterministic.
  roll_value := random() * total_remaining;

  for rec in
    select tier, remaining from tier_supply
    where remaining > 0
    order by rank
  loop
    cumulative := cumulative + rec.remaining;
    if roll_value < cumulative then
      selected_tier := rec.tier;
      exit;
    end if;
  end loop;

  -- Defensive fallback (shouldn't hit unless total_remaining was stale)
  if selected_tier is null then
    select tier into selected_tier from tier_supply
    where remaining > 0 order by rank desc limit 1;
  end if;

  update tier_supply
    set remaining = remaining - 1,
        updated_at = now()
    where tier = selected_tier;

  insert into tier_roll_log (tier) values (selected_tier);

  return selected_tier;
end;
$$;

grant execute on function roll_tier() to service_role;

-- RLS — tier_supply readable by anon (so the marketing site can show live
-- counts), but only service_role can write. tier_roll_log is service-only.
alter table tier_supply    enable row level security;
alter table tier_roll_log  enable row level security;

drop policy if exists "tier_supply public read" on tier_supply;
create policy "tier_supply public read"
  on tier_supply for select
  to anon, authenticated
  using (true);

drop policy if exists "tier_supply service write" on tier_supply;
create policy "tier_supply service write"
  on tier_supply for all
  to service_role
  using (true) with check (true);

drop policy if exists "tier_roll_log service only" on tier_roll_log;
create policy "tier_roll_log service only"
  on tier_roll_log for all
  to service_role
  using (true) with check (true);

-- ============================================
-- supabase-migration-uniqueness.sql
-- ============================================
-- Verity launch hardening (V3.1, 2026-05-01)
-- Anti-farming constraints:
--   1. One claim per X handle (case-insensitive). Same X account can't pull
--      multiple cards by reclaiming with different emails.
--   2. Normalized email column for Gmail-alias / dot-trick deduplication.
--      `naval+1@gmail.com` and `n.aval@gmail.com` and `naval@gmail.com` all
--      normalize to the same canonical value, blocking multi-claim via the
--      same Gmail account.
--
-- The normalize_email() helper handles the canonicalization rules. Currently
-- only Gmail-style normalization (strip +tag, strip dots in local part for
-- gmail.com / googlemail.com). Other providers fall through to lowercase.

create or replace function normalize_email(email text)
returns text
language plpgsql
immutable
as $$
declare
  lower_email text := lower(trim(email));
  at_pos      int;
  local_part  text;
  domain_part text;
begin
  if lower_email is null or lower_email = '' then
    return null;
  end if;

  at_pos := position('@' in lower_email);
  if at_pos = 0 then
    return lower_email;
  end if;

  local_part  := substring(lower_email from 1 for at_pos - 1);
  domain_part := substring(lower_email from at_pos + 1);

  -- Strip +tag from local part (works for all providers)
  local_part := split_part(local_part, '+', 1);

  -- Gmail-specific: dots in local part are ignored. googlemail.com == gmail.com.
  if domain_part = 'gmail.com' or domain_part = 'googlemail.com' then
    local_part := replace(local_part, '.', '');
    domain_part := 'gmail.com';
  end if;

  return local_part || '@' || domain_part;
end;
$$;

-- Add normalized_email column. Backfill from existing rows.
alter table trainer_signups add column if not exists normalized_email text;
update trainer_signups set normalized_email = normalize_email(email)
  where normalized_email is null;

-- Trigger: keep normalized_email synced on insert/update.
create or replace function trainer_signups_normalize_email_trigger()
returns trigger
language plpgsql
as $$
begin
  new.normalized_email := normalize_email(new.email);
  return new;
end;
$$;

drop trigger if exists trainer_signups_normalize_email on trainer_signups;
create trigger trainer_signups_normalize_email
  before insert or update of email on trainer_signups
  for each row execute function trainer_signups_normalize_email_trigger();

-- Unique constraints — one claim per X handle (case-insensitive),
-- one claim per normalized email.
create unique index if not exists idx_trainer_signups_x_handle_unique
  on trainer_signups (lower(x_handle))
  where x_handle is not null;

create unique index if not exists idx_trainer_signups_normalized_email_unique
  on trainer_signups (normalized_email)
  where normalized_email is not null;

-- Per-endpoint rate-limit support: extend signup_attempts with an `action`
-- column so /api/generate-trainer can be rate-limited independently of
-- /api/signup. Existing rows default to 'signup'.
alter table signup_attempts add column if not exists action text not null default 'signup';
create index if not exists idx_signup_attempts_action_ip_time
  on signup_attempts (action, ip_hash, created_at desc);
