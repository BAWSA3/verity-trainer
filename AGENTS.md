<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Verity Trainer specifics

## Sprite system
- Hi-fi pixel sprites live under `public/sprites/limezu/`. The customizer + OG route read from `public/sprites/limezu/manifest.json`. Do not hardcode sprite IDs or file paths in components — read the manifest.
- Source pack lives at `vendor/limezu-pack/` (gitignored — LimeZu Modern Interiors Character Generator by limezu.itch.io). License: commercial use OK; **credits required** (link to limezu.itch.io); redistribution of the asset library itself is not allowed.
- Run `node scripts/import-limezu.mjs --src ./vendor/limezu-pack --dest ./public/sprites/limezu` to regenerate the sprite tree + manifest. Idempotent.
- The Mana Seed sprite tree at `public/sprites/manaseed/` is dead code as of the LimeZu migration (2026-04-29) and scheduled for deletion after May 10 launch. Do not add to it.

## LimeZu layer model
LimeZu is a paper-doll layered system. Layer order from bottom to top (per LimeZu's `CHARACTER_GENERATOR.txt`):
1. `body` — skin tone variant
2. `outfit` — single-piece clothing (top + bottom combined)
3. `eyes` — eye style + color (optional)
4. `hair` — style + color variant
5. `accessory` — hat / glasses / backpack / mustache / etc. (optional)

Sprites are **48 wide × 96 tall** (portrait orientation, 1:2 aspect). Each asset ships in 4 cardinal directions: south (`-s`, default), east (`-e`), west (`-w`), north (`-n`). The customizer + share card always use south. Manifest declares `directions: ['s','e','w','n']` and `defaultDirection: 's'`.

LimeZu does not provide a `gender` axis — the body is a single skeleton, all outfits/hairs layer onto it.

## Trainer config schema versioning
- `trainer_signups.trainer_config` is JSONB. Two schema versions coexist:
  - **v1 (pre-LimeZu, includes both early gender-split shapes and Mana Seed paper-doll v2):** Mana Seed shape with `cloak`, `face`, `hat` slots.
  - **v2 (current, LimeZu):** `{ schemaVersion: 2, config: { body, hair, hairColor, outfit, eyes, accessory }, personality: { zodiac, likes, dislikes }, source?: 'ai'|'manual' }`.
- Reads MUST go through `unpackTrainer()` in `src/lib/trainer-data.ts`. It returns the LimeZu shape and defaults missing optional layers to `'none'`. Mana Seed-era rows render with blank silhouettes (their old cloak/face/hat fields don't map onto LimeZu) — those users need to revisit `/create`.
- Writes always emit v2. Use `packTrainer()` from the same file. Pass `source: 'ai'` for AI-generated trainers.

## AI profile-driven generation (Stage 2)
- The `/create` page is a state machine: `sign-in` → `generating` → `reviewing` → `submitting`.
- X auth via Supabase OAuth (provider=Twitter). Session yields handle in `user.user_metadata.user_name`.
- X profile + recent tweets fetched via [`socialdata.tools`](https://socialdata.tools) (`SOCIALDATA_API_KEY` env). Pay-per-use API, ~$0.0004 per generation.
- Trainer derived from profile + tweets + avatar by Anthropic Claude Sonnet via `@anthropic-ai/sdk` with vision. System prompt cached. Model picks valid IDs from the live manifest. Output validated and falls back to deterministic-random pick on hallucination.
- Re-roll calls `/api/generate-trainer?regenerate=true` — same path, different temperature seed. Per-user rate limit 10/hr.
- Demo mode: when `SOCIALDATA_API_KEY` or `ANTHROPIC_API_KEY` is unset, the API returns deterministic mock-derived trainers (handle hash → config picks). Useful for prototype demos without keys.

## Moderation pipeline
- The `/api/signup` POST handler is a fixed pipeline: rate-limit → field validation → email format → disposable-email block → name moderation → handle validation → config validation → personality validation → DB upsert. Personality validation slots between config validation and DB upsert.
- All user-typed strings (trainer name, X handle, likes, dislikes) get the same tri-layer check pattern: static slurs+profanity+brand blocklist, then OpenAI omni-moderation. See `src/lib/moderation/check-name.ts` (template) and `src/lib/moderation/check-personality.ts`.
- AI-generated personality runs through the same `checkPersonality` pipeline. On flag, the API re-prompts the model once with stricter constraints, then falls back to neutral defaults — never surfaces the raw flag to the user.
- Read-time, public-facing pages (`/card/[id]`, `/api/og`) re-sanitize via `sanitize.ts` as a backstop — runs only static layers (no OpenAI per pageview).
- Audit-log every flagged attempt with a specific `flag_reason` for blocklist tuning.

## Dashboard layout (Iteration 2)
The `/create` page's reviewing phase renders `<TrainerDashboard>` (`src/components/dashboard/TrainerDashboard.tsx`), a multi-window pixel-OS layout. Source-of-truth state (config, personality, trainerName, activeTab, showSignup) lives in TrainerDashboard; child windows are dumb and receive prop slices.

Windows live under `src/components/dashboard/`:
- `PixelWindow.tsx` — shared chrome with `accent` ('olive' | 'teal' | 'dark'), `bg` ('cream' | 'cream-warm'), and `controls` (▢ ▣ ✕ glyphs). Use this for any new dashboard surface.
- `DashboardWindows.tsx` — bundled FullBody, Headshot, Identity, Likes, Dislikes leaf windows.
- `CustomizerWindow.tsx` — wraps existing CategoryTabs + CategorySelector + PersonalityPanel.
- `SceneWindow.tsx` — renders a chosen interior scene with the trainer composited on top. Reads `public/sprites/limezu/scenes/manifest.json`.
- `MusicPlayerWindow.tsx` — animated eye-loop + transport controls. Connects to `useAudioPlayer`.

Layout uses CSS Grid with named areas — see the `.dashboard-grid` styled block in `TrainerDashboard.tsx`. Single-column stack at <1024px viewport.

## Scene system
- `scripts/import-limezu-scenes.mjs --src "<path-to-6_Home_Designs>" --dest ./public/sprites/limezu/scenes` — imports curated Modern Interiors home design previews. Idempotent, cap-resizes to 800px wide.
- Output: `public/sprites/limezu/scenes/<id>.png` + `manifest.json`.
- Trainer is composited on top of the scene at `trainerX/Y` percentage anchors (feet-anchored). Adjust per-scene in the importer's PICKS array.
- LimeZu license: derivatives within license, credit limezu.itch.io required, no asset redistribution. The output PNGs are committed because they're derivatives we ship in our product.

## Audio system (Iteration 2)
- Background music infrastructure is HTMLAudioElement-based, separate from the Web Audio API SFX in `src/lib/sounds.ts`.
- `src/hooks/useAudioPlayer.ts` exposes `{ tracks, currentTrack, isPlaying, position, duration, volume, play/pause/toggle/next/prev/seek/setVolume }`. Reads `public/audio/manifest.json` at mount.
- `public/audio/manifest.json` shape: `{ tracks: [{ id, title, src }] }`. Add tracks by dropping .mp3/.ogg into `public/audio/` and adding a manifest entry. The MusicPlayerWindow auto-discovers them.
- Initial tracks ship from OpenGameArt.org (CC0): Lasso Lady (congusbongus), Tunnel Music (Écrivain), ChipScape (Chasersgaming).
- localStorage key `verity:audio:v1` persists `{ enabled, volume, currentTrackId, position }` across sessions.
- First play requires user gesture (autoplay policy compliance). The MusicPlayerWindow's ⏯ button is that gesture.

## Supabase migrations
- The signup pipeline expects three tables: `trainer_signups`, `signup_attempts`, `signup_audit_log`. Schema in `supabase-migration.sql` + `supabase-migration-moderation.sql`.
- `node scripts/apply-supabase-migrations.mjs` runs both files via the `pg` client using `DATABASE_URL` from `.env.local`. If the password is stale (BrandOS rotates it occasionally), the script writes `tmp-migrations.sql` for manual paste into the Supabase SQL editor at https://supabase.com/dashboard/project/gdxvijmezkwlqdnxfxpe/sql.

## Things you'll be tempted to do but shouldn't
- **Don't add new sprite categories without updating `manifest.json` AND `check-config.ts`'s `ALL_KEYS` const.** Server-side validation will reject the unknown category as `unknown_id` and signups will start failing silently.
- **Don't refactor the signup pipeline to "DRY it up".** The flat ordered pipeline is intentional — every step has its own audit-log path with a distinct `flag_reason`. Keep the literal step ordering.
- **Don't change OG image URL params** without checking `src/app/card/[id]/page.tsx` — the metadata generation builds the URL by hand. Current params: `n` `s` `c` `st` `lk_v` `b` `h` `hc` `o` `e` `ac` `z` `lk` `dl`. Preserve their order if you reorganize.
- **Don't bake hair-color tinting at render time.** Pre-rendered per-color PNG variants live in `public/sprites/limezu/hair/<style>/<colorId>-<dir>.png`. Both client renderer and OG sharp pipeline load the matching pre-rendered file.
- **Don't read `row.trainer_config` directly** anywhere except inside `unpackTrainer()`. Direct reads will misrender legacy v1 rows.
- **Don't add a `gender` field back to TrainerConfig.** LimeZu is gender-neutral by design.
- **Don't split outfit into top/bottom** — LimeZu's outfit layer is a single piece. If you commission new outfits, brief them as full single-piece replacements.
- **Don't pass directions other than `'s'` to the OG route or share card.** Multi-direction views are a V2 feature; shared content is always south-facing.
