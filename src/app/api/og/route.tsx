import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { sanitizeNameForDisplay, sanitizeChipsForDisplay } from '@/lib/moderation/sanitize';
import { ZODIAC_GLYPHS, VALID_ZODIACS } from '@/lib/personality';
import type { Zodiac } from '@/types/trainer';

export const runtime = 'nodejs';

// V1 hi-fi pixel sprites are 64x96 source. Composite at 1024 wide for crisp output.
const SPRITE_W = 1024;
const SPRITE_H = 1536;     // 64x96 ratio at 1024 width
const BUST_W = 512;        // bust crop width in OG image (left third of card)
const BUST_H = 640;        // bust crop height (40/64 ratio at 512 → 320; padded for visual breathing room)

// Bust source crop in 64x96 sprite-space — mirrors manifest.bustCrop.
const BUST_CROP = { left: 16, top: 0, width: 32, height: 40 };

// Cache the rendered OG aggressively — URL is keyed by full config so different
// trainers get different URLs.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};

async function loadSprite(relPath: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'sprites', 'limezu', relPath);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

interface CompositeArgs {
  gender: 'm' | 'f';
  body: string;
  hair: string;
  hairColor: string;
  top: string;
  bottom: string;
  shoes: string;
  outerwear: string;
  hat: string;
  glasses: string;
  expression: string;
}

async function compositeBust(args: CompositeArgs): Promise<string | null> {
  // Layer order mirrors TrainerSprite.buildLayers().
  const layerPaths = [
    `body/${args.gender}/${args.body}.png`,
    args.bottom !== 'none'    ? `bottom/${args.gender}/${args.bottom}.png` : null,
    args.shoes !== 'none'     ? `shoes/${args.shoes}.png` : null,
    args.top !== 'none'       ? `top/${args.gender}/${args.top}.png` : null,
    args.outerwear !== 'none' ? `outerwear/${args.gender}/${args.outerwear}.png` : null,
    args.expression !== 'none'? `expression/${args.expression}.png` : null,
    args.glasses !== 'none'   ? `glasses/${args.glasses}.png` : null,
    `hair/${args.hairColor}/${args.hair}.png`,
    args.hat !== 'none'       ? `hat/${args.hat}.png` : null,
  ].filter((p): p is string => p !== null);

  try {
    const buffers = await Promise.all(
      layerPaths.map(async (rel) => {
        const buf = await loadSprite(rel);
        if (!buf) return null;
        // Resize each layer to the full-body output size with nearest-neighbor.
        return sharp(buf).resize(SPRITE_W, SPRITE_H, { kernel: 'nearest', fit: 'fill' }).toBuffer();
      }),
    );
    const valid = buffers.filter((b): b is Buffer => b !== null);
    if (valid.length === 0) return null;

    // Composite full body, then crop to bust.
    const fullBody = await sharp({
      create: { width: SPRITE_W, height: SPRITE_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(valid.map((input) => ({ input, top: 0, left: 0 })))
      .png()
      .toBuffer();

    // Bust extract: scale crop region from sprite-space (64x96) to output-space.
    const scaleX = SPRITE_W / 64;
    const scaleY = SPRITE_H / 96;
    const extractRegion = {
      left: Math.round(BUST_CROP.left * scaleX),
      top: Math.round(BUST_CROP.top * scaleY),
      width: Math.round(BUST_CROP.width * scaleX),
      height: Math.round(BUST_CROP.height * scaleY),
    };

    const bust = await sharp(fullBody)
      .extract(extractRegion)
      .resize(BUST_W, BUST_H, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return `data:image/png;base64,${bust.toString('base64')}`;
  } catch (err) {
    console.error('[og] compositeBust error:', err);
    return null;
  }
}

function StatBar({ value }: { value: number }) {
  const cells = 10;
  const filled = Math.round((value / 100) * cells);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: cells }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 22,
            height: 14,
            backgroundColor: i < filled ? '#90b34d' : 'rgba(22, 39, 44, 0.15)',
          }}
        />
      ))}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <span style={{ color: '#367d95', fontSize: 16, width: 110, letterSpacing: '3px', fontWeight: 700 }}>
        {label}
      </span>
      <StatBar value={value} />
      <span style={{ color: '#16272c', fontSize: 18 }}>{value}</span>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const name = sanitizeNameForDisplay(searchParams.get('n'));

  const style    = clamp(parseInt(searchParams.get('s')   || '70'));
  const charisma = clamp(parseInt(searchParams.get('c')   || '70'));
  const street   = clamp(parseInt(searchParams.get('st')  || '70'));
  const luck     = clamp(parseInt(searchParams.get('lk_v')|| '70'));

  // Trainer config (fall back to safe defaults). Keep parsing tight — these are
  // already sanitized by /api/signup before being committed to DB, but query
  // params are URL-controlled so re-validate.
  const genderParam = searchParams.get('g');
  const gender: 'm' | 'f' = genderParam === 'f' ? 'f' : 'm';
  const args: CompositeArgs = {
    gender,
    body:       safeId(searchParams.get('b'),  ''),
    hair:       safeId(searchParams.get('h'),  ''),
    hairColor:  safeId(searchParams.get('hc'), 'black'),
    top:        safeId(searchParams.get('t'),  ''),
    bottom:     safeId(searchParams.get('bo'), ''),
    shoes:      safeId(searchParams.get('sh'), 'none'),
    outerwear:  safeId(searchParams.get('ow'), 'none'),
    hat:        safeId(searchParams.get('ht'), 'none'),
    glasses:    safeId(searchParams.get('gl'), 'none'),
    expression: safeId(searchParams.get('ex'), 'none'),
  };

  // Personality
  const zodiacRaw = searchParams.get('z') || '';
  const zodiac = VALID_ZODIACS.has(zodiacRaw) ? (zodiacRaw as Zodiac) : null;
  const likes = sanitizeChipsForDisplay(splitPipe(searchParams.get('lk'))).slice(0, 3);
  const dislikes = sanitizeChipsForDisplay(splitPipe(searchParams.get('dl'))).slice(0, 3);

  const bustDataUri = await compositeBust(args);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fffdf3',
          border: '8px solid #16272c',
          borderRadius: 12,
          fontFamily: 'sans-serif',
        }}
      >
        {/* title bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 28px',
            borderBottom: '2px solid #16272c',
            backgroundColor: '#fffdf3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#90b34d', fontSize: 22 }}>▣</span>
            <span style={{ color: '#16272c', fontSize: 16, letterSpacing: '4px', fontWeight: 700 }}>
              TRAINER CARD — VERITY
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 22, height: 22, border: '1px solid #16272c', borderRadius: 2, color: '#16272c', textAlign: 'center', fontSize: 14, lineHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>_</span>
            <span style={{ width: 22, height: 22, border: '1px solid #16272c', borderRadius: 2, color: '#16272c', textAlign: 'center', fontSize: 14, lineHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>▢</span>
            <span style={{ width: 22, height: 22, border: '1px solid #16272c', borderRadius: 2, color: '#16272c', textAlign: 'center', fontSize: 14, lineHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✕</span>
          </div>
        </div>

        {/* body */}
        <div style={{ display: 'flex', flex: 1, padding: 32, gap: 32 }}>
          {/* Bust */}
          <div
            style={{
              width: 360,
              height: 460,
              border: '3px solid #90b34d',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              backgroundColor: 'rgba(144, 179, 77, 0.08)',
              overflow: 'hidden',
            }}
          >
            {bustDataUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bustDataUri}
                alt=""
                width={360}
                height={450}
                style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ color: '#90b34d', fontSize: 90, display: 'flex', alignItems: 'center', height: '100%' }}>V</div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
            <div style={{ color: '#16272c', fontSize: 56, fontWeight: 700, display: 'flex', letterSpacing: '2px' }}>
              {name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#367d95', fontSize: 16, letterSpacing: '4px', textTransform: 'uppercase' }}>
              {zodiac ? (
                <>
                  <span style={{ fontSize: 22 }}>{ZODIAC_GLYPHS[zodiac]}</span>
                  <span>{zodiac} · streetwear class</span>
                </>
              ) : (
                <span>streetwear class</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <StatRow label="STYLE"    value={style} />
              <StatRow label="CHARISMA" value={charisma} />
              <StatRow label="STREET"   value={street} />
              <StatRow label="LUCK"     value={luck} />
            </div>

            {(likes.length > 0 || dislikes.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(22, 39, 44, 0.15)' }}>
                {likes.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ color: '#367d95', fontSize: 13, width: 90, letterSpacing: '3px', fontWeight: 700 }}>LIKES</span>
                    <span style={{ color: '#16272c', fontSize: 16 }}>{likes.join(' · ')}</span>
                  </div>
                )}
                {dislikes.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ color: '#c94d4d', fontSize: 13, width: 90, letterSpacing: '3px', fontWeight: 700 }}>DISLIKES</span>
                    <span style={{ color: '#16272c', fontSize: 16 }}>{dislikes.join(' · ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px 28px',
            borderTop: '1px solid rgba(22, 39, 44, 0.15)',
          }}
        >
          <span style={{ color: '#8a7d4d', fontSize: 13, letterSpacing: '5px', fontWeight: 700 }}>
            ─── VERITY EARLY ACCESS · MAY 2026 ───
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: CACHE_HEADERS,
    },
  );
}

// ---- helpers ----
function clamp(n: number): number {
  if (Number.isNaN(n)) return 70;
  return Math.max(0, Math.min(100, n));
}
function safeId(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  // Limit to slug-safe chars; reject anything weird.
  if (!/^[a-z0-9_-]+$/i.test(raw)) return fallback;
  return raw;
}
function splitPipe(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split('|').filter(Boolean);
}
