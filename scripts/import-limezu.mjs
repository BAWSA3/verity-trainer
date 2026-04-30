#!/usr/bin/env node
// LimeZu Modern Interiors character importer (verity-trainer V2 redesign).
//
// SKELETON — this script is config-driven by design because LimeZu's pack
// filename convention isn't known until the user unzips the asset. Two modes:
//
//   1. DISCOVER MODE (no import-config.json present)
//      Walks the pack and prints a summary of folders + sample filenames so
//      the user (or this importer's owner) can see the layout and write a
//      config. No PNGs are written.
//
//        node scripts/import-limezu.mjs --src ./vendor/limezu-pack --discover
//
//   2. IMPORT MODE (import-config.json present at <src>/import-config.json)
//      Walks the pack, applies the config's filename → category mapping,
//      extracts idle frames (or copies whole sprites if already cropped),
//      and writes a per-trait sprite tree + manifest.json to <dest>.
//
//        node scripts/import-limezu.mjs --src ./vendor/limezu-pack \
//                                       --dest ./public/sprites/limezu
//
// Output structure mirrors the Mana Seed importer:
//   <dest>/manifest.json
//   <dest>/body/<id>.png
//   <dest>/hair/<style>/<colorVariant>.png
//   <dest>/outfit/<id>.png            (or /<id>/<variant>.png if multi-color)
//   <dest>/accessory/<id>.png
//   <dest>/hat/<id>.png
//
// Idempotent — re-running rewrites the manifest + sprite tree.

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// ------- args -------
function parseArgs(argv) {
  const out = { src: null, dest: null, discover: false, size: 48 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--src') out.src = argv[++i];
    else if (argv[i] === '--dest') out.dest = argv[++i];
    else if (argv[i] === '--discover') out.discover = true;
    else if (argv[i] === '--size') out.size = parseInt(argv[++i], 10);
  }
  if (!out.src) {
    console.error(
      'usage: node scripts/import-limezu.mjs --src <pack> [--dest <out>] [--discover] [--size 16|32|48]'
    );
    process.exit(1);
  }
  if (!out.discover && !out.dest) {
    console.error('--dest is required unless --discover is set');
    process.exit(1);
  }
  return out;
}

// ------- helpers -------
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

function titleCase(s) {
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ------- discover mode -------
// Print a tree summary + sample filenames per folder so the user can write
// a sensible import-config.json.
async function runDiscover(src, sizeFilter) {
  console.log(`scanning ${src}...\n`);
  const files = await listFilesRecursive(src);
  console.log(`found ${files.length} png files total\n`);

  // Group by directory.
  const byDir = new Map();
  for (const f of files) {
    const rel = path.relative(src, f);
    const dir = path.dirname(rel);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(path.basename(f));
  }

  // Print sorted directory tree with sample filenames.
  const dirs = [...byDir.keys()].sort();
  for (const dir of dirs) {
    const files = byDir.get(dir).sort();
    console.log(`  ${dir || '.'}/  (${files.length} files)`);
    const samples = files.slice(0, 3);
    for (const s of samples) console.log(`    - ${s}`);
    if (files.length > 3) console.log(`    ... +${files.length - 3} more`);
  }

  console.log(
    '\nNext step: write vendor/limezu-pack/import-config.json modeled on import-config.example.json'
  );
  console.log(
    'Confirm: cell size (16/32/48), spritesheet vs single-frame, idle frame position.'
  );
}

// ------- import mode -------
//
// Config shape (vendor/limezu-pack/import-config.json):
//
//   {
//     "spriteSize": 48,                     // 16 | 32 | 48
//     "spritesheet": {                      // optional. If present, frames are
//       "cellWidth": 48,                    //   extracted; if absent, sprites
//       "cellHeight": 96,                   //   are copied whole.
//       "idleCol": 0,
//       "idleRow": 0
//     },
//     "bustCrop": { "x": 12, "y": 4, "w": 24, "h": 28 },
//     "rules": [
//       {
//         "match": "Character_Generator/Bodies/.*\\.png",
//         "category": "body",
//         "idFrom": "filename"              // strip ext, optionally apply slugify
//       },
//       {
//         "match": "Character_Generator/Hairstyles/(?<style>[^/]+)/(?<color>[^/]+)\\.png",
//         "category": "hair",
//         "styleFrom": "match.groups.style",
//         "variantFrom": "match.groups.color"
//       },
//       {
//         "match": "Character_Generator/Outfits/.*\\.png",
//         "category": "outfit",
//         "idFrom": "filename"
//       },
//       {
//         "match": "Character_Generator/Accessories/.*\\.png",
//         "category": "accessory",
//         "idFrom": "filename"
//       },
//       {
//         "match": "Character_Generator/Hats/.*\\.png",
//         "category": "hat",
//         "idFrom": "filename"
//       }
//     ],
//     "labels": {                           // optional friendly labels per id
//       "tee_white": "White Tee",
//       "denim_blue": "Blue Denim"
//     }
//   }
async function runImport({ src, dest }) {
  const configPath = path.join(src, 'import-config.json');
  if (!existsSync(configPath)) {
    console.error(
      `no ${configPath} found. Run with --discover first to inspect the pack, then write the config.`
    );
    process.exit(2);
  }
  const config = JSON.parse(await readFile(configPath, 'utf8'));

  // Validate config shape.
  if (!config.spriteSize) throw new Error('config: spriteSize required');
  if (!Array.isArray(config.rules) || config.rules.length === 0) {
    throw new Error('config: rules[] required');
  }

  // Wipe old generated tree (keep manifest.json itself for crash-recovery).
  for (const cat of ['body', 'eyes', 'hair', 'outfit', 'cloak', 'face', 'hat', 'accessory']) {
    const p = path.join(dest, cat);
    if (existsSync(p)) await rm(p, { recursive: true, force: true });
  }
  await ensureDir(dest);

  // Compile rule regexes.
  const compiledRules = config.rules.map((r) => ({
    ...r,
    re: new RegExp(r.match),
  }));

  const files = await listFilesRecursive(src);
  console.log(`scanning ${files.length} pngs in ${src}...`);

  const collected = {
    body: new Map(),
    eyes: new Map(),
    hair: new Map(), // styleId -> Map<variant, file>
    outfit: new Map(), // id -> Map<variant, file>  (variant 'default' if no swap)
    cloak: new Map(),
    face: new Map(),
    hat: new Map(),
    accessory: new Map(),
  };
  const hairColorVariants = new Set();
  const labels = config.labels || {};
  function labelFor(id) {
    return labels[id] || titleCase(id);
  }

  let imported = 0;
  let skipped = 0;

  for (const filepath of files) {
    const rel = path.relative(src, filepath).replace(/\\/g, '/');
    if (rel === 'import-config.json') continue;

    const rule = compiledRules.find((r) => r.re.test(rel));
    if (!rule) {
      skipped++;
      continue;
    }
    const match = rel.match(rule.re);

    try {
      // Resolve id / style / variant from the rule.
      const id = resolveField(rule.idFrom, match, filepath);
      const styleId = resolveField(rule.styleFrom, match, filepath);
      const variant = resolveField(rule.variantFrom, match, filepath) || 'default';
      const category = rule.category;
      if (!collected[category]) {
        console.error(`  unknown category in rule: ${category}`);
        skipped++;
        continue;
      }

      // Determine which directions to extract.
      // Modern config: spritesheet.directions = { s: {col,row}, e:..., w:..., n:... }
      // Legacy config: spritesheet.idleCol / idleRow → treat as single 's' direction.
      // No spritesheet block: copy file as-is, single 'default' direction (no suffix).
      let dirExtractions; // Array of { dir, buffer }
      if (config.spritesheet?.directions) {
        const { cellWidth, cellHeight, directions } = config.spritesheet;
        dirExtractions = [];
        for (const [dir, pos] of Object.entries(directions)) {
          const buf = await sharp(filepath)
            .extract({
              left: pos.col * cellWidth,
              top: pos.row * cellHeight,
              width: cellWidth,
              height: cellHeight,
            })
            .png()
            .toBuffer();
          dirExtractions.push({ dir, buffer: buf });
        }
      } else if (config.spritesheet) {
        const { cellWidth, cellHeight, idleCol = 0, idleRow = 0 } = config.spritesheet;
        const buf = await sharp(filepath)
          .extract({
            left: idleCol * cellWidth,
            top: idleRow * cellHeight,
            width: cellWidth,
            height: cellHeight,
          })
          .png()
          .toBuffer();
        dirExtractions = [{ dir: 's', buffer: buf }];
      } else {
        dirExtractions = [{ dir: null, buffer: await readFile(filepath) }];
      }

      // Write per-direction files. dir=null means no suffix (single-direction asset).
      for (const { dir, buffer } of dirExtractions) {
        const suffix = dir ? `-${dir}` : '';
        if (category === 'hair') {
          if (!styleId) throw new Error(`hair rule did not produce styleId for ${rel}`);
          const styleDir = path.join(dest, 'hair', styleId);
          await ensureDir(styleDir);
          await writeFile(path.join(styleDir, `${variant}${suffix}.png`), buffer);
        } else if (category === 'body' || category === 'eyes') {
          const outFile = path.join(dest, category, `${id}${suffix}.png`);
          await ensureDir(path.dirname(outFile));
          await writeFile(outFile, buffer);
        } else {
          const slot = path.join(dest, category, id);
          await ensureDir(slot);
          await writeFile(path.join(slot, `${variant}${suffix}.png`), buffer);
        }
      }

      // Record the asset in the catalog (only once per logical asset, not per direction).
      if (category === 'hair') {
        if (!collected.hair.has(styleId)) collected.hair.set(styleId, new Map());
        collected.hair.get(styleId).set(variant, true);
        hairColorVariants.add(variant);
      } else if (category === 'body' || category === 'eyes') {
        collected[category].set(id, {
          id,
          label: labelFor(id),
          file: `${category}/${id}.png`, // logical path — renderers add direction suffix
        });
      } else {
        if (!collected[category].has(id)) collected[category].set(id, new Map());
        collected[category].get(id).set(variant, true);
      }

      imported++;
    } catch (err) {
      console.error(`  FAIL: ${rel}: ${err.message}`);
      skipped++;
    }
  }

  // Build manifest.
  const spritesheet = config.spritesheet;
  const directions = spritesheet?.directions ? Object.keys(spritesheet.directions) : null;
  const manifest = {
    version: 1,
    source: 'limezu',
    generatedAt: new Date().toISOString(),
    spriteWidth: spritesheet ? spritesheet.cellWidth : config.spriteSize,
    spriteHeight: spritesheet ? spritesheet.cellHeight : config.spriteSize,
    directions, // ['s','e','w','n'] when multi-direction; null when single-direction
    defaultDirection: directions ? (config.spritesheet.defaultDirection || 's') : null,
    bustCrop: config.bustCrop || { x: 0, y: 0, w: config.spriteSize, h: Math.floor(config.spriteSize * 0.6) },
    categories: {
      body: {
        values: [...collected.body.values()].sort((a, b) => a.id.localeCompare(b.id)),
      },
      eyes: {
        values: [...collected.eyes.values()].sort((a, b) => a.id.localeCompare(b.id)),
      },
      hair: {
        supportsColor: true,
        values: [...collected.hair.keys()].sort().map((styleId) => ({
          id: styleId,
          label: labelFor(styleId),
        })),
      },
      hairColor: {
        values: [...hairColorVariants].sort().map((variant) => ({
          id: variant,
          label: labelFor(variant) || titleCase(variant),
        })),
      },
      outfit: {
        values: flattenIdVariants(collected.outfit, labels).sort((a, b) =>
          a.id.localeCompare(b.id)
        ),
      },
      cloak: {
        optional: true,
        values: [
          { id: 'none', label: 'None' },
          ...flattenIdVariants(collected.cloak, labels).sort((a, b) =>
            a.id.localeCompare(b.id)
          ),
        ],
      },
      face: {
        optional: true,
        values: [
          { id: 'none', label: 'None' },
          ...flattenIdVariants(collected.face, labels).sort((a, b) =>
            a.id.localeCompare(b.id)
          ),
        ],
      },
      hat: {
        optional: true,
        values: [
          { id: 'none', label: 'None' },
          ...flattenIdVariants(collected.hat, labels).sort((a, b) =>
            a.id.localeCompare(b.id)
          ),
        ],
      },
      accessory: {
        optional: true,
        values: [
          { id: 'none', label: 'None' },
          ...flattenIdVariants(collected.accessory, labels).sort((a, b) =>
            a.id.localeCompare(b.id)
          ),
        ],
      },
    },
  };

  await writeFile(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\nimport complete. imported=${imported} skipped=${skipped}`);
  console.log(`manifest -> ${path.join(dest, 'manifest.json')}`);
  console.log(`body: ${collected.body.size} variants`);
  console.log(`eyes: ${collected.eyes.size} variants`);
  console.log(`hair: ${collected.hair.size} styles × ${hairColorVariants.size} colors`);
  console.log(`outfit: ${flattenIdVariants(collected.outfit, labels).length} options`);
  console.log(`accessory: ${flattenIdVariants(collected.accessory, labels).length} options`);
  console.log(`hat: ${flattenIdVariants(collected.hat, labels).length} options`);
}

// Resolve a config field reference like "filename", "match.groups.style",
// "match[1]" against the provided regex match + filepath.
function resolveField(spec, match, filepath) {
  if (!spec) return null;
  if (spec === 'filename') {
    return path.basename(filepath, '.png').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }
  if (spec.startsWith('match.groups.')) {
    const key = spec.replace('match.groups.', '');
    return match.groups?.[key] ?? null;
  }
  const idxMatch = spec.match(/^match\[(\d+)\]$/);
  if (idxMatch) return match[parseInt(idxMatch[1], 10)] ?? null;
  return null;
}

function flattenIdVariants(idMap, labels = {}) {
  const out = [];
  for (const [id, variants] of idMap) {
    for (const variant of variants.keys()) {
      // If only one variant ('default'), expose just the id.
      if (variants.size === 1 && variant === 'default') {
        out.push({ id, label: labels[id] || titleCase(id), baseId: id, variant });
      } else {
        const slug = `${id}-${variant}`;
        out.push({
          id: slug,
          label: `${labels[id] || titleCase(id)} ${variant}`,
          baseId: id,
          variant,
        });
      }
    }
  }
  return out;
}

// ------- main -------
async function main() {
  const args = parseArgs(process.argv);
  if (args.discover) {
    await runDiscover(args.src, args.size);
    return;
  }
  await runImport(args);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
