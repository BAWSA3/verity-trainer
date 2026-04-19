-- VERITY Trainer — Moderation + Rate Limit Tables
-- Run this in the Supabase SQL editor BEFORE deploying the guardrails pass.
-- Creates two tables both with RLS enabled and no public policies;
-- only the service role key can read/write.

-- -------------------------------------------------------------------------
-- signup_attempts — rate limiting ledger
-- One row per signup attempt (flagged or not). Queried by IP hash + time
-- window to enforce "5 signups per IP per hour".
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_time
  ON signup_attempts(ip_hash, created_at DESC);

ALTER TABLE signup_attempts ENABLE ROW LEVEL SECURITY;
-- no policies — service role key only

-- -------------------------------------------------------------------------
-- signup_audit_log — moderation audit trail
-- Every signup attempt (success or block) gets a row so admins can review
-- patterns and tune the blocklist.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signup_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  trainer_name TEXT,
  x_handle TEXT,
  ip_hash TEXT,
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,  -- 'profanity' | 'slur' | 'brand' | 'openai' | 'length' | 'handle_format' | 'rate_limit' | null
  flag_match TEXT,   -- the offending substring, if any (for blocklist tuning)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_flagged_time
  ON signup_audit_log(flagged, created_at DESC);

ALTER TABLE signup_audit_log ENABLE ROW LEVEL SECURITY;
-- no policies — service role key only

-- -------------------------------------------------------------------------
-- Housekeeping (optional): auto-delete old rate-limit rows after 24h.
-- Run this periodically from a cron or leave the table to grow; rows are small.
-- -------------------------------------------------------------------------
-- DELETE FROM signup_attempts WHERE created_at < now() - interval '24 hours';
