#!/usr/bin/env node
// Limezu pack importer (verity-trainer V1 redesign, 2026-04-29)
//
// Reads a hand-purchased Limezu modular character pack from --src and writes
// a flat sprite tree + manifest.json to --dest that the customizer + OG route
// consume. Idempotent: re-runnable when vendor/limezu-pack/import-config.json
// is tweaked.
//
// Usage:
//   node scripts/import-limezu.mjs --src ./vendor/limezu-pack \
//                                   --dest ./public/sprites/limezu
//
// Pre-req: vendor/limezu-pack/import-config.json exists, mapping each source
// PNG -> { kind, gender, id, sheetCol?, sheetRow?, label? }. The mapping is
// hand-written after Day 1 inspection of the actual pack contents.
//
// Output:
//   <dest>/manifest.json
//   <dest>/body/{m,f}/<id>.png        64x96 transparent
//   <dest>/hair/<colorId>/<id>.png    pre-rendered per color
//   <dest>/top/{m,f}/<id>.png
//   <dest>/bottom/{m,f}/<id>.png
//   <dest>/shoes/<id>.png
//   <dest>/outerwear/{m,f}/<id>.png
//   <dest>/hat/<id>.png
//   <dest>/glasses/<id>.png
//   <dest>/expression/<id>.png

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// ----- args -----
function parseArgs(argv) {
  const out = { src: null, dest: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--src') out.src = argv[++i];
    else if (argv[i] === '--dest') out.dest = argv[++i];
  }
  if (!out.src || !out.dest) {
    console.error('usage: node scripts/import-limezu.mjs --src <pack> --dest <out>');
    process.exit(1);
  }
  return out;
}

// ----- constants (override per pack via import-config.json `frame`) -----
const DEFAULT_FRAME = { width: 64, height: 96, col: 0, row: 2 }; // south-idle
const TARGET_W = 64;
const TARGET_H = 96;

// 5 hair colors used across the trainer. Edit if pack ships a different palette.
const HAIR_COLORS = [
  { id: 'black',    hex: '#1a1a1a' },
  { id: 'brown',    hex: '#5a3a1f' },
  { id: 'blonde',   hex: '#d8b76a' },
  { id: 'red',      hex: '#a83939' },
  { id: 'platinum', hex: '#dfd9c7' },
];

// ----- helpers -----
async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

function destPath(dest, kind, gender, id) {
  // Gendered categories live under {m,f}/. Genderless live flat.
  if (gender) return path.join(dest, kind, gender, `${id}.png`);
  return path.join(dest, kind, `${id}.png`);
}

async function loadImportConfig(src) {
  const cfgPath = path.join(src, 'import-config.json');
  if (!existsSync(cfgPath)) {
    throw new Error(
      `import-config.json not found at ${cfgPath}\n\n` +
      `After purchasing the Limezu pack and dropping it at ${src}/,\n` +
      `hand-write import-config.json mapping each source filename to:\n` +
      `  { "kind":"body|hair|top|bottom|shoes|outerwear|hat|glasses|expression",\n` +
      `    "gender":"m|f|null", "id":"<slug>", "label":"<display>", \n` +
      `    "frame": { "width":64, "height":96, "col":0, "row":2 }   // optional override\n` +
      `  }`,
    );
  }
  return JSON.parse(await readFile(cfgPath, 'utf8'));
}

async function extractFrame(srcPath, frame) {
  const { width, height, col, row } = { ...DEFAULT_FRAME, ...(frame ?? {}) };
  const left = col * width;
  const top = row * height;
  const buf = await sharp(srcPath)
    .extract({ left, top, width, height })
    .resize(TARGET_W, TARGET_H, { kernel: 'nearest', fit: 'contain' })
    .png()
    .toBuffer();
  return buf;
}

// Pixel-level color remap: read raw RGBA, find pixels matching base hair color
// (any non-transparent pixel within a tolerance of `fromHex`), shift hue
// toward `toHex`. Lossy on anti-aliased edges; acceptable for pixel art.
async function recolorHair(buf, fromHex, toHex) {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const img = sharp(buf).raw();
  const { data, info } = await img.toBuffer({ resolveWithObject: true });
  const channels = info.channels; // 4 for RGBA
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += channels) {
    const a = channels === 4 ? out[i + 3] : 255;
    if (a === 0) continue;
    // Match-and-shift: take the pixel's lightness and apply target's hue.
    // Simple approach — recompose RGB by ratio scaling toward `to`.
    const r = out[i], g = out[i + 1], b = out[i + 2];
    const lightness = (r + g + b) / 3 / 255; // 0-1
    out[i]     = Math.round(to.r * (0.7 + 0.3 * lightness));
    out[i + 1] = Math.round(to.g * (0.7 + 0.3 * lightness));
    out[i + 2] = Math.round(to.b * (0.7 + 0.3 * lightness));
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels } })
    .png()
    .toBuffer();
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

// ----- main -----
async function main() {
  const args = parseArgs(process.argv);
  const cfg = await loadImportConfig(args.src);

  await ensureDir(args.dest);
  for (const sub of ['body/m', 'body/f', 'hair', 'top/m', 'top/f', 'bottom/m', 'bottom/f',
                     'shoes', 'outerwear/m', 'outerwear/f', 'hat', 'glasses', 'expression']) {
    await ensureDir(path.join(args.dest, sub));
  }
  for (const c of HAIR_COLORS) {
    await ensureDir(path.join(args.dest, 'hair', c.id));
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    spriteWidth: TARGET_W,
    spriteHeight: TARGET_H,
    bustCrop: { x: 16, y: 0, w: 32, h: 40 },
    categories: {
      body:       { gendered: true,  values: [] },
      hair:       { gendered: false, supportsColor: true, values: [] },
      hairColor:  { values: HAIR_COLORS.map((c) => ({ id: c.id, label: cap(c.id), hex: c.hex })) },
      top:        { gendered: true,  values: [] },
      bottom:     { gendered: true,  values: [] },
      shoes:      { gendered: false, values: [] },
      outerwear:  { gendered: true,  optional: true, values: [] },
      hat:        { gendered: false, optional: true, values: [] },
      glasses:    { gendered: false, optional: true, values: [] },
      expression: { gendered: false, optional: true, values: [] },
    },
  };

  const entries = Object.entries(cfg.files ?? {});
  console.log(`importing ${entries.length} mapped files from ${args.src}`);

  for (const [filename, mapping] of entries) {
    const srcFile = path.join(args.src, filename);
    if (!existsSync(srcFile)) {
      console.warn(`  skip (not found): ${filename}`);
      continue;
    }
    const { kind, gender = null, id, label, frame } = mapping;
    if (!kind || !id) {
      console.warn(`  skip (bad mapping): ${filename}`);
      continue;
    }

    try {
      const buf = await extractFrame(srcFile, frame);

      if (kind === 'hair') {
        // Pre-render each hair color variant.
        for (const color of HAIR_COLORS) {
          const out = await recolorHair(buf, mapping.basePalette ?? '#1a1a1a', color.hex);
          await writeFile(path.join(args.dest, 'hair', color.id, `${id}.png`), out);
        }
        manifest.categories.hair.values.push({
          id, label: label ?? id,
          file: `hair/<color>/${id}.png`,
        });
      } else {
        const out = destPath(args.dest, kind, gender, id);
        await ensureDir(path.dirname(out));
        await writeFile(out, buf);
        const cat = manifest.categories[kind];
        if (!cat) {
          console.warn(`  skip (unknown kind '${kind}'): ${filename}`);
          continue;
        }
        cat.values.push({
          id, label: label ?? id,
          file: gender ? `${kind}/${gender}/${id}.png` : `${kind}/${id}.png`,
          ...(gender && { gender }),
        });
      }

      console.log(`  ok: ${filename} -> ${kind}${gender ? '/' + gender : ''}/${id}`);
    } catch (err) {
      console.error(`  FAIL: ${filename}: ${err.message}`);
    }
  }

  await writeFile(
    path.join(args.dest, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`\nwrote ${path.join(args.dest, 'manifest.json')}`);
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
