#!/usr/bin/env node
// Import LimeZu Modern Interiors home designs as scene PNGs for the dashboard's
// SceneWindow. Reads pre-rendered preview PNGs from the source pack and
// generates a sibling manifest at public/sprites/limezu/scenes/manifest.json.
//
// Usage:
//   node scripts/import-limezu-scenes.mjs \
//     --src "D:/Downloads/moderninteriors-win/6_Home_Designs" \
//     --dest ./public/sprites/limezu/scenes
//
// The pack source is gitignored separately — but the *output* PNGs are
// committed to the repo as derivatives within the LimeZu license (commercial
// use OK with attribution).

import { readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function parseArgs(argv) {
  const out = { src: null, dest: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--src') out.src = argv[++i];
    else if (argv[i] === '--dest') out.dest = argv[++i];
  }
  if (!out.src || !out.dest) {
    console.error('usage: --src <home_designs_dir> --dest <out_dir>');
    process.exit(1);
  }
  return out;
}

// Curated scene picks. trainerX/Y are in % of scene dimensions (where to
// composite the trainer sprite — anchor is the trainer's feet).
const PICKS = [
  {
    id: 'generic-home',
    label: 'Home',
    file: 'Generic_Home_Designs/48x48/Generic_Home_1_preview_48x48.png',
    trainerX: 50, trainerY: 60,
  },
  {
    id: 'japanese-home',
    label: 'Tea Room',
    file: 'Japanese_Interiors_Home_Designs/48x48/Japanese_Home_1_preview_48x48.png',
    trainerX: 50, trainerY: 65,
  },
  {
    id: 'gym',
    label: 'Gym',
    file: 'Gym_Designs/48x48/Gym_2_preview_48x48.png',
    trainerX: 50, trainerY: 65,
  },
  {
    id: 'museum',
    label: 'Museum',
    file: 'Museum_Designs/48x48/Museum_room_1_preview_48x48.png',
    trainerX: 50, trainerY: 70,
  },
  {
    id: 'tv-studio',
    label: 'Studio',
    file: 'TV_Studio_Designs/48x48/Tv_Studio_Design_preview_48x48.png',
    trainerX: 50, trainerY: 70,
  },
];

async function main() {
  const args = parseArgs(process.argv);
  if (existsSync(args.dest)) {
    await rm(args.dest, { recursive: true, force: true });
  }
  await mkdir(args.dest, { recursive: true });

  const manifest = { scenes: [] };
  for (const pick of PICKS) {
    const srcPath = path.join(args.src, pick.file);
    if (!existsSync(srcPath)) {
      console.warn(`  skip (missing): ${srcPath}`);
      continue;
    }
    const outName = `${pick.id}.png`;
    const destPath = path.join(args.dest, outName);
    // Resize/optimize: cap at 800px wide for web. Pixelated rendering preserves crispness.
    const meta = await sharp(srcPath).metadata();
    if ((meta.width ?? 0) > 800) {
      await sharp(srcPath).resize({ width: 800, kernel: 'nearest' }).png().toFile(destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
    console.log(`  ✓ ${pick.id} (${pick.label}) ← ${pick.file}`);
    manifest.scenes.push({
      id: pick.id,
      label: pick.label,
      file: `/sprites/limezu/scenes/${outName}`,
      trainerX: pick.trainerX,
      trainerY: pick.trainerY,
    });
  }
  await writeFile(
    path.join(args.dest, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`\nimport complete. ${manifest.scenes.length} scenes → ${args.dest}/manifest.json`);
}

main().catch((err) => {
  console.error('scene import failed:', err);
  process.exit(1);
});
