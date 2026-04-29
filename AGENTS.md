<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Verity Trainer specifics

## Sprite system
- All hi-fi pixel sprites live under `public/sprites/limezu/`. The customizer + OG route read from `public/sprites/limezu/manifest.json`. Do not hardcode sprite IDs or file paths in components — read the manifest.
- The Limezu pack is licensed; source files live in `vendor/limezu-pack/` (gitignored). Do not commit them. The generated PNGs in `public/sprites/limezu/` are derivatives — verify the Limezu license permits redistribution before opening the repo to the public.
- The legacy LPC sprite tree at `public/sprites/{accessories,body,bottoms,face,facial-hair,hair,head,neck,shoes,tops}/` is dead code as of the V1 redesign and is scheduled for deletion after May 10 launch. Do not add to it.
- Re-running the importer is safe: `node scripts/import-limezu.mjs --src ./vendor/limezu-pack --dest ./public/sprites/limezu`. It is idempotent and rewrites manifest.json from the source pack each time.

## Trainer config schema versioning
- `trainer_signups.trainer_config` is JSONB. Two schema versions coexist:
  - **v1 (legacy):** bare `TrainerConfig` with old keys (`accessory`, `face`, `neck`, `facialHair`) and `gender: 'male' | 'female'`.
  - **v2 (current):** `{ schemaVersion: 2, config: TrainerConfig, personality: TrainerPersonality }`. New keys (`outerwear`, `hat`, `glasses`, `expression`). Gender is `'m' | 'f'`.
- Reads MUST go through `unpackTrainer()` in `src/lib/trainer-data.ts` to handle both. It normalizes legacy gender + drops legacy-only fields + defaults missing optional layers to `'none'` + returns empty personality for v1 rows.
- Writes always emit v2. Use `packTrainer()` from the same file.

## Moderation pipeline
- The `/api/signup` POST handler is a fixed 7-step pipeline: rate-limit → field validation → email format → disposable-email block → name moderation → handle validation → config validation → DB upsert. Personality validation slots between config validation and DB upsert.
- All user-typed strings (trainer name, X handle, likes, dislikes) get the same tri-layer check pattern: static slurs+profanity+brand blocklist, then OpenAI omni-moderation. See `src/lib/moderation/check-name.ts` (template) and `src/lib/moderation/check-personality.ts`.
- Read-time, public-facing pages (`/card/[id]`, `/api/og`) re-sanitize via `sanitize.ts` as a backstop — runs only static layers (no OpenAI per pageview).
- Audit-log every flagged attempt with a specific `flag_reason` for blocklist tuning.

## Things you'll be tempted to do but shouldn't
- **Don't add new sprite categories without updating `manifest.json` AND `check-config.ts`'s `ALL_KEYS` const.** Server-side validation will reject the unknown category as `unknown_id` and signups will start failing silently.
- **Don't refactor the signup pipeline to "DRY it up".** The flat 7-step pipeline is intentional — every step has its own audit-log path with a distinct `flag_reason`. Keep the literal step ordering.
- **Don't change OG image URL params** without checking `card/[id]/page.tsx` — the metadata generation builds the URL by hand. New params (`z`, `lk`, `dl`) were added for V2 personality; preserve their order if you reorganize.
- **Don't bake hair-color tinting at render time.** Pre-rendered per-color PNG variants live in `public/sprites/limezu/hair/<colorId>/<style>.png`. Both client renderer and OG sharp pipeline load the matching pre-rendered file.
- **Don't read `row.trainer_config` directly** anywhere except inside `unpackTrainer()`. Direct reads will misrender legacy v1 rows.
