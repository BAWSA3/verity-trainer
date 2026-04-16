/**
 * LPC Spritesheet Cropper for VERITY Trainer Creator
 *
 * Extracts the front-facing idle frame from LPC-style spritesheets.
 *
 * USAGE:
 *   node scripts/crop-sprites.js
 *
 * HOW IT WORKS:
 *   1. Drop your LPC spritesheets into /sprites-raw/ (create this folder)
 *   2. Name them by category and option ID:
 *      - base__body.png
 *      - hair__buzz.png, hair__spiky.png, hair__dreads.png, hair__afro.png, hair__mullet.png
 *      - tops__hoodie-black.png, tops__varsity.png, tops__oversized-tee.png, tops__bomber.png, tops__puffer.png
 *      - bottoms__cargo.png, bottoms__joggers.png, bottoms__baggy-jeans.png, bottoms__shorts.png, bottoms__track-pants.png
 *      - accessories__chain.png, accessories__sunglasses.png, accessories__cap.png, accessories__crossbody.png
 *
 *   3. Run this script — it crops the front-facing idle frame and saves to /public/sprites/
 *
 * LPC SPRITESHEET LAYOUT:
 *   - Standard LPC sheets are 832x1344 (13 cols x 21 rows of 64x64 frames)
 *   - The front-facing idle frame is at row 10 (0-indexed), column 0
 *   - That's pixel position (0, 640) in the full sheet
 *   - If your sheet uses a different layout, adjust FRONT_IDLE_ROW below
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// LPC standard: front-facing ("walk south") idle frame position
// Row 10 (0-indexed) is the "walk toward camera" row in standard LPC sheets
// Column 0 is the idle/standing frame
const FRAME_SIZE = 64;
const FRONT_IDLE_COL = 0;
const FRONT_IDLE_ROW = 10; // Standard LPC "walk down" row

// Alternative positions to try if the standard one is empty
const FALLBACK_POSITIONS = [
  { row: 10, col: 0 },  // Standard walk-down idle
  { row: 8, col: 0 },   // Some sheets use row 8
  { row: 0, col: 0 },   // Very top-left (some simple sheets)
  { row: 2, col: 0 },   // Walk-down in some 4-row sheets
];

const RAW_DIR = path.join(__dirname, '..', 'sprites-raw');
const OUT_DIR = path.join(__dirname, '..', 'public', 'sprites');

async function cropSprite(inputPath, outputPath) {
  const metadata = await sharp(inputPath).metadata();
  const { width, height } = metadata;

  console.log(`  Source: ${width}x${height}`);

  // Determine frame size based on sheet dimensions
  // Standard LPC: 832x1344 = 13x21 frames of 64x64
  // Some sheets: 576x768 = 9x12 frames of 64x64
  // Single frame: 64x64

  let frameW = FRAME_SIZE;
  let frameH = FRAME_SIZE;

  // If image is already small (single frame or close to it), just resize
  if (width <= 128 && height <= 128) {
    console.log(`  Already a single frame, resizing to ${FRAME_SIZE}x${FRAME_SIZE}`);
    await sharp(inputPath)
      .resize(FRAME_SIZE, FRAME_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);
    return;
  }

  // Try each fallback position to find a non-empty frame
  for (const pos of FALLBACK_POSITIONS) {
    const left = pos.col * frameW;
    const top = pos.row * frameH;

    // Skip if position is out of bounds
    if (left + frameW > width || top + frameH > height) continue;

    const cropped = sharp(inputPath)
      .extract({ left, top, width: frameW, height: frameH });

    // Check if this frame has any non-transparent pixels
    const { channels, info } = await cropped.clone().raw().toBuffer({ resolveWithObject: true });
    const pixels = new Uint8Array(channels);
    let hasContent = false;

    // Check alpha channel (every 4th byte in RGBA)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 10) {
        hasContent = true;
        break;
      }
    }

    if (hasContent) {
      console.log(`  Found frame at row=${pos.row}, col=${pos.col} (${left}, ${top})`);
      await cropped.png().toFile(outputPath);
      return;
    }
  }

  // Last resort: just take top-left frame
  console.log(`  Fallback: using top-left frame (0, 0)`);
  await sharp(inputPath)
    .extract({ left: 0, top: 0, width: frameW, height: frameH })
    .png()
    .toFile(outputPath);
}

async function main() {
  // Create raw directory if it doesn't exist
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
    console.log(`Created ${RAW_DIR}/`);
    console.log('');
    console.log('Drop your LPC spritesheets here with this naming convention:');
    console.log('  base__body.png');
    console.log('  hair__buzz.png');
    console.log('  hair__spiky.png');
    console.log('  tops__hoodie-black.png');
    console.log('  bottoms__cargo.png');
    console.log('  accessories__chain.png');
    console.log('');
    console.log('Format: {category}__{optionId}.png');
    console.log('Then re-run this script.');
    return;
  }

  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.png'));

  if (files.length === 0) {
    console.log('No PNG files found in sprites-raw/');
    console.log('Drop your LPC spritesheets there and re-run.');
    return;
  }

  console.log(`Found ${files.length} spritesheets to process\n`);

  for (const file of files) {
    const match = file.match(/^(.+?)__(.+?)\.png$/);
    if (!match) {
      console.log(`Skipping ${file} — name must be {category}__{id}.png`);
      continue;
    }

    const [, category, id] = match;
    const outDir = path.join(OUT_DIR, category);

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const inputPath = path.join(RAW_DIR, file);
    const outputPath = path.join(outDir, `${id}.png`);

    console.log(`Processing: ${file} → public/sprites/${category}/${id}.png`);

    try {
      await cropSprite(inputPath, outputPath);
      console.log(`  ✓ Done\n`);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`);
    }
  }

  console.log('All done! Now set USE_PNG_SPRITES = true in src/lib/trainer-options.ts');
}

main().catch(console.error);
