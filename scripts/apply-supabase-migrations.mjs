#!/usr/bin/env node
// Apply Verity Trainer's Supabase migrations to the live project.
//
// Usage:
//   node scripts/apply-supabase-migrations.mjs
//
// Reads DATABASE_URL from .env.local (the Postgres connection string sourced
// from BrandOS .env.vercel POSTGRES_URL_NON_POOLING) and runs each .sql file
// statement-by-statement. Tolerates "already exists" errors so re-runs are
// safe even when the first migration uses CREATE TABLE (no IF NOT EXISTS).
//
// Verifies success by listing the three expected tables at the end.
//
// If DATABASE_URL is missing, prints the SQL to stdout with instructions to
// paste into the Supabase SQL editor.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

const MIGRATIONS = [
  'supabase-migration.sql',
  'supabase-migration-moderation.sql',
  'supabase-migration-tiers.sql',
];

const EXPECTED_TABLES = [
  'trainer_signups',
  'signup_attempts',
  'signup_audit_log',
  'tier_supply',
  'tier_roll_log',
];

async function loadEnv() {
  // Lightweight .env.local parser — Node.js doesn't auto-load .env outside Next.
  try {
    const raw = await readFile(path.join(repoRoot, '.env.local'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.warn('[migrations] could not read .env.local:', err.message);
  }
}

function splitStatements(sql) {
  // Strip line comments first, then walk char-by-char so semicolons inside
  // dollar-quoted blocks ($$ ... $$) don't split a statement. The tier
  // migration uses a plpgsql function, which is one long statement that
  // contains internal semicolons — without this the function body breaks.
  const stripped = sql
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');

  const statements = [];
  let buf = '';
  let i = 0;
  let inDollar = false;
  let dollarTag = '';
  while (i < stripped.length) {
    const ch = stripped[i];
    // Detect $tag$ delimiter (commonly $$ or $body$).
    if (ch === '$') {
      const match = /^\$([A-Za-z0-9_]*)\$/.exec(stripped.slice(i));
      if (match) {
        const tag = match[0];
        if (!inDollar) {
          inDollar = true;
          dollarTag = tag;
        } else if (tag === dollarTag) {
          inDollar = false;
          dollarTag = '';
        }
        buf += tag;
        i += tag.length;
        continue;
      }
    }
    if (ch === ';' && !inDollar) {
      const stmt = buf.trim();
      if (stmt.length > 0) statements.push(stmt);
      buf = '';
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  const tail = buf.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

async function runMigration(client, file) {
  const fullPath = path.join(repoRoot, file);
  const sql = await readFile(fullPath, 'utf8');
  const statements = splitStatements(sql);
  console.log(`\n→ ${file} (${statements.length} statements)`);
  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
    try {
      await client.query(stmt);
      console.log(`  ✓ ${preview}...`);
    } catch (err) {
      // Tolerate "already exists" so re-runs are safe.
      if (/already exists/i.test(err.message)) {
        console.log(`  · skip (already exists): ${preview}...`);
      } else {
        console.error(`  ✗ ${preview}...`);
        console.error(`    ${err.message}`);
        throw err;
      }
    }
  }
}

async function verifyTables(client) {
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [EXPECTED_TABLES],
  );
  const found = new Set(rows.map((r) => r.table_name));
  console.log('\nVerification:');
  let allOk = true;
  for (const t of EXPECTED_TABLES) {
    const ok = found.has(t);
    console.log(`  ${ok ? '✓' : '✗'} ${t}`);
    if (!ok) allOk = false;
  }
  return allOk;
}

async function printManualFallback() {
  // Write a single combined SQL file so the user can paste it once.
  const { writeFile } = await import('node:fs/promises');
  const parts = [];
  for (const m of MIGRATIONS) {
    const sql = await readFile(path.join(repoRoot, m), 'utf8');
    parts.push(`-- ============================================`);
    parts.push(`-- ${m}`);
    parts.push(`-- ============================================`);
    parts.push(sql);
    parts.push('');
  }
  const out = path.join(repoRoot, 'tmp-migrations.sql');
  await writeFile(out, parts.join('\n'), 'utf8');

  console.log('');
  console.log('Could not connect via DATABASE_URL. To apply manually:');
  console.log(`  1. open ${out} (combined SQL is ready)`);
  console.log('  2. open https://supabase.com/dashboard/project/gdxvijmezkwlqdnxfxpe/sql');
  console.log('  3. paste the file contents, click Run');
  console.log('');
  console.log('Or fix DATABASE_URL in .env.local with the current password from');
  console.log('  Supabase Dashboard → Project Settings → Database → Connection String');
}

async function main() {
  await loadEnv();

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found in .env.local');
    await printManualFallback();
    process.exit(1);
  }

  // Supabase pooler uses a self-signed cert. Strip the URL's sslmode param so
  // it doesn't override our explicit `rejectUnauthorized: false`.
  const cleanUrl = url.replace(/[?&]sslmode=[^&]+/g, '').replace(/[?&]$/, '');
  const client = new pg.Client({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log('connected to Postgres');
    for (const m of MIGRATIONS) await runMigration(client, m);
    const ok = await verifyTables(client);
    if (!ok) process.exit(2);
    console.log('\nmigrations applied successfully.');
  } finally {
    await client.end();
  }
}

main().catch(async (err) => {
  console.error('\nmigration failed:', err.message);
  await printManualFallback();
  process.exit(1);
});
