#!/usr/bin/env node
// Mana Seed Character Base importer (verity-trainer V1, 2026-04-29).
//
// Reads the user's downloaded Mana Seed Character Base pack from --src,
// extracts the south-facing idle frame (top-left 64x64) from each sprite
// sheet, and writes a flat per-trait sprite tree + manifest.json to --dest
// for the customizer + OG route to consume.
//
// Usage:
//   node scripts/import-manaseed.mjs --src ./vendor/manaseed-pack \
//                                     --dest ./public/sprites/manaseed
//
// The Mana Seed naming convention (per Seliel's `using this base.txt`):
//   char_<set>_<page>_<layer>_<id>_v<NN>.png
// e.g. "char_a_p1_4har_bob1_v07.png" =
//   set=a, page=p1, layer=4har, id=bob1, variant=07
//
// Layer codes (lowest to highest, render order):
//   0bas  body
//   1out  outfit (single piece)
//   2clo  cloak / cape / mantle
//   3fac  face items (glasses / mask)
//   4har  hair
//   5hat  hat / hood
//   6tla  primary tool (skipped — V1 doesn't render weapons)
//   7tlb  secondary tool (skipped)
//
// Each PNG sheet is 512x512 = 8 columns × 8 rows of 64x64 frames.
// V1 renders only the SOUTH-FACING IDLE = top-left frame (col 0, row 0).
//
// Output structure:
//   <dest>/manifest.json
//   <dest>/body/<variant>.png        e.g. body/v00.png .. v10.png
//   <dest>/hair/<style>/<variant>.png e.g. hair/bob1/v00.png .. v13.png
//   <dest>/outfit/<id>/<variant>.png  e.g. outfit/fstr/v01.png
//   <dest>/cloak/<id>/<variant>.png
//   <dest>/face/<id>/<variant>.png
//   <dest>/hat/<id>/<variant>.png
//
// Idempotent — re-running rewrites manifest + sprite tree.

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// ---- args ----
function parseArgs(argv) {
  const out = { src: null, dest: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--src') out.src = argv[++i];
    else if (argv[i] === '--dest') out.dest = argv[++i];
  }
  if (!out.src || !out.dest) {
    console.error('usage: node scripts/import-manaseed.mjs --src <pack> --dest <out>');
    process.exit(1);
  }
  return out;
}

// ---- constants ----
const FRAME = 64;            // each cell in the spritesheet
const SOUTH_IDLE = { col: 0, row: 0 };

// Map Mana Seed layer codes to our category keys.
// 0bas -> body, 1out -> outfit, 2clo -> cloak, 3fac -> face, 4har -> hair,
// 5hat -> hat. Tool layers (6tla, 7tlb) are skipped.
const LAYER_TO_CATEGORY = {
  '0bas': 'body',
  '1out': 'outfit',
  '2clo': 'cloak',
  '3fac': 'face',
  '4har': 'hair',
  '5hat': 'hat',
};
const SKIPPED_LAYERS = new Set(['6tla', '7tlb']);

// Friendly labels for known IDs in the free demo. Anything not listed
// gets its raw ID title-cased as a fallback. Easy to extend.
const ID_LABELS = {
  // body
  humn: 'Human',
  // outfits
  boxr: 'Boxers',
  fstr: 'Forester',
  pfpn: 'Peasant Pants',
  undi: 'Undies',
  // hair
  bob1: 'Bob',
  dap1: 'Dapper',
  // hats
  pfht: 'Farm Hat',
  pnty: 'Pony Cap',
};

// Hair color labels — Mana Seed ships v00-v13 hair palettes. We keep
// numeric IDs from the file and let the user see "Hair Color 7".
function hairColorLabel(variantId) {
  const num = parseInt(variantId.replace(/^v/, ''), 10);
  return Number.isFinite(num) ? `Hair Color ${num + 1}` : variantId;
}

// ---- helpers ----
async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

async function listFilesRecursive(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await listFilesRecursive(full)));
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.png')) out.push(full);
  }
  return out;
}

// Parse `char_a_p1_4har_bob1_v07.png` -> { set, page, layer, id, variant }
function parseFilename(filename) {
  const base = path.basename(filename, '.png');
  const parts = base.split('_');
  if (parts.length < 6) return null;
  const [, set, page, layer, id, variant] = parts;
  if (!set || !page || !layer || !id || !variant) return null;
  return { set, page, layer, id, variant };
}

async function extractSouthIdle(srcPath) {
  return sharp(srcPath)
    .extract({
      left: SOUTH_IDLE.col * FRAME,
      top:  SOUTH_IDLE.row * FRAME,
      width: FRAME,
      height: FRAME,
    })
    .png()
    .toBuffer();
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function labelFor(id) {
  return ID_LABELS[id] ?? titleCase(id);
}

// ---- main ----
async function main() {
  const args = parseArgs(process.argv);

  // Wipe old generated tree (idempotent re-runs).
  // Keep only manifest.json itself for crash recovery.
  for (const cat of ['body', 'hair', 'outfit', 'cloak', 'face', 'hat']) {
    const p = path.join(args.dest, cat);
    if (existsSync(p)) await rm(p, { recursive: true, force: true });
  }
  await ensureDir(args.dest);

  // Walk the pack recursively, gather all PNGs we recognize.
  const files = await listFilesRecursive(args.src);
  console.log(`scanning ${files.length} pngs in ${args.src}...`);

  // Aggregate into per-category collections so we can build manifest values.
  const collected = {
    body:   new Map(),    // variant -> { id, label, file }
    hair:   new Map(),    // styleId -> Map<variant, file>
    outfit: new Map(),    // id -> Map<variant, file>
    cloak:  new Map(),
    face:   new Map(),
    hat:    new Map(),
  };
  const hairColorVariants = new Set(); // canonical hair variant ids (v00..vNN)

  let imported = 0;
  let skipped = 0;

  for (const filepath of files) {
    const parsed = parseFilename(filepath);
    if (!parsed) { skipped++; continue; }
    if (SKIPPED_LAYERS.has(parsed.layer)) { skipped++; continue; }

    const category = LAYER_TO_CATEGORY[parsed.layer];
    if (!category) { skipped++; continue; }

    // V1 only consumes page 1 (walk/run/idle). Other pages have farming/
    // fishing/etc. animations that share IDs and would overwrite each other.
    if (parsed.page !== 'p1') { skipped++; continue; }

    try {
      const buf = await extractSouthIdle(filepath);

      if (category === 'body') {
        // body files are `0bas_humn_vNN`. id is always 'humn' for human;
        // each variant is a distinct skin tone. We expose variants as the
        // user-facing options.
        const outFile = path.join(args.dest, 'body', `${parsed.variant}.png`);
        await ensureDir(path.dirname(outFile));
        await writeFile(outFile, buf);
        collected.body.set(parsed.variant, {
          id: parsed.variant,
          label: `Skin ${parsed.variant.replace(/^v/, '')}`,
          file: `body/${parsed.variant}.png`,
        });
      } else if (category === 'hair') {
        // hair is keyed by style + variant. Variants become hair colors.
        const styleDir = path.join(args.dest, 'hair', parsed.id);
        await ensureDir(styleDir);
        await writeFile(path.join(styleDir, `${parsed.variant}.png`), buf);
        if (!collected.hair.has(parsed.id)) collected.hair.set(parsed.id, new Map());
        collected.hair.get(parsed.id).set(parsed.variant, true);
        hairColorVariants.add(parsed.variant);
      } else {
        // outfit / cloak / face / hat: keyed by id, variants are color/material swaps
        const dir = path.join(args.dest, category, parsed.id);
        await ensureDir(dir);
        await writeFile(path.join(dir, `${parsed.variant}.png`), buf);
        if (!collected[category].has(parsed.id)) collected[category].set(parsed.id, new Map());
        collected[category].get(parsed.id).set(parsed.variant, true);
      }

      imported++;
    } catch (err) {
      console.error(`  FAIL: ${filepath}: ${err.message}`);
      skipped++;
    }
  }

  // Build manifest.
  const manifest = {
    version: 1,
    source: 'manaseed',
    generatedAt: new Date().toISOString(),
    spriteWidth: FRAME,
    spriteHeight: FRAME,
    bustCrop: { x: 16, y: 12, w: 32, h: 36 },
    categories: {
      body: {
        values: [...collected.body.values()].sort((a, b) => a.id.localeCompare(b.id)),
      },
      hair: {
        // Each style entry references the directory containing per-color PNGs.
        // The renderer composes path: hair/<id>/<hairColor>.png
        supportsColor: true,
        values: [...collected.hair.keys()].sort().map((styleId) => ({
          id: styleId,
          label: labelFor(styleId),
        })),
      },
      hairColor: {
        // Discovered hair color variants from the actual pack contents.
        values: [...hairColorVariants].sort().map((variant) => ({
          id: variant,
          label: hairColorLabel(variant),
        })),
      },
      outfit: {
        // Outfits expose one option per (id, variant) pair so users can pick
        // distinct color variants of the same outfit ("Forester (Green)" vs
        // "Forester (Blue)") rather than only the abstract outfit type.
        values: flattenIdVariants(collected.outfit).sort((a, b) => a.id.localeCompare(b.id)),
      },
      cloak: {
        optional: true,
        values: [{ id: 'none', label: 'None' }, ...flattenIdVariants(collected.cloak).sort((a, b) => a.id.localeCompare(b.id))],
      },
      face: {
        optional: true,
        values: [{ id: 'none', label: 'None' }, ...flattenIdVariants(collected.face).sort((a, b) => a.id.localeCompare(b.id))],
      },
      hat: {
        optional: true,
        values: [{ id: 'none', label: 'None' }, ...flattenIdVariants(collected.hat).sort((a, b) => a.id.localeCompare(b.id))],
      },
    },
  };

  await writeFile(
    path.join(args.dest, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );

  console.log(`\nimport complete. imported=${imported} skipped=${skipped}`);
  console.log(`manifest -> ${path.join(args.dest, 'manifest.json')}`);
  console.log(`body: ${collected.body.size} variants`);
  console.log(`hair: ${collected.hair.size} styles × ${hairColorVariants.size} colors`);
  console.log(`outfit: ${flattenIdVariants(collected.outfit).length} options`);
  console.log(`cloak/face/hat: ${flattenIdVariants(collected.cloak).length}/${flattenIdVariants(collected.face).length}/${flattenIdVariants(collected.hat).length}`);
}

function flattenIdVariants(idMap) {
  const out = [];
  for (const [id, variants] of idMap) {
    for (const variant of variants.keys()) {
      const slug = `${id}-${variant}`;
      out.push({
        id: slug,
        label: `${labelFor(id)} ${variant}`,
        // file path is built at consume-time as `<category>/<id>/<variant>.png`
        baseId: id,
        variant,
      });
    }
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
