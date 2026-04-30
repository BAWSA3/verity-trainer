import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { sanitizeNameForDisplay, sanitizeChipsForDisplay } from '@/lib/moderation/sanitize';
import { ZODIAC_GLYPHS, VALID_ZODIACS } from '@/lib/personality';
import type { Zodiac } from '@/types/trainer';

export const runtime = 'nodejs';

// LimeZu source frames are 48 wide × 96 tall (portrait). Composite at 768 wide
// for crisp output (16x upscale of 48px); height is 1536 (16x of 96px).
// Then bust-extract a sub-rect.
const CELL_W = 48;
const CELL_H = 96;
const SCALE = 16;
const SPRITE_W = CELL_W * SCALE;     // 768
const SPRITE_H = CELL_H * SCALE;     // 1536
const BUST_W = 512;
const BUST_H = 576;

// Bust source crop in LimeZu 48x96 sprite-space — mirrors manifest.bustCrop.
const BUST_CROP = { left: 8, top: 26, width: 32, height: 40 };

// Always render in south direction for shared cards.
const SHARE_DIR = 's';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};

const SPRITE_ROOT = ['public', 'sprites', 'limezu'];

async function loadSprite(...segments: string[]): Promise<Buffer | null> {
  try {
    const filePath = path.join(process.cwd(), ...SPRITE_ROOT, ...segments);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

interface CompositeArgs {
  body: string;
  hair: string;
  hairColor: string;
  outfit: string;
  eyes: string;
  accessory: string;
}

/** Resolve `<baseId>-<variant>` (e.g. "01-02") -> [baseId, variant]. */
function splitVariant(compoundId: string): [string, string] | null {
  const idx = compoundId.lastIndexOf('-');
  if (idx <= 0) return null;
  return [compoundId.slice(0, idx), compoundId.slice(idx + 1)];
}

async function compositeBust(args: CompositeArgs): Promise<string | null> {
  // LimeZu layer order, bottom to top:
  //   body -> outfit -> eyes -> hair -> accessory
  const layerSegments: string[][] = [];

  if (args.body) layerSegments.push(['body', `${args.body}-${SHARE_DIR}.png`]);

  if (args.outfit && args.outfit !== 'none') {
    const split = splitVariant(args.outfit);
    if (split) layerSegments.push(['outfit', split[0], `${split[1]}-${SHARE_DIR}.png`]);
  }
  if (args.eyes && args.eyes !== 'none') {
    layerSegments.push(['eyes', `${args.eyes}-${SHARE_DIR}.png`]);
  }
  if (args.hair && args.hairColor) {
    layerSegments.push(['hair', args.hair, `${args.hairColor}-${SHARE_DIR}.png`]);
  }
  if (args.accessory && args.accessory !== 'none') {
    const split = splitVariant(args.accessory);
    if (split) layerSegments.push(['accessory', split[0], `${split[1]}-${SHARE_DIR}.png`]);
  }

  try {
    const buffers = await Promise.all(
      layerSegments.map(async (segs) => {
        const buf = await loadSprite(...segs);
        if (!buf) return null;
        return sharp(buf).resize(SPRITE_W, SPRITE_H, { kernel: 'nearest', fit: 'fill' }).toBuffer();
      }),
    );
    const valid = buffers.filter((b): b is Buffer => b !== null);
    if (valid.length === 0) return null;

    const fullBody = await sharp({
      create: { width: SPRITE_W, height: SPRITE_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(valid.map((input) => ({ input, top: 0, left: 0 })))
      .png()
      .toBuffer();

    // Bust extract: scale crop region from sprite-space (48x96) to output-space.
    // Horizontal scale: SPRITE_W / CELL_W = 16. Same scale on Y (no aspect change).
    const extractRegion = {
      left: Math.round(BUST_CROP.left * SCALE),
      top: Math.round(BUST_CROP.top * SCALE),
      width: Math.round(BUST_CROP.width * SCALE),
      height: Math.round(BUST_CROP.height * SCALE),
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

  const args: CompositeArgs = {
    body:      safeId(searchParams.get('b'),  ''),
    hair:      safeId(searchParams.get('h'),  ''),
    hairColor: safeId(searchParams.get('hc'), ''),
    outfit:    safeId(searchParams.get('o'),  ''),
    eyes:      safeId(searchParams.get('e'),  'none'),
    accessory: safeId(searchParams.get('ac'), 'none'),
  };

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
            <div style={{ width: 22, height: 22, backgroundColor: '#90b34d', borderRadius: 3, display: 'flex' }} />
            <span style={{ color: '#16272c', fontSize: 16, letterSpacing: '4px', fontWeight: 700 }}>
              TRAINER CARD — VERITY
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 22, height: 22, border: '1px solid #16272c', borderRadius: 2, color: '#16272c', textAlign: 'center', fontSize: 14, lineHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>_</span>
            <div style={{ width: 22, height: 22, border: '1px solid #16272c', borderRadius: 2, display: 'flex' }} />
            <span style={{ width: 22, height: 22, border: '1px solid #16272c', borderRadius: 2, color: '#16272c', textAlign: 'center', fontSize: 14, lineHeight: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>x</span>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, padding: 32, gap: 32 }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14 }}>
            <div style={{ color: '#16272c', fontSize: 56, fontWeight: 700, display: 'flex', letterSpacing: '2px' }}>
              {name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#367d95', fontSize: 16, letterSpacing: '4px', textTransform: 'uppercase' }}>
              {zodiac ? (
                <span>{zodiac} · streetwear class</span>
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
            VERITY EARLY ACCESS  ·  MAY 2026
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

function clamp(n: number): number {
  if (Number.isNaN(n)) return 70;
  return Math.max(0, Math.min(100, n));
}
function safeId(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!/^[a-z0-9_-]+$/i.test(raw)) return fallback;
  return raw;
}
function splitPipe(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split('|').filter(Boolean);
}
