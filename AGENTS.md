<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Verity Trainer specifics

## Sprite system
- Hi-fi pixel sprites live under `public/sprites/manaseed/`. The customizer + OG route read from `public/sprites/manaseed/manifest.json`. Do not hardcode sprite IDs or file paths in components — read the manifest.
- Source pack lives at `vendor/manaseed-pack/` (gitignored — Mana Seed Character Base by Seliel the Shaper). The free demo permits commercial use; verify license terms before adding paid extension packs.
- Run `node scripts/import-manaseed.mjs --src ./vendor/manaseed-pack --dest ./public/sprites/manaseed` to regenerate the sprite tree + manifest. Idempotent.
- The legacy LPC sprite tree at `public/sprites/{accessories,body,bottoms,face,facial-hair,hair,head,neck,shoes,tops}/` is dead code as of the V1 redesign and is scheduled for deletion after May 10 launch. Do not add to it.

## Mana Seed layer model
Mana Seed is a paper-doll layered system. Layer order from bottom to top (per Seliel's `using this base.txt`):
1. `0bas` body (skin tone variant)
2. `1out` outfit (single-piece, top + bottom combined)
3. `2clo` cloak / cape / mantle (optional)
4. `3fac` face items (glasses / mask, optional)
5. `4har` hair (style + color variant)
6. `5hat` hat / hood (optional)
7. `6tla` / `7tlb` tools — V1 skips weapons

Mana Seed is **gender-neutral** by design — there's no `m`/`f` split. The body is a single skeleton, all outfits/hairs layer onto it.

## Trainer config schema versioning
- `trainer_signups.trainer_config` is JSONB. Two schema versions coexist:
  - **v1 (legacy, pre-Mana-Seed):** bare config with `gender`, `top`, `bottom`, `face`, `neck`, `accessory`, `facialHair` etc.
  - **v2 (current, Mana Seed):** `{ schemaVersion: 2, config: { body, hair, hairColor, outfit, cloak, face, hat }, personality: { zodiac, likes, dislikes } }`.
- Reads MUST go through `unpackTrainer()` in `src/lib/trainer-data.ts` to handle both. It returns the v2 shape, drops legacy-only fields, and defaults missing optional layers to `'none'`. Legacy rows render with a blank body (their old top/bottom/face don't map cleanly onto Mana Seed) — those users need to revisit `/create` for a v2 config.
- Writes always emit v2. Use `packTrainer()` from the same file.

## Moderation pipeline
- The `/api/signup` POST handler is a fixed pipeline: rate-limit → field validation → email format → disposable-email block → name moderation → handle validation → config validation → personality validation → DB upsert. Personality validation slots between config validation and DB upsert.
- All user-typed strings (trainer name, X handle, likes, dislikes) get the same tri-layer check pattern: static slurs+profanity+brand blocklist, then OpenAI omni-moderation. See `src/lib/moderation/check-name.ts` (template) and `src/lib/moderation/check-personality.ts`.
- Read-time, public-facing pages (`/card/[id]`, `/api/og`) re-sanitize via `sanitize.ts` as a backstop — runs only static layers (no OpenAI per pageview).
- Audit-log every flagged attempt with a specific `flag_reason` for blocklist tuning.

## Things you'll be tempted to do but shouldn't
- **Don't add new sprite categories without updating `manifest.json` AND `check-config.ts`'s `ALL_KEYS` const.** Server-side validation will reject the unknown category as `unknown_id` and signups will start failing silently.
- **Don't refactor the signup pipeline to "DRY it up".** The flat ordered pipeline is intentional — every step has its own audit-log path with a distinct `flag_reason`. Keep the literal step ordering.
- **Don't change OG image URL params** without checking `src/app/card/[id]/page.tsx` — the metadata generation builds the URL by hand. Current params: `n` `s` `c` `st` `lk_v` `b` `h` `hc` `o` `cl` `fa` `ht` `z` `lk` `dl`. Preserve their order if you reorganize.
- **Don't bake hair-color tinting at render time.** Pre-rendered per-color PNG variants live in `public/sprites/manaseed/hair/<style>/<colorId>.png`. Both client renderer and OG sharp pipeline load the matching pre-rendered file.
- **Don't read `row.trainer_config` directly** anywhere except inside `unpackTrainer()`. Direct reads will misrender legacy v1 rows.
- **Don't add a `gender` field back to TrainerConfig.** Mana Seed is gender-neutral by design; the prior `m`/`f` split was dropped intentionally.
- **Don't split outfit into top/bottom** — Mana Seed's `1out` layer is a single piece. If you commission new outfits, brief them as full single-piece replacements that follow the `1out` slot.
