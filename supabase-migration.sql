-- VERITY Trainer Creator - Supabase Migration
-- Run this in your Supabase SQL Editor

CREATE TABLE trainer_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  x_handle TEXT,
  trainer_config JSONB NOT NULL,
  trainer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index for dedup on email (supports upsert)
CREATE UNIQUE INDEX idx_trainer_signups_email ON trainer_signups(email);

-- Enable RLS - no public policies, all access via service role key
ALTER TABLE trainer_signups ENABLE ROW LEVEL SECURITY;
