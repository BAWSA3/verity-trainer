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
 * Build the prompt for OpenAI image generation. Tuned for chibi-style
 * character portraits with thick black outlines, bold flat colors,
 * Tantama-adjacent illustration aesthetic.
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
  return `A chibi-style trainer character portrait, hand-drawn cartoon
aesthetic with thick black outlines and bold flat colors. The character:
${safeDesc}. Square 1:1 composition, character centered, ${tierBg}.
Style reference: Angga Tantama, mid-2010s sticker pack, bright limited
palette, clean vector look, thick consistent line weight. Card tier
context: ${tierLabel}. Do NOT include any text, watermarks, logos,
borders, or QR codes — those are added separately. Pure character
portrait only.`.replace(/\s+/g, ' ').trim();
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

  // Resize 1024×1024 PNG → 800×800 JPEG @ q80 to keep base64 row size
  // manageable (~80-150KB vs ~500KB-2MB for the source PNG).
  const sourceBuf = Buffer.from(rawB64, 'base64');
  const compressedBuf = await sharp(sourceBuf)
    .resize(800, 800, { fit: 'cover' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const compressedB64 = compressedBuf.toString('base64');
  return {
    b64: compressedB64,
    dataUri: `data:image/jpeg;base64,${compressedB64}`,
    bytes: compressedB64.length,
  };
}
