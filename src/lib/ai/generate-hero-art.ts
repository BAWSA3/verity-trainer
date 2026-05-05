// V5 hero-art generator — turns a Claude-derived character description
// into a chibi-style PNG via OpenAI's image API. Result is sharp-resized
// to 800×800 JPEG (~80-150KB base64) so it fits comfortably in the
// trainer_signups.trainer_config JSONB without bloating row size.
//
// This module is intentionally a pure async function — no DB writes.
// Callers (e.g. /api/signup background job, /api/admin/generate-hero-art
// dev endpoint) handle persistence.
//
// Cost: gpt-image-1 medium quality at 1024×1024 ≈ $0.04/image. Wrap
// callers in a per-IP / per-user rate limit before exposing.

import sharp from 'sharp';
import type { TierKey } from '@/types/trainer';
import { TIER_DISPLAY } from '@/lib/cards/v5-tokens';

interface GenerateHeroArtArgs {
  /** 1-line character description from Claude (X bio + tweets → vibe). */
  characterDescription: string;
  /** Trainer card tier — drives the bg color tint instruction. */
  tier: TierKey;
  /** Optional override of the API key (defaults to env). */
  apiKey?: string;
}

interface HeroArtResult {
  /** base64-encoded JPEG, ready to use as `data:image/jpeg;base64,...`. */
  b64: string;
  /** Wrapped data URI form for direct insertion into trainer_config.heroArtSrc. */
  dataUri: string;
  /** Bytes of the b64 string (for cost / DB size monitoring). */
  bytes: number;
}

const TIER_BG_HINTS: Record<TierKey, string> = {
  'near-mint':   'bright red gradient background',
  'mint':        'sage green and teal gradient background',
  'gem':         'deep blue gradient background',
  'black-label': 'pure black background with subtle gold accent lighting',
  'founder':     'pastel pink-to-yellow gradient background, holographic feel',
};

/**
 * Build the prompt for OpenAI image generation. Tuned for 16-bit
 * JRPG-style chibi pixel art — chunky pixels, limited palette, thick
 * outlines. The "best of both worlds" approach: AI generates at 1024×1024
 * with pixel-art prompting, then sharp downscales to 384×384 with
 * nearest-neighbor so the result genuinely reads as pixel art (not a
 * photoreal image with a "pixelated" filter slapped on).
 *
 * Prompt scaffold is the IP of the pipeline — change it carefully and
 * regenerate samples after any tweak.
 */
export function buildHeroArtPrompt(characterDescription: string, tier: TierKey): string {
  const safeDesc = characterDescription
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
  const tierLabel = TIER_DISPLAY[tier];
  const tierBg = TIER_BG_HINTS[tier];
  return `A 16-bit JRPG-style chibi pixel art portrait of a trainer
character. CRITICAL: actual pixel art with visible chunky pixels, NOT
a photo or a smooth illustration. The character: ${safeDesc}. Square
1:1 composition, character centered upper-body framing (face + chest
visible, cut at mid-torso). ${tierBg}. Style: late-90s Pokemon /
Stardew Valley / Octopath Traveler chibi sprite aesthetic — thick
1-2px black outlines, limited 8-12 color palette, bold flat colors,
visible pixel grain, no anti-aliasing, no smooth gradients on the
character itself. Card tier context: ${tierLabel}. Do NOT include
any text, watermarks, logos, borders, QR codes, or backgrounds with
text — those are added separately. Pure character portrait only,
filling 70-80% of the frame.`.replace(/\s+/g, ' ').trim();
}

/**
 * Generate a hero-art image from a character description + tier.
 *
 * Returns base64 JPEG ready to embed in trainer_config.heroArtSrc.
 * Throws on API errors (caller decides whether to retry / fall back to LimeZu).
 */
export async function generateHeroArt(args: GenerateHeroArtArgs): Promise<HeroArtResult> {
  const apiKey = args.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('generateHeroArt: OPENAI_API_KEY not set');
  }

  const prompt = buildHeroArtPrompt(args.characterDescription, args.tier);

  // OpenAI gpt-image-1 — newest image model. Returns b64 PNG inline.
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1,
      // gpt-image-1 always returns b64 inline; no response_format needed.
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`generateHeroArt: OpenAI ${res.status} ${errText.slice(0, 200)}`);
  }

  const json = await res.json() as { data?: Array<{ b64_json?: string }> };
  const rawB64 = json.data?.[0]?.b64_json;
  if (!rawB64) {
    throw new Error('generateHeroArt: empty response from OpenAI');
  }

  // Pixel-art pipeline: resize 1024×1024 → 384×384 PNG with
  // nearest-neighbor kernel. The downscale enforces a chunky-pixel look
  // even when the AI's output has subtle anti-aliasing the prompt
  // couldn't suppress. PNG (not JPEG) keeps pixel edges crisp;
  // imageRendering:'pixelated' on the <img> handles browser-side
  // upscale at render time.
  // Output size: ~150KB-300KB base64 — fits in trainer_config JSONB.
  const sourceBuf = Buffer.from(rawB64, 'base64');
  const compressedBuf = await sharp(sourceBuf)
    .resize(384, 384, { fit: 'cover', kernel: 'nearest' })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  const compressedB64 = compressedBuf.toString('base64');
  return {
    b64: compressedB64,
    dataUri: `data:image/png;base64,${compressedB64}`,
    bytes: compressedB64.length,
  };
}
