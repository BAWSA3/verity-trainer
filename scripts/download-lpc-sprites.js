/**
 * LPC Sprite Downloader & Processor for VERITY Trainer Creator (v2)
 *
 * Downloads all sprites used by the customizer from the LPC repository,
 * extracts the front-facing idle frame, and writes them into a
 * gender-aware directory structure under public/sprites/.
 *
 *   public/sprites/
 *     body/{male,female}/{tone}.png
 *     head/{male,female}/{tone}.png
 *     hair/{id}.png
 *     tops/{male,female}/{id}.png
 *     bottoms/{id}.png
 *     accessories/{id}.png
 *
 * Usage: node scripts/download-lpc-sprites.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL =
  'https://raw.githubusercontent.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets';

// LPC standard layout: 9x4 frames of 64x64 each. Row 2 = walk-down = facing camera.
const FRAME_W = 64;
const FRAME_H = 64;
const FRONT_FACING_ROW = 2;
const IDLE_COL = 0;

// ---------------------------------------------------------------------------
// Skin-tone palettes (10 tones, ordered lightest → darkest)
// Each palette has 6 colors matching LPC's base body shading (dark → light)
// ---------------------------------------------------------------------------
const SKIN_TONES = {
  porcelain: ['#30262E', '#B56160', '#E1A693', '#F4CABB', '#FFE1D0', '#FFF5EA'],
  light:     ['#271920', '#99423C', '#CC8665', '#E4A47C', '#F9D5BA', '#FAECE7'],
  fair:      ['#2C1F24', '#803728', '#B3785C', '#D29A76', '#EFC3A4', '#F2DEC8'],
  olive:     ['#1A1510', '#5E4831', '#8C6F44', '#B08E5B', '#C9AE7A', '#DEC996'],
  medium:    ['#271920', '#442725', '#7F4C31', '#AE6B3F', '#D38B59', '#E4A47C'],
  tan:       ['#271920', '#503734', '#785946', '#936849', '#BA8454', '#C7935F'],
  bronze:    ['#1E120E', '#6B3A2F', '#9D5A3E', '#BB7648', '#D0935A', '#E0B07A'],
  brown:     ['#120E10', '#412B29', '#5F4539', '#76513A', '#9C663E', '#B8773F'],
  mahogany:  ['#0D0809', '#33211D', '#5C3A2F', '#78503D', '#94674C', '#AB7F5F'],
  ebony:     ['#000000', '#1A1213', '#2E1F1C', '#442725', '#603429', '#7F4C31'],
};
const BASE_PALETTE = SKIN_TONES.light;

// ---------------------------------------------------------------------------
// Sprite catalog
// ---------------------------------------------------------------------------

// Body + head — per-gender, palette-swapped per tone
const BODY_HEAD_SOURCES = {
  body: {
    male: 'body/bodies/male/walk.png',
    female: 'body/bodies/female/walk.png',
  },
  head: {
    male: 'head/heads/human/male/walk.png',
    female: 'head/heads/human/female/walk.png',
  },
};

// Hair — universal (LPC adult folder works for both genders)
const HAIR = [
  { id: 'buzz',     path: 'hair/buzzcut/adult/walk.png' },
  { id: 'spiky',    path: 'hair/spiked/adult/walk.png' },
  { id: 'dreads',   path: 'hair/dreadlocks_long/adult/walk.png' },
  { id: 'afro',     path: 'hair/jewfro/adult/walk.png' },
  { id: 'mullet',   path: 'hair/longhawk/adult/walk.png' },
  { id: 'bangs',    path: 'hair/bangs/adult/walk.png' },
  { id: 'long',     path: 'hair/long/adult/walk.png' },
  { id: 'pigtails', path: 'hair/pigtails/adult/walk.png' },
  { id: 'bedhead',  path: 'hair/bedhead/adult/walk.png' },
  { id: 'loose',    path: 'hair/loose/adult/walk.png' },
  { id: 'swoop',    path: 'hair/swoop/adult/walk.png' },
  { id: 'halfmess', path: 'hair/halfmessy/adult/walk.png' },
  { id: 'unkempt',  path: 'hair/unkempt/adult/walk.png' },
];

// Tops — both genders, verified walk.png paths
// Pattern: ${base}/${gender}/walk.png
const TOPS = [
  { id: 'hoodie',     base: 'torso/clothes/longsleeve/longsleeve' },
  { id: 'longsleeve', base: 'torso/clothes/longsleeve/longsleeve2' },
  { id: 'cardigan',   base: 'torso/clothes/longsleeve/longsleeve2_cardigan' },
  { id: 'buttondown', base: 'torso/clothes/longsleeve/longsleeve2_buttoned' },
  { id: 'polo-long',  base: 'torso/clothes/longsleeve/longsleeve2_polo' },
  { id: 'vneck-long', base: 'torso/clothes/longsleeve/longsleeve2_vneck' },
  { id: 'scoop-long', base: 'torso/clothes/longsleeve/longsleeve2_scoop' },
  { id: 'tee',        base: 'torso/clothes/shortsleeve/tshirt' },
  { id: 'vneck',      base: 'torso/clothes/shortsleeve/tshirt_vneck' },
  { id: 'scoop',      base: 'torso/clothes/shortsleeve/tshirt_scoop' },
  { id: 'sleeves',    base: 'torso/clothes/shortsleeve/shortsleeves' },
  { id: 'polo',       base: 'torso/clothes/shortsleeve/shortsleeve_polo' },
  { id: 'cardigan-s', base: 'torso/clothes/shortsleeve/shortsleeve_cardigan' },
];

// Bottoms — universal (LPC bottoms are male-sprited but layer fine on either body)
// For each: fromPath = direct walk.png from LPC; colorFile = if the LPC item uses
// a walk/{color}.png structure instead.
const BOTTOMS = [
  { id: 'pants',          fromPath: 'legs/pants/male/walk.png' },
  { id: 'shorts',         fromPath: 'legs/shorts/shorts/male/walk.png' },
  { id: 'formal',         fromPath: 'legs/formal/male/walk.png' },
  { id: 'leggings',       fromPath: 'legs/leggings/male/walk.png' },
  { id: 'cuffed',         fromPath: 'legs/cuffed/male/walk.png' },
  { id: 'pantaloons',     fromPath: 'legs/pantaloons/male/walk.png' },
  { id: 'skirt-plain',    fromPath: 'legs/skirts/plain/female/walk/black.png' },
  { id: 'skirt-straight', fromPath: 'legs/skirts/straight/female/walk/black.png' },
];

// Accessories — universal
const ACCESSORIES = [
  { id: 'hood',        path: 'hat/cloth/hood/adult/walk.png' },
  { id: 'hood-sack',   path: 'hat/cloth/hood_sack/adult/walk.png' },
  { id: 'bandana',     path: 'hat/cloth/bandana/adult/walk.png' },
  { id: 'bandana2',    path: 'hat/cloth/bandana2/adult/walk.png' },
  { id: 'leather-cap', path: 'hat/cloth/leather_cap/adult/walk.png' },
  { id: 'tophat',      path: 'hat/formal/tophat/adult/walk.png' },
  { id: 'bowler',      path: 'hat/formal/bowler/adult/walk.png' },
  { id: 'visor',       path: 'hat/visor/round/adult/walk.png' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return download(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function extractFrontFrame(buffer) {
  const meta = await sharp(buffer).metadata();
  const left = IDLE_COL * FRAME_W;
  const top = FRONT_FACING_ROW * FRAME_H;
  if (left + FRAME_W > meta.width || top + FRAME_H > meta.height) {
    // Fallback — grab row 0 col 0
    return sharp(buffer)
      .extract({ left: 0, top: 0, width: FRAME_W, height: FRAME_H })
      .png()
      .toBuffer();
  }
  return sharp(buffer)
    .extract({ left, top, width: FRAME_W, height: FRAME_H })
    .png()
    .toBuffer();
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

async function paletteSwap(buffer, fromPalette, toPalette) {
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  const from = fromPalette.map(hexToRgb);
  const to = toPalette.map(hexToRgb);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i],
      g = pixels[i + 1],
      b = pixels[i + 2];
    for (let j = 0; j < from.length; j++) {
      if (
        Math.abs(r - from[j].r) <= 5 &&
        Math.abs(g - from[j].g) <= 5 &&
        Math.abs(b - from[j].b) <= 5
      ) {
        pixels[i] = to[j].r;
        pixels[i + 1] = to[j].g;
        pixels[i + 2] = to[j].b;
        break;
      }
    }
  }
  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const root = path.join(__dirname, '..', 'public', 'sprites');

  // Nuke old layout to avoid stale files mixing with new
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }

  const successes = [];
  const failures = [];

  // --- Body + Head (gendered + tone-swapped) ---
  for (const category of ['body', 'head']) {
    for (const gender of ['male', 'female']) {
      const url = `${BASE_URL}/${BODY_HEAD_SOURCES[category][gender]}`;
      console.log(`\n${category.toUpperCase()} / ${gender}`);
      try {
        const buf = await download(url);
        const frame = await extractFrontFrame(buf);
        const outDir = path.join(root, category, gender);
        ensureDir(outDir);
        for (const [tone, palette] of Object.entries(SKIN_TONES)) {
          const swapped = await paletteSwap(frame, BASE_PALETTE, palette);
          fs.writeFileSync(path.join(outDir, `${tone}.png`), swapped);
          successes.push(`${category}/${gender}/${tone}.png`);
        }
        console.log(`  ✓ ${Object.keys(SKIN_TONES).length} tones saved`);
      } catch (err) {
        console.error(`  ✗ ${err.message}`);
        failures.push(`${category}/${gender}: ${err.message}`);
      }
    }
  }

  // --- Hair (universal) ---
  console.log('\nHAIR');
  ensureDir(path.join(root, 'hair'));
  for (const h of HAIR) {
    try {
      const buf = await download(`${BASE_URL}/${h.path}`);
      const frame = await extractFrontFrame(buf);
      fs.writeFileSync(path.join(root, 'hair', `${h.id}.png`), frame);
      successes.push(`hair/${h.id}.png`);
      console.log(`  ✓ ${h.id}`);
    } catch (err) {
      console.error(`  ✗ ${h.id}: ${err.message}`);
      failures.push(`hair/${h.id}: ${err.message}`);
    }
  }

  // --- Tops (per gender) ---
  for (const gender of ['male', 'female']) {
    console.log(`\nTOPS / ${gender}`);
    ensureDir(path.join(root, 'tops', gender));
    for (const t of TOPS) {
      const url = `${BASE_URL}/${t.base}/${gender}/walk.png`;
      try {
        const buf = await download(url);
        const frame = await extractFrontFrame(buf);
        fs.writeFileSync(path.join(root, 'tops', gender, `${t.id}.png`), frame);
        successes.push(`tops/${gender}/${t.id}.png`);
        console.log(`  ✓ ${t.id}`);
      } catch (err) {
        console.error(`  ✗ ${t.id}: ${err.message}`);
        failures.push(`tops/${gender}/${t.id}: ${err.message}`);
      }
    }
  }

  // --- Bottoms (universal) ---
  console.log('\nBOTTOMS');
  ensureDir(path.join(root, 'bottoms'));
  for (const b of BOTTOMS) {
    try {
      const buf = await download(`${BASE_URL}/${b.fromPath}`);
      const frame = await extractFrontFrame(buf);
      fs.writeFileSync(path.join(root, 'bottoms', `${b.id}.png`), frame);
      successes.push(`bottoms/${b.id}.png`);
      console.log(`  ✓ ${b.id}`);
    } catch (err) {
      console.error(`  ✗ ${b.id}: ${err.message}`);
      failures.push(`bottoms/${b.id}: ${err.message}`);
    }
  }

  // --- Accessories (universal) ---
  console.log('\nACCESSORIES');
  ensureDir(path.join(root, 'accessories'));
  for (const a of ACCESSORIES) {
    try {
      const buf = await download(`${BASE_URL}/${a.path}`);
      const frame = await extractFrontFrame(buf);
      fs.writeFileSync(path.join(root, 'accessories', `${a.id}.png`), frame);
      successes.push(`accessories/${a.id}.png`);
      console.log(`  ✓ ${a.id}`);
    } catch (err) {
      console.error(`  ✗ ${a.id}: ${err.message}`);
      failures.push(`accessories/${a.id}: ${err.message}`);
    }
  }

  console.log('\n═════════════════════════════════════');
  console.log(`Saved:  ${successes.length} sprites`);
  console.log(`Failed: ${failures.length}`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  console.log('═════════════════════════════════════');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
