import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import QRCode from 'qrcode';
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
// V3 — full body in a tall sprite cell. Render at 240x480 so it composites
// crisply at the OG card sprite frame size (~240x480px in the layout).
const FULLBODY_W = 240;
const FULLBODY_H = 480;
const SHARE_DIR = 's';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};
const SPRITE_ROOT = ['public', 'sprites', 'limezu'];
const FONT_DIR = ['src', 'fonts'];

type OgFont = { name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' };
let cachedFonts: OgFont[] | null = null;
async function loadOgFonts(): Promise<OgFont[]> {
  if (cachedFonts) return cachedFonts;
  try {
    const agencyPath = path.join(process.cwd(), ...FONT_DIR, 'Agency.ttf');
    const modernizPath = path.join(process.cwd(), ...FONT_DIR, 'Moderniz.otf');
    const [agency, moderniz, inter400, inter600] = await Promise.all([
      readFile(agencyPath),
      readFile(modernizPath),
      fetch('https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf').then((r) => r.ok ? r.arrayBuffer() : null).then((b) => b ? Buffer.from(b) : null).catch(() => null),
      fetch('https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.ttf').then((r) => r.ok ? r.arrayBuffer() : null).then((b) => b ? Buffer.from(b) : null).catch(() => null),
    ]);
    const fonts: OgFont[] = [
      { name: 'Agency', data: agency, weight: 700, style: 'normal' },
      { name: 'Moderniz', data: moderniz, weight: 700, style: 'normal' },
    ];
    if (inter400) fonts.push({ name: 'Inter', data: inter400, weight: 400, style: 'normal' });
    if (inter600) fonts.push({ name: 'Inter', data: inter600, weight: 600, style: 'normal' });
    cachedFonts = fonts;
    return cachedFonts;
  } catch (err) {
    console.warn('[og] custom font load failed:', err);
    return [];
  }
}

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

// V3 — full body sprite for the share card (no bust crop). Layers per LimeZu
// paper-doll: body → outfit → eyes → hair → accessory.
async function compositeFullBody(args: CompositeArgs): Promise<string | null> {
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
      .resize(FULLBODY_W, FULLBODY_H, { kernel: 'nearest', fit: 'fill' })
      .png()
      .toBuffer();

    return `data:image/png;base64,${fullBody.toString('base64')}`;
  } catch (err) {
    console.error('[og] compositeFullBody error:', err);
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

  // V3 stat semantics (key kept for back-compat with old shared URLs):
  //   s    → presence
  //   c    → wit
  //   st   → taste
  //   lk_v → resolve
  const presence = clamp(parseInt(searchParams.get('s')    || '70'));
  const wit      = clamp(parseInt(searchParams.get('c')    || '70'));
  const taste    = clamp(parseInt(searchParams.get('st')   || '70'));
  const resolve  = clamp(parseInt(searchParams.get('lk_v') || '70'));

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

  // V3 — knownFor + 2 abilities replace likes/dislikes.
  const cleanText = (raw: string, max: number) =>
    raw.replace(/[\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

  const knownFor = cleanText(searchParams.get('kf') || '', 200);
  const ability1Name = cleanText(searchParams.get('a1n') || '', 32);
  const ability1Desc = cleanText(searchParams.get('a1d') || '', 140);
  const ability2Name = cleanText(searchParams.get('a2n') || '', 32);
  const ability2Desc = cleanText(searchParams.get('a2d') || '', 140);
  const abilities = [
    ability1Name && ability1Desc ? { name: ability1Name, description: ability1Desc } : null,
    ability2Name && ability2Desc ? { name: ability2Name, description: ability2Desc } : null,
  ].filter((a): a is { name: string; description: string } => a !== null);

  const fullBodyDataUri = await compositeFullBody(args);

  // QR — referral entry point. Encodes <appUrl>/create?ref=<xHandle>.
  // The X handle of the card owner is the human-readable referral code,
  // passed by /card/[id]/page.tsx via the OG URL builder. X handles are
  // [a-zA-Z0-9_], 1-15 chars per X's own rules.
  const refHandle = (searchParams.get('ref') || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verity-trainer.vercel.app';
  const qrTarget = refHandle
    ? `${appUrl}/create?ref=${refHandle}`
    : `${appUrl}/create`;
  let qrDataUri = '';
  try {
    qrDataUri = await QRCode.toDataURL(qrTarget, {
      margin: 1,
      width: 280,
      color: { dark: '#16272C', light: '#00000000' },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.warn('[og] QR generation failed:', err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: 'linear-gradient(135deg, #FFFDF3 0%, #F1ECDA 100%)',
          fontFamily: 'Moderniz',
          padding: 24,
        }}
      >
        {/* Card container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            backgroundColor: '#FFFDF3',
            borderRadius: 22,
            overflow: 'hidden',
            border: '1px solid rgba(22, 39, 44, 0.14)',
            boxShadow: '0 24px 48px -16px rgba(22, 39, 44, 0.22)',
          }}
        >
          {/* Header band — deep teal */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 28px',
              backgroundColor: '#16272C',
              color: '#FFFDF3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="14" height="14" viewBox="0 0 16 16">
                <path d="M2 13 L8 3 L14 13 Z" fill="#FFFDF3" />
              </svg>
              <span style={{ fontSize: 14, letterSpacing: '6px', fontWeight: 700 }}>VERITY</span>
              <span style={{ fontSize: 14, opacity: 0.45 }}>·</span>
              <span style={{ fontSize: 12, letterSpacing: '5px', fontWeight: 500, color: 'rgba(255,253,243,0.7)' }}>TRAINER CARD</span>
            </div>
            {zodiac ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,253,243,0.06)',
                  border: '1px solid rgba(255,253,243,0.22)',
                  fontSize: 11,
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  color: 'rgba(255,253,243,0.85)',
                }}
              >
                <span style={{ fontSize: 14 }}>{ZODIAC_GLYPHS[zodiac]}</span>
                <span>{capitalize(zodiac)}</span>
              </span>
            ) : (
              <span style={{ fontSize: 11, letterSpacing: '4px', color: 'rgba(255,253,243,0.4)' }}>EARLY ACCESS</span>
            )}
          </div>

          {/* Body row: full sprite | identity */}
          <div style={{ display: 'flex', flex: 1, padding: 28, gap: 28 }}>
            {/* Sprite — full body */}
            <div
              style={{
                width: 240,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 240,
                  height: 480,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  backgroundImage: 'linear-gradient(180deg, rgba(54,125,149,0.06) 0%, rgba(144,179,77,0.10) 100%)',
                  border: '1px solid rgba(22,39,44,0.16)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  padding: '14px 0',
                }}
              >
                {fullBodyDataUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fullBodyDataUri}
                    alt=""
                    width={210}
                    height={420}
                    style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: '#90b34d', fontSize: 100, display: 'flex' }}>V</div>
                )}
              </div>
            </div>

            {/* Identity column */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 14, minWidth: 0 }}>
              <div
                style={{
                  color: '#16272C',
                  fontSize: 96,
                  fontFamily: 'Agency',
                  display: 'flex',
                  letterSpacing: '2px',
                  lineHeight: 0.95,
                }}
              >
                {name}
              </div>

              {knownFor ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ display: 'flex', fontSize: 11, letterSpacing: '5px', fontWeight: 700, color: '#367D95', fontFamily: 'Moderniz' }}>
                    KNOWN FOR
                  </span>
                  <div
                    style={{
                      color: 'rgba(22, 39, 44, 0.82)',
                      fontSize: 20,
                      display: 'flex',
                      lineHeight: 1.4,
                      maxWidth: 720,
                      fontFamily: 'Inter',
                    }}
                  >
                    {knownFor}
                  </div>
                </div>
              ) : null}

              {/* Stats — PRESENCE / WIT / TASTE / RESOLVE */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <StatCell label="PRESENCE" value={presence} />
                <StatCell label="WIT"      value={wit} />
                <StatCell label="TASTE"    value={taste} />
                <StatCell label="RESOLVE"  value={resolve} />
              </div>

              {/* Special Abilities + QR */}
              <div style={{ display: 'flex', gap: 14, marginTop: 4, alignItems: 'flex-end' }}>
                {abilities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', fontSize: 11, letterSpacing: '5px', fontWeight: 700, color: '#367D95' }}>
                      SPECIAL ABILITIES
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {abilities.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 14,
                            padding: '8px 12px',
                            backgroundColor: 'rgba(144, 179, 77, 0.08)',
                            border: '1px solid rgba(144, 179, 77, 0.30)',
                            borderRadius: 10,
                            alignItems: 'baseline',
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              fontSize: 12,
                              letterSpacing: '2px',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              color: '#3F5520',
                              width: 170,
                              flexShrink: 0,
                            }}
                          >
                            {a.name}
                          </span>
                          <span style={{ display: 'flex', fontSize: 14, lineHeight: 1.4, color: '#16272C', flex: 1, fontFamily: 'Inter' }}>
                            {a.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div style={{ flex: 1 }} />}

                {/* QR — referral entry point */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 124,
                      height: 124,
                      display: 'flex',
                      padding: 8,
                      backgroundColor: '#FFFDF3',
                      border: '1px solid rgba(22, 39, 44, 0.14)',
                      borderRadius: 10,
                    }}
                  >
                    {qrDataUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUri} alt="" width={108} height={108} style={{ display: 'block' }} />
                    ) : null}
                  </div>
                  <span style={{ display: 'flex', fontSize: 9, letterSpacing: '4px', fontWeight: 700, color: 'rgba(22,39,44,0.55)' }}>
                    SCAN · MAKE YOURS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 14,
              padding: '12px 28px',
              borderTop: '1px solid rgba(22, 39, 44, 0.10)',
              color: 'rgba(22, 39, 44, 0.55)',
              fontSize: 11,
              letterSpacing: '5px',
              fontWeight: 700,
            }}
          >
            <span>VERITY</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>EARLY ACCESS</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>MAY 2026</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: CACHE_HEADERS,
      fonts: await loadOgFonts(),
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
        gap: 6,
        padding: '10px 14px',
        backgroundColor: '#FFFDF3',
        border: '1px solid rgba(22, 39, 44, 0.10)',
        borderRadius: 10,
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: 'rgba(22,39,44,0.55)', fontSize: 11, letterSpacing: '3px', fontWeight: 700 }}>{label}</span>
        <span style={{ color: '#16272C', fontSize: 22, fontWeight: 900, fontFamily: 'Moderniz' }}>{value}</span>
      </div>
      <div style={{ display: 'flex', height: 4, borderRadius: 999, backgroundColor: 'rgba(22, 39, 44, 0.08)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            width: `${pct}%`,
            height: '100%',
            backgroundImage: 'linear-gradient(90deg, #367D95 0%, #90B34D 100%)',
            borderRadius: 999,
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
