# Trainer Claim Handoff — JSON Contract

**Status:** draft, awaiting tech-lead endpoint URL.
**Last updated:** 2026-05-04

The Verity Trainer tool generates a trainer (X profile read → sprite + abilities + weaknesses + stats + zodiac + roast quote) and presents a value-first re-roll loop. When the user clicks **Claim Trainer →**, they leave our domain and finish the claim on the Verity backend, which owns:

- Member / waitlist number
- Referral link
- QR code
- Final trainer card render

The handoff happens via a single POST + redirect.

## How it's wired

`src/components/dashboard/TrainerDashboard.tsx` checks `process.env.NEXT_PUBLIC_CLAIM_ENDPOINT` at click time:

- **Set** → `handoffToVerityBackend(endpoint)` runs: POST the payload below, follow the `redirectUrl` from the response (or the endpoint itself if no redirect was specified).
- **Unset** → fall through to the in-app `SignupGate` modal + `/api/signup` → `/card/[id]` flow. This is the standalone fallback so the tool ships even if the backend isn't ready.

Reverting the handoff is a one-line change: unset the env var.

## Request

```
POST {NEXT_PUBLIC_CLAIM_ENDPOINT}
Content-Type: application/json
Credentials: include
```

### Body

```ts
{
  // X handle the trainer was generated from. The user typed this on
  // /create — not OAuth-verified on our side. The tech lead's backend
  // can verify ownership via X OAuth before issuing a member number.
  handle: string;          // lowercase, ≤15 chars, [a-z0-9_]

  // The display name the user typed in our claim modal. Empty string
  // when handoff fires before the user opens the modal (current flow:
  // we don't show a modal in handoff mode — the tech lead can collect
  // a display name on their side instead).
  trainerName: string;     // 0-12 chars, sanitized client-side

  // Sprite layer config. IDs map into the LimeZu manifest at
  // /sprites/limezu/manifest.json — the tech lead's renderer can either
  // read the same manifest (we'll publish it) or accept these as
  // opaque tokens and call our composite endpoint to get a flat PNG.
  config: {
    body:      string;     // skin tone variant id, e.g. "01".."09"
    hair:      string;     // hair style id, e.g. "01".."29"
    hairColor: string;     // hair color variant id, e.g. "01".."07"
    outfit:    string;     // single-piece outfit id, e.g. "01".."33"
    eyes:      string;     // eye style id OR "none"
    accessory: string;     // accessory id (hat/glasses/etc.) OR "none"
  };

  // AI-generated personality. All strings are pre-moderated (slur scan
  // + OpenAI omni-moderation backstop in our prompt) and clamped to
  // safe lengths.
  personality: {
    zodiac: ""             // empty = AI couldn't tell
          | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
          | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

    // 0-2 entries each. Pre-V3.2 generations may have only `abilities`;
    // the v3.2 generator always emits both.
    abilities?:  Array<{ name: string; description: string }>;  // ≤2
    weaknesses?: Array<{ name: string; description: string }>;  // ≤2

    // Sharp-edge brand-safe roast line. ≤200 chars, single sentence.
    quote?: string;

    // V2 legacy fields — kept for back-compat but always empty in
    // handoff payloads (current flow doesn't surface user-typed chips).
    likes?: string[];
    dislikes?: string[];
  };

  // 1-2 sentence "why we picked this trainer" tagline from Claude.
  // Conversational tone, no markdown. Lowercase except proper nouns.
  reasoning: string;        // ≤400 chars
}
```

### Field caps (already applied client-side)

| Field                                | Max length |
| ------------------------------------ | ---------- |
| `handle`                             | 15 chars   |
| `trainerName`                        | 12 chars   |
| `personality.abilities[i].name`      | 32 chars   |
| `personality.abilities[i].description` | 140 chars |
| `personality.weaknesses[i].name`     | 32 chars   |
| `personality.weaknesses[i].description` | 140 chars |
| `personality.quote`                  | 200 chars  |
| `reasoning`                          | 400 chars  |

## Response

```json
{
  "redirectUrl": "https://verity.gg/claim/abc123"
}
```

- **`redirectUrl`** *(optional)* — where to send the user. If absent, we redirect to the endpoint URL itself. If the response is non-JSON or non-2xx, we fall back to the in-app `SignupGate` modal so the user doesn't get stuck.

## Stats — derived, not sent

We deliberately **don't send stats** in the payload. They're a deterministic hash of `(config, personality)` — see `src/lib/card-utils.ts:generateStats`. The tech lead's backend can recompute them with the same algorithm (we'll publish a JS snippet) or skip them entirely if the final card uses a different stat scheme.

## What we don't do

The tech lead's backend owns these — our payload doesn't include them:

- Member / waitlist number
- Referral attribution / tracking
- QR code
- Card image render
- Tier rolling (`founder` / `black-label` / `gem` / `mint` / `near-mint` capacities)

Our local `/api/signup` does roll a tier into our DB, but that codepath is **not** invoked in handoff mode — it stays as standalone fallback only.

## Auth notes

- We don't verify X handle ownership (no X OAuth in our flow). The user types it; we generate; the tech lead's backend should verify before issuing a member number.
- We send `credentials: include` so any cookies the tech lead's domain has set are carried. CORS on the endpoint must allow our origin (the deployed trainer domain) and `Access-Control-Allow-Credentials: true`.
- Our Turnstile gate (`/api/generate-trainer`) protects generation. It does **not** gate the handoff POST — the tech lead's backend should run its own captcha or rate limit on claim.

## Sprite asset access

Two options for the tech lead's renderer:

1. **Direct manifest read.** We publish `https://trainer.verity.gg/sprites/limezu/manifest.json` and the per-trait PNGs at `https://trainer.verity.gg/sprites/limezu/{category}/{id}-s.png` (e.g. `/sprites/limezu/hair/19/06-s.png` for hair style 19, color 06, south-facing). Stable URLs, cacheable.

2. **Composite endpoint.** We expose `GET /api/sprite-composite?b=04&h=19&hc=06&o=02&e=04&ac=none` returning a flat PNG. Easier integration but more bandwidth + no caching benefit. Available via `compositeFullBody` in `src/app/api/og/route.tsx` — would just need a thin route wrapper if requested.

Default is option 1 unless the tech lead asks for option 2.

## Open items

- Endpoint URL itself (waiting on tech lead)
- CORS allow-list on their endpoint
- Whether they want option 1 (manifest) or option 2 (composite PNG) for sprites
- Whether the user should ever come BACK to our domain post-claim (e.g. for a "share to X" affordance) or if the journey ends on theirs
