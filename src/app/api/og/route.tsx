import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { sanitizeNameForDisplay } from '@/lib/moderation/sanitize';
import type { TierKey } from '@/types/trainer';
import { TIER_KEYS } from '@/types/trainer';
import { unpackTrainer } from '@/lib/trainer-data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { TIER_PALETTES, resolveTier } from '@/lib/cards/v4-tokens';
import { deriveMemberNo } from '@/lib/cards/v4-render';
import { TIER_GRADES, TIER_DISPLAY, TIER_CODES, HERO_BG } from '@/lib/cards/v5-tokens';

export const runtime = 'nodejs';

// V5 OG card — vertical 1080×1500 portrait matching the live /card/[id]
// V5 chassis. Twitter Card displays portrait images natively, no need
// to letterbox. Tier theming + sprite composition mirror the React/DOM
// renderer in TrainerCardV5.tsx via shared v5-tokens + v4-tokens.
//
// V3.2 anti-forgery (cid → DB lookup) is preserved: when `cid` resolves
// to a real row, all data comes from the DB, not URL params.

const CELL_W = 48;
const CELL_H = 96;
const SCALE = 16;
const SPRITE_W = CELL_W * SCALE;
const SPRITE_H = CELL_H * SCALE;
// V5 avatar in hero block is ~520 wide; render the sharp composite at
// a generous 540×1080 so the embed stays crisp at the OG size.
const FULLBODY_W = 540;
const FULLBODY_H = 1080;
const SHARE_DIR = 's';

const OG_W = 1080;
const OG_H = 1500;

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
    const [agency, moderniz, inter400, inter600, bebas] = await Promise.all([
      readFile(agencyPath),
      readFile(modernizPath),
      fetch('https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf').then((r) => r.ok ? r.arrayBuffer() : null).then((b) => b ? Buffer.from(b) : null).catch(() => null),
      fetch('https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.ttf').then((r) => r.ok ? r.arrayBuffer() : null).then((b) => b ? Buffer.from(b) : null).catch(() => null),
      fetch('https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf').then((r) => r.ok ? r.arrayBuffer() : null).then((b) => b ? Buffer.from(b) : null).catch(() => null),
    ]);
    const fonts: OgFont[] = [
      { name: 'Agency', data: agency, weight: 700, style: 'normal' },
      { name: 'Moderniz', data: moderniz, weight: 700, style: 'normal' },
    ];
    if (inter400) fonts.push({ name: 'Inter', data: inter400, weight: 400, style: 'normal' });
    if (inter600) fonts.push({ name: 'Inter', data: inter600, weight: 600, style: 'normal' });
    if (bebas) fonts.push({ name: 'Bebas Neue', data: bebas, weight: 400, style: 'normal' });
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

// Full-body sprite for the V5 card hero. Layered per LimeZu paper-doll order.
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // V3.2 anti-forgery: when cid is a valid UUID, fetch authoritative card
  // data from the DB and ignore tampered URL params.
  const cidRaw = (searchParams.get('cid') || '').trim();
  const cid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cidRaw)
    ? cidRaw
    : null;

  let name = sanitizeNameForDisplay(searchParams.get('n'));

  let args: CompositeArgs = {
    body:      safeId(searchParams.get('b'),  ''),
    hair:      safeId(searchParams.get('h'),  ''),
    hairColor: safeId(searchParams.get('hc'), ''),
    outfit:    safeId(searchParams.get('o'),  ''),
    eyes:      safeId(searchParams.get('e'),  'none'),
    accessory: safeId(searchParams.get('ac'), 'none'),
  };

  let refHandle = (searchParams.get('ref') || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);

  const tParam = (searchParams.get('t') || '').toLowerCase().trim();
  let tierFromParam: TierKey | undefined =
    (TIER_KEYS as readonly string[]).includes(tParam) ? (tParam as TierKey) : undefined;

  // V5 — AI hero art (DB-only; can't be passed via URL params at any
  // reasonable size). Used in place of the LimeZu sprite when present.
  let heroArtSrc: string | undefined;

  if (cid) {
    try {
      const { data: row } = await getSupabaseAdmin()
        .from('trainer_signups')
        .select('id, x_handle, trainer_name, trainer_config')
        .eq('id', cid)
        .maybeSingle();
      if (row) {
        const unpacked = unpackTrainer(row);
        const { config, tier } = unpacked;
        name = sanitizeNameForDisplay(row.trainer_name);
        args = {
          body: config.body,
          hair: config.hair,
          hairColor: config.hairColor,
          outfit: config.outfit,
          eyes: config.eyes,
          accessory: config.accessory,
        };
        refHandle = typeof row.x_handle === 'string'
          ? row.x_handle.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15)
          : '';
        if (tier) tierFromParam = tier;
        heroArtSrc = unpacked.heroArtSrc;
      }
    } catch (err) {
      console.warn('[og] cid lookup failed, falling back to URL params:', err);
    }
  }

  const seed = cid || refHandle || name || 'unknown';
  const finalTier: TierKey = resolveTier(tierFromParam, seed);
  const palette = TIER_PALETTES[finalTier];

  // Skip the (slow) sharp sprite composite when AI hero art is present.
  const fullBodyDataUri = heroArtSrc ? null : await compositeFullBody(args);

  const refUrlBase = process.env.NEXT_PUBLIC_REFERRAL_URL_BASE
    || 'https://verity.xyz/ref/';
  const qrTarget = refHandle ? `${refUrlBase}${refHandle.toUpperCase()}` : refUrlBase;
  let qrDataUri = '';
  try {
    qrDataUri = await QRCode.toDataURL(qrTarget, {
      margin: 1,
      width: 360,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.warn('[og] QR generation failed:', err);
  }

  const memberNo = deriveMemberNo(seed);
  const memberShort = memberNo.replace('#', '').padStart(3, '0').slice(-3);

  const rawName = (name || 'TRAINER').toUpperCase();
  const displayName = rawName.length > 18 ? rawName.slice(0, 17) + '…' : rawName;
  const titleFontSize = displayName.length <= 7 ? 180
    : displayName.length <= 10 ? 150
    : displayName.length <= 13 ? 125
    : displayName.length <= 16 ? 105
    : 90;
  const displayHandle = refHandle.toUpperCase().slice(0, 12);

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_W,
          height: OG_H,
          backgroundColor: '#000000',
          display: 'flex',
          fontFamily: 'Bebas Neue',
        }}
      >
        {/* Outer card surface */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            width: OG_W - 60,
            height: OG_H - 60,
            background: '#0a0a0a',
            borderRadius: 32,
            display: 'flex',
            overflow: 'hidden',
            border: `1px solid rgba(255,255,255,0.08)`,
          }}
        />

        {/* PSA-style graded slab strip — top of card */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            width: OG_W - 60,
            height: 64,
            background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)',
            borderBottom: `2px solid ${palette.trainerText}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            fontFamily: 'Moderniz',
            fontSize: 14,
            letterSpacing: '4px',
            color: '#ffffff',
          }}
        >
          <span style={{ fontWeight: 700 }}>VERITY</span>
          <Bullet color="#ffffff" />
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>GRADED</span>
          <Bullet color="#ffffff" />
          <span style={{ color: palette.trainerText, fontWeight: 700 }}>
            {TIER_DISPLAY[finalTier]} {TIER_GRADES[finalTier]}
          </span>
          <Bullet color="#ffffff" />
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{memberNo}</span>
          <Bullet color="#ffffff" />
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>2026.05</span>
        </div>

        {/* Display title — auto-scaled */}
        <div
          style={{
            position: 'absolute',
            top: 126,
            left: 90,
            width: OG_W - 60 - 60 - 60,
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Bebas Neue',
            fontSize: titleFontSize,
            letterSpacing: '2px',
            color: '#ffffff',
            fontWeight: 400,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </div>

        {/* Hero block — solid tier color radial spotlight */}
        <div
          style={{
            position: 'absolute',
            top: 326,
            left: 90,
            width: OG_W - 60 - 60 - 60,
            height: 700,
            background: HERO_BG[finalTier],
            borderRadius: 16,
            border: `2px solid ${palette.innerBorder}`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* VERITY watermark behind avatar */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Bebas Neue',
              fontSize: 280,
              lineHeight: 0.85,
              color: finalTier === 'founder' || finalTier === 'mint' ? '#000000' : '#ffffff',
              opacity: finalTier === 'black-label' ? 0.18
                : finalTier === 'gem' ? 0.16
                : finalTier === 'near-mint' ? 0.14
                : finalTier === 'founder' ? 0.13
                : 0.12,
              letterSpacing: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            VERITY
          </div>

          {/* Hero subject — AI art when present, otherwise LimeZu sprite */}
          {heroArtSrc ? (
            <img
              src={heroArtSrc}
              alt=""
              width={Math.round((OG_W - 60 - 60 - 60) * 0.92)}
              height={Math.round(700 * 0.92)}
              style={{
                objectFit: 'contain',
                position: 'relative',
              }}
            />
          ) : fullBodyDataUri ? (
            <img
              src={fullBodyDataUri}
              alt=""
              width={520}
              height={1040}
              style={{
                imageRendering: 'pixelated',
                objectFit: 'contain',
                marginBottom: 30,
                position: 'relative',
              }}
            />
          ) : (
            <div style={{ color: palette.headerText, fontSize: 200, display: 'flex' }}>V</div>
          )}
        </div>

        {/* Metadata strip — size · format · tier code */}
        <div
          style={{
            position: 'absolute',
            top: 1048,
            left: 90,
            width: OG_W - 60 - 60 - 60,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: 'Moderniz',
            fontSize: 14,
            letterSpacing: '2px',
          }}
        >
          <MetaPill>1080X1500PX</MetaPill>
          <MetaPill>PNG</MetaPill>
          <MetaPill>RGBA</MetaPill>
          <MetaPill accent={palette.trainerText}>{TIER_CODES[finalTier]}</MetaPill>
        </div>

        {/* 3-col footer: holo sticker | member# + name | yellow QR pill */}
        <div
          style={{
            position: 'absolute',
            top: 1120,
            left: 90,
            width: OG_W - 60 - 60 - 60,
            height: 230,
            display: 'flex',
            gap: 12,
          }}
        >
          {/* Holo sticker */}
          <div
            style={{
              width: 230,
              height: 230,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #ff61ab 0%, #6dffe2 25%, #ffec61 50%, #61c1ff 75%, #d161ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
              fontFamily: 'Moderniz',
              fontSize: 32,
              color: 'rgba(0,0,0,0.55)',
              letterSpacing: '2px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            VERITY{'\n'}HOLO
          </div>

          {/* Member # + name */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 16px',
            }}
          >
            <div style={{
              fontFamily: 'Bebas Neue',
              fontSize: 100,
              color: '#0a0a0a',
              lineHeight: 1,
              letterSpacing: '2px',
              display: 'flex',
            }}>
              {memberShort}
            </div>
            <div style={{
              fontFamily: 'Moderniz',
              fontSize: 18,
              color: '#0a0a0a',
              letterSpacing: '2px',
              marginTop: 8,
              display: 'flex',
            }}>
              &ldquo;{displayName}&rdquo;
            </div>
          </div>

          {/* QR pill */}
          <div
            style={{
              width: 230,
              background: '#ffde59',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 18,
            }}
          >
            <div style={{
              fontFamily: 'Moderniz',
              fontSize: 13,
              color: '#0a0a0a',
              letterSpacing: '2px',
              marginBottom: 8,
              display: 'flex',
            }}>
              SCAN TO CLAIM
            </div>
            <div style={{
              width: 160,
              height: 160,
              background: '#ffffff',
              borderRadius: 6,
              padding: 4,
              display: 'flex',
            }}>
              {qrDataUri ? (
                <img src={qrDataUri} alt="" width={152} height={152} style={{ display: 'block' }} />
              ) : null}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            position: 'absolute',
            top: 1370,
            left: 30,
            width: OG_W - 60,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'Moderniz',
            fontSize: 11,
            letterSpacing: '3px',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          UNAUTHORISED COPYING OF CARD IS PROHIBITED
        </div>

        {/* Bottom serial */}
        <div
          style={{
            position: 'absolute',
            top: 1400,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'Inter',
            fontSize: 10,
            letterSpacing: '1px',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <span>prototype#01</span>
          <span>VRT{TIER_CODES[finalTier]}{memberShort}{(cid || 'TEST').slice(0, 4).toUpperCase()}</span>
        </div>

        {/* Verity logo mark — small, bottom-right of slab strip area for brand presence */}
        <div
          style={{
            position: 'absolute',
            top: 38,
            right: 50,
            width: 48,
            height: 48,
            display: 'flex',
          }}
        >
          <VerityMarkSvg color={palette.trainerText} />
        </div>
      </div>
    ),
    {
      width: OG_W,
      height: OG_H,
      headers: CACHE_HEADERS,
      fonts: await loadOgFonts(),
    },
  );
}

function MetaPill({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        border: `1px solid ${accent ?? 'rgba(255,255,255,0.18)'}`,
        borderRadius: 4,
        color: accent ?? 'rgba(255,255,255,0.7)',
      }}
    >
      {children}
    </span>
  );
}

function Bullet({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: color,
        opacity: 0.6,
        display: 'flex',
      }}
    />
  );
}

function VerityMarkSvg({ color }: { color: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="48" height="48">
    <circle cx="25" cy="25" r="23" fill="none" stroke="${color}" stroke-width="2"/>
    <path d="M14 33 L25 12 L36 33 L25 26 Z" fill="${color}"/>
  </svg>`;
  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt=""
      width={48}
      height={48}
    />
  );
}

function safeId(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!/^[a-z0-9_-]+$/i.test(raw)) return fallback;
  return raw;
}
