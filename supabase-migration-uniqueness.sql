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
