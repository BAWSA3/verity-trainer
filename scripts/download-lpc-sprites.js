/**
 * LPC Sprite Downloader & Processor for VERITY Trainer Creator
 *
 * Downloads sprite sheets from the LPC repository, extracts the
 * front-facing idle frame, and places them in public/sprites/.
 *
 * Usage: node scripts/download-lpc-sprites.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://raw.githubusercontent.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets';

// LPC spritesheet layout:
// Standard walk.png: 9 columns x 4 rows of 64x64 frames
// Row 0: walk up, Row 1: walk left, Row 2: walk down (front-facing), Row 3: walk right
// Column 0 of Row 2 = front-facing idle frame
const FRAME_W = 64;
const FRAME_H = 64;
const FRONT_FACING_ROW = 2; // "walk down" row = facing camera
const IDLE_COL = 0;

// What we want to download
const SPRITES = {
  // Body - male base (we'll palette-swap for skin tones)
  body: [
    { id: 'base', path: 'body/bodies/male/walk.png' },
  ],
  // Hair styles
  hair: [
    { id: 'buzzcut', path: 'hair/buzzcut/adult/walk.png' },
    { id: 'spiky', path: 'hair/spiked/adult/walk.png' },
    { id: 'dreads', path: 'hair/dreadlocks_long/adult/walk.png' },
    { id: 'afro', path: 'hair/jewfro/adult/walk.png' },
    { id: 'mullet', path: 'hair/longhawk/adult/walk.png' },
  ],
  // Tops
  tops: [
    { id: 'hoodie', path: 'torso/clothes/longsleeve/longsleeve/male/walk.png' },
    { id: 'varsity', path: 'torso/jacket/collared/male/walk.png' },
    { id: 'tee', path: 'torso/clothes/shortsleeve/male/walk.png' },
    { id: 'trench', path: 'torso/jacket/trench/male/walk.png' },
    { id: 'vest', path: 'torso/clothes/longsleeve/longsleeve2_cardigan/male/walk.png' },
  ],
  // Bottoms
  bottoms: [
    { id: 'pants', path: 'legs/pants/male/walk.png' },
    { id: 'shorts', path: 'legs/shorts/male/walk.png' },
    { id: 'formal', path: 'legs/formal/male/walk.png' },
    { id: 'cuffed', path: 'legs/cuffed/male/walk.png' },
    { id: 'leggings', path: 'legs/leggings/male/walk.png' },
  ],
  // Accessories
  accessories: [
    { id: 'hood', path: 'hat/cloth/hood/male/walk.png' },
    { id: 'bandana', path: 'hat/cloth/bandana/male/walk.png' },
    { id: 'headband', path: 'hat/headband/headband/male/walk.png' },
    { id: 'leather-cap', path: 'hat/cloth/leather_cap/male/walk.png' },
  ],
};

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function extractFrontFrame(buffer) {
  const metadata = await sharp(buffer).metadata();

  // Calculate position of front-facing idle frame
  const left = IDLE_COL * FRAME_W;
  const top = FRONT_FACING_ROW * FRAME_H;

  // Make sure we don't go out of bounds
  if (left + FRAME_W > metadata.width || top + FRAME_H > metadata.height) {
    console.log(`    Sheet is ${metadata.width}x${metadata.height}, trying row 0 col 0 instead`);
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

// Palette swap for skin tones
// The base LPC body uses the "light" palette by default
const BASE_PALETTE = ['#271920', '#99423c', '#cc8665', '#E4A47C', '#F9D5BA', '#FAECE7'];

const SKIN_PALETTES = {
  light:  ['#271920', '#99423c', '#cc8665', '#E4A47C', '#F9D5BA', '#FAECE7'],
  medium: ['#271920', '#442725', '#7F4C31', '#AE6B3F', '#D38B59', '#E4A47C'],
  tan:    ['#271920', '#503734', '#785946', '#936849', '#BA8454', '#C7935F'],
  brown:  ['#120E10', '#412B29', '#5F4539', '#76513A', '#9C663E', '#B8773F'],
  dark:   ['#000000', '#1A1213', '#2E1F1C', '#442725', '#603429', '#7F4C31'],
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

async function paletteSwap(buffer, fromPalette, toPalette) {
  const image = sharp(buffer);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);

  const fromRgb = fromPalette.map(hexToRgb);
  const toRgb = toPalette.map(hexToRgb);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    // Find matching palette color (with tolerance of 5)
    for (let j = 0; j < fromRgb.length; j++) {
      if (Math.abs(r - fromRgb[j].r) <= 5 &&
          Math.abs(g - fromRgb[j].g) <= 5 &&
          Math.abs(b - fromRgb[j].b) <= 5) {
        pixels[i] = toRgb[j].r;
        pixels[i + 1] = toRgb[j].g;
        pixels[i + 2] = toRgb[j].b;
        break;
      }
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();
}

async function main() {
  const outBase = path.join(__dirname, '..', 'public', 'sprites');

  // Ensure output directories exist
  for (const category of ['base', 'hair', 'tops', 'bottoms', 'accessories']) {
    fs.mkdirSync(path.join(outBase, category), { recursive: true });
  }

  let downloaded = 0;
  let failed = 0;

  // Download and process each category
  for (const [category, items] of Object.entries(SPRITES)) {
    console.log(`\n=== ${category.toUpperCase()} ===`);

    for (const item of items) {
      const url = `${BASE_URL}/${item.path}`;
      console.log(`  Downloading ${item.id}...`);
      console.log(`    ${url}`);

      try {
        const buffer = await download(url);
        console.log(`    Downloaded ${buffer.length} bytes`);

        const frame = await extractFrontFrame(buffer);
        console.log(`    Extracted front-facing frame`);

        if (category === 'body') {
          // Generate skin tone variants
          for (const [tone, palette] of Object.entries(SKIN_PALETTES)) {
            const swapped = await paletteSwap(frame, BASE_PALETTE, palette);
            const outPath = path.join(outBase, 'base', `${tone}.png`);
            fs.writeFileSync(outPath, swapped);
            console.log(`    Saved skin tone: ${tone}`);
          }
        } else {
          const outPath = path.join(outBase, category, `${item.id}.png`);
          fs.writeFileSync(outPath, frame);
          console.log(`    Saved: ${category}/${item.id}.png`);
        }

        downloaded++;
      } catch (err) {
        console.error(`    FAILED: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Downloaded: ${downloaded}, Failed: ${failed}`);
  console.log(`Sprites saved to: public/sprites/`);

  if (downloaded > 0) {
    console.log(`\nNext steps:`);
    console.log(`1. Set USE_PNG_SPRITES = true in src/lib/trainer-options.ts`);
    console.log(`2. Update option IDs in trainer-options.ts to match the new filenames`);
    console.log(`3. Run npm run dev and test`);
  }
}

main().catch(console.error);
