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
