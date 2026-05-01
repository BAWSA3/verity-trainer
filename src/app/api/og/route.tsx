import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { sanitizeNameForDisplay, sanitizeChipsForDisplay } from '@/lib/moderation/sanitize';
import { ZODIAC_GLYPHS, VALID_ZODIACS } from '@/lib/personality';
import type { Zodiac } from '@/types/trainer';

export const runtime = 'nodejs';

// LimeZu source frames are 48x96. Composite at 16x for crispness.
const CELL_W = 48;
const CELL_H = 96;
const SCALE = 16;
const SPRITE_W = CELL_W * SCALE;
const SPRITE_H = CELL_H * SCALE;
const BUST_W = 384;
const BUST_H = 432;
const BUST_CROP = { left: 8, top: 26, width: 32, height: 40 };
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

function splitVariant(compoundId: string): [string, string] | null {
  const idx = compoundId.lastIndexOf('-');
  if (idx <= 0) return null;
  return [compoundId.slice(0, idx), compoundId.slice(idx + 1)];
}

async function compositeBust(args: CompositeArgs): Promise<string | null> {
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

function applyMask(items: string[], mask: string | null): string[] {
  if (!mask) return items;
  if (mask.length !== items.length) return items; // length mismatch = ignore mask
  return items.filter((_, i) => mask[i] === '1');
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
  const allLikes = splitPipe(searchParams.get('lk'));
  const allDislikes = splitPipe(searchParams.get('dl'));
  const slk = sanitizeMask(searchParams.get('slk'));
  const sdl = sanitizeMask(searchParams.get('sdl'));
  const likes = sanitizeChipsForDisplay(applyMask(allLikes, slk)).slice(0, 5);
  const dislikes = sanitizeChipsForDisplay(applyMask(allDislikes, sdl)).slice(0, 5);
  // r — AI-generated one-liner. Append-only param. Strip control chars,
  // truncate to 140 chars so the OG layout stays balanced.
  const reasoningRaw = searchParams.get('r') || '';
  const reasoning = reasoningRaw
    .replace(/[\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);

  const bustDataUri = await compositeBust(args);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          // Verity gradient backdrop
          backgroundImage:
            'linear-gradient(135deg, #FFE6E6 0%, #F4D2FF 45%, #C2DDFF 100%)',
          fontFamily: 'sans-serif',
          padding: 30,
        }}
      >
        {/* Card container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            backgroundColor: 'rgba(255, 253, 243, 0.94)',
            borderRadius: 28,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 12px 40px -16px rgba(67, 56, 202, 0.25)',
          }}
        >
          {/* Header band */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 26px',
              backgroundImage: 'linear-gradient(90deg, #FF6B5C 0%, #E85544 100%)',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 18, letterSpacing: '5px', fontWeight: 700 }}>VERITY</span>
              <span style={{ fontSize: 18, opacity: 0.6 }}>·</span>
              <span style={{ fontSize: 14, letterSpacing: '5px', fontWeight: 700 }}>TRAINER CARD</span>
            </div>
            {/* AVAX corner-mark slot */}
            <svg width="22" height="22" viewBox="0 0 16 16">
              <path d="M2 13 L8 3 L14 13 Z" fill="rgba(255,255,255,0.55)" />
            </svg>
          </div>

          {/* Body row: bust | identity */}
          <div style={{ display: 'flex', flex: 1, padding: 28, gap: 28 }}>
            {/* Bust */}
            <div
              style={{
                width: 280,
                height: 360,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 253, 243, 0.9)',
                border: '2px solid rgba(144, 179, 77, 0.4)',
                borderRadius: 18,
                overflow: 'hidden',
                padding: 12,
              }}
            >
              {bustDataUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bustDataUri}
                  alt=""
                  width={256}
                  height={336}
                  style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: '#90b34d', fontSize: 100, display: 'flex', alignItems: 'center', height: '100%' }}>V</div>
              )}
            </div>

            {/* Identity column */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
              <div
                style={{
                  color: '#16272C',
                  fontSize: 64,
                  fontWeight: 700,
                  display: 'flex',
                  letterSpacing: '1px',
                  lineHeight: 1.05,
                }}
              >
                {name}
              </div>

              {reasoning ? (
                <div
                  style={{
                    color: '#5C6770',
                    fontSize: 18,
                    display: 'flex',
                    fontStyle: 'italic',
                    lineHeight: 1.35,
                    maxWidth: 540,
                  }}
                >
                  {reasoning}
                </div>
              ) : (
                <div
                  style={{
                    color: '#8A95A0',
                    fontSize: 16,
                    display: 'flex',
                    fontFamily: 'monospace',
                  }}
                >
                  0x····wallet linking soon
                </div>
              )}

              {/* Tags row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {zodiac ? (
                  <span style={tagStyle('rgba(255,253,243,0.85)', 'rgba(22,39,44,0.12)', '#16272C')}>
                    {ZODIAC_GLYPHS[zodiac]}  {capitalize(zodiac)}
                  </span>
                ) : null}
                <span style={tagStyle('rgba(255, 107, 92, 0.14)', 'rgba(255, 107, 92, 0.5)', '#A53A2E')}>
                  Truth Seeker
                </span>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                <StatCell label="STYLE"  value={style} />
                <StatCell label="CHARM"  value={charisma} />
                <StatCell label="STREET" value={street} />
                <StatCell label="LUCK"   value={luck} />
              </div>

              {/* Likes row */}
              {likes.length > 0 && (
                <div style={chipRowStyle('rgba(144, 179, 77, 0.14)', 'rgba(144, 179, 77, 0.3)')}>
                  <span style={{ ...chipRowLabelStyle, color: '#3F5520' }}>✓ LIKES</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {likes.map((s, i) => (
                      <span key={i} style={chipStyle('rgba(144, 179, 77, 0.18)', 'rgba(144, 179, 77, 0.5)', '#3F5520')}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dislikes row */}
              {dislikes.length > 0 && (
                <div style={chipRowStyle('rgba(22, 39, 44, 0.06)', 'rgba(22, 39, 44, 0.2)')}>
                  <span style={{ ...chipRowLabelStyle, color: '#16272C' }}>✕ DISLIKES</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {dislikes.map((s, i) => (
                      <span key={i} style={chipStyle('rgba(22, 39, 44, 0.08)', 'rgba(22, 39, 44, 0.35)', '#16272C')}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 28px',
              borderTop: '1px solid rgba(22, 39, 44, 0.08)',
              color: '#8A95A0',
              fontSize: 13,
              letterSpacing: '4px',
              fontWeight: 700,
            }}
          >
            <span>VERITY · EARLY ACCESS</span>
            <span>MAY 2026</span>
            <span>POWERED BY AVAX</span>
          </div>
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

function StatCell({ label, value }: { label: string; value: number }) {
  const pct = clamp(value);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        padding: '8px 12px',
        backgroundColor: 'rgba(255, 253, 243, 0.7)',
        border: '1px solid rgba(22, 39, 44, 0.08)',
        borderRadius: 10,
        width: 130,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#8A95A0', fontSize: 11, letterSpacing: '3px', fontWeight: 700 }}>{label}</span>
        <span style={{ color: '#16272C', fontSize: 16, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, backgroundColor: 'rgba(22, 39, 44, 0.08)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            width: `${pct}%`,
            height: '100%',
            backgroundImage: 'linear-gradient(90deg, #FF6B5C 0%, #FFCB9A 100%)',
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}

const chipRowLabelStyle: Record<string, string | number> = {
  display: 'flex',
  fontSize: 12,
  letterSpacing: '3px',
  fontWeight: 700,
  width: 84,
  flexShrink: 0,
};

function chipRowStyle(bg: string, border: string): Record<string, string | number> {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    backgroundColor: bg,
    border: '1px solid ' + border,
    borderRadius: 12,
    marginTop: 4,
  };
}

function tagStyle(bg: string, border: string, color: string): Record<string, string | number> {
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: bg,
    border: '1px solid ' + border,
    color,
    borderRadius: 999,
  };
}

function chipStyle(bg: string, border: string, color: string): Record<string, string | number> {
  return {
    display: 'flex',
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: bg,
    border: '1px solid ' + border,
    color,
    borderRadius: 999,
  };
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
function sanitizeMask(raw: string | null): string | null {
  if (!raw) return null;
  if (!/^[01]+$/.test(raw)) return null;
  if (raw.length > 10) return null;
  return raw;
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
