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
import { barcodePattern, deriveMemberNo, formatList } from '@/lib/cards/v4-render';

export const runtime = 'nodejs';

// V4 OG card — renders the full Verity Trainer Card V4 chassis at 1920×1080.
// Tier theming, sprite composition, and content all match the React/DOM
// renderer in TrainerCardV4.tsx (driven by shared TIER_PALETTES + helpers).
//
// V3.2 anti-forgery (cid → DB lookup) is preserved: when `cid` resolves to
// a real row, all text/sprite/tier data comes from the DB, not URL params.

// LimeZu source frames are 48x96. Composite at 16x for crispness.
const CELL_W = 48;
const CELL_H = 96;
const SCALE = 16;
const SPRITE_W = CELL_W * SCALE;
const SPRITE_H = CELL_H * SCALE;
// V4 avatar frame is 360×540 in master pixels — sprite renders at the same
// resolution so it composites crisply inside that frame.
const FULLBODY_W = 360;
const FULLBODY_H = 540;
const SHARE_DIR = 's';

const OG_W = 1920;
const OG_H = 1080;

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

// Full-body sprite for the V4 card. Layered per LimeZu paper-doll order:
// body → outfit → eyes → hair → accessory.
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

  const cleanText = (raw: string, max: number) =>
    raw.replace(/[\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

  // V3.2 — if `cid` is present, fetch authoritative card data from the DB
  // and ignore tampered text URL params. This blocks forged share images
  // (e.g. crafting a URL with offensive copy attributed to a real handle).
  // For back-compat, the GET still falls back to URL params when cid is
  // absent or the row isn't found, so old shared v3 URLs still render.
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

  let quote = cleanText(searchParams.get('kf') || '', 200);
  let ability1Name = cleanText(searchParams.get('a1n') || '', 32);
  let ability2Name = cleanText(searchParams.get('a2n') || '', 32);
  let weakness1Name = cleanText(searchParams.get('w1n') || '', 32);
  let weakness2Name = cleanText(searchParams.get('w2n') || '', 32);

  let refHandle = (searchParams.get('ref') || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);

  // Tier param `t` — accepts both URL form and DB form. Trusted only when
  // no cid is present (cid path overrides via the row's own tier field).
  const tParam = (searchParams.get('t') || '').toLowerCase().trim();
  let tierFromParam: TierKey | undefined =
    (TIER_KEYS as readonly string[]).includes(tParam) ? (tParam as TierKey) : undefined;

  // DB-backed render path — only when cid is a valid UUID. Errors fall
  // back to URL params silently so the OG never returns a hard error
  // for a valid in-app share URL when Supabase has a transient failure.
  if (cid) {
    try {
      const { data: row } = await getSupabaseAdmin()
        .from('trainer_signups')
        .select('id, x_handle, trainer_name, trainer_config')
        .eq('id', cid)
        .maybeSingle();
      if (row) {
        const { config, personality, tier } = unpackTrainer(row);
        name = sanitizeNameForDisplay(row.trainer_name);
        args = {
          body: config.body,
          hair: config.hair,
          hairColor: config.hairColor,
          outfit: config.outfit,
          eyes: config.eyes,
          accessory: config.accessory,
        };
        quote = cleanText(personality.quote ?? personality.knownFor ?? '', 200);
        ability1Name = cleanText(personality.abilities?.[0]?.name ?? '', 32);
        ability2Name = cleanText(personality.abilities?.[1]?.name ?? '', 32);
        weakness1Name = cleanText(personality.weaknesses?.[0]?.name ?? '', 32);
        weakness2Name = cleanText(personality.weaknesses?.[1]?.name ?? '', 32);
        refHandle = typeof row.x_handle === 'string'
          ? row.x_handle.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15)
          : '';
        if (tier) tierFromParam = tier;
      }
    } catch (err) {
      console.warn('[og] cid lookup failed, falling back to URL params:', err);
    }
  }

  const seed = cid || refHandle || name || 'unknown';
  const finalTier: TierKey = resolveTier(tierFromParam, seed);
  const palette = TIER_PALETTES[finalTier];

  const abilitiesText = formatList([ability1Name, ability2Name]);
  const weaknessesText = formatList([weakness1Name, weakness2Name]);

  const fullBodyDataUri = await compositeFullBody(args);

  // QR — referral entry point. Encodes <appUrl>/create?ref=<xHandle>.
  const refUrlBase = process.env.NEXT_PUBLIC_REFERRAL_URL_BASE
    || (process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg') + '/create?ref=';
  const qrTarget = refHandle ? `${refUrlBase}${refHandle}` : refUrlBase;
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
  const typeText = finalTier === 'founder' ? 'FOUNDER' : 'WAITLIST';
  const sexText = 'N/A';
  const statusText = 'GENESIS';

  const displayName = (name || 'TRAINER').toUpperCase().slice(0, 14);
  const displayHandle = refHandle.toUpperCase().slice(0, 12);
  const bottomHandle = (displayHandle || 'TRAINER').slice(0, 18);

  const barPattern = barcodePattern(seed);

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_W,
          height: OG_H,
          backgroundColor: '#000000',
          display: 'flex',
          fontFamily: 'Moderniz',
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
            background: palette.outerBg,
            borderRadius: 35,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* VERITY CARD header */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: 0,
              width: OG_W - 60,
              display: 'flex',
              justifyContent: 'center',
              fontFamily: 'Agency',
              fontSize: 64,
              letterSpacing: '12px',
              color: palette.headerText,
              fontWeight: 700,
            }}
          >
            VERITY CARD
          </div>

          {/* Inner content panel */}
          <div
            style={{
              position: 'absolute',
              top: 145,
              left: 30,
              width: OG_W - 60 - 60,
              height: OG_H - 60 - 145 - 145,
              border: `1px solid ${palette.innerBorder}`,
              borderRadius: 6,
              background: palette.innerBg,
              display: 'flex',
            }}
          />

          {/* Avatar frame */}
          <div
            style={{
              position: 'absolute',
              top: 230,
              left: 135,
              width: 360,
              height: 540,
              backgroundColor: '#f5e6c8',
              border: `2px solid ${palette.innerBorder}`,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {fullBodyDataUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fullBodyDataUri}
                alt=""
                width={320}
                height={480}
                style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ color: palette.headerText, fontSize: 200, display: 'flex' }}>V</div>
            )}
          </div>

          {/* Name */}
          <div
            style={{
              position: 'absolute',
              top: 235,
              left: 575,
              fontFamily: 'Moderniz',
              color: palette.nameText,
              fontSize: 64,
              letterSpacing: '0px',
              display: 'flex',
            }}
          >
            {displayName}
          </div>

          {/* Handle */}
          <div
            style={{
              position: 'absolute',
              top: 320,
              left: 575,
              fontFamily: 'Moderniz',
              color: palette.nameText,
              fontSize: 38,
              letterSpacing: '0px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AtGlyphSvg color={palette.nameText} size={38} />
            {displayHandle}
          </div>

          {/* Quote */}
          {quote ? (
            <div
              style={{
                position: 'absolute',
                top: 410,
                left: 770,
                width: 700,
                fontFamily: 'Agency',
                fontSize: 30,
                color: palette.quoteText,
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                lineHeight: 1.3,
              }}
            >
              &ldquo;{quote.toUpperCase()}&rdquo;
            </div>
          ) : null}

          {/* Identity table */}
          <div
            style={{
              position: 'absolute',
              top: 530,
              left: 575,
              width: 920,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #222226',
              background: '#f5e6c8',
            }}
          >
            <div style={{ display: 'flex', borderBottom: '1px solid #222226' }}>
              {['MEMBER', 'TYPE', 'SEX', 'STATUS'].map((h, i) => (
                <div
                  key={`h-${i}`}
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    display: 'flex',
                    justifyContent: 'center',
                    fontFamily: 'Moderniz',
                    fontSize: 30,
                    color: '#000000',
                    borderRight: i < 3 ? '1px solid #222226' : 'none',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex' }}>
              {[memberNo, typeText, sexText, statusText].map((v, i) => (
                <div
                  key={`v-${i}`}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    display: 'flex',
                    justifyContent: 'center',
                    fontFamily: 'Agency',
                    fontSize: 32,
                    color: '#000000',
                    borderRight: i < 3 ? '1px solid #222226' : 'none',
                    letterSpacing: '1px',
                  }}
                >
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* Abilities + weaknesses */}
          <div
            style={{
              position: 'absolute',
              top: 670,
              left: 575,
              width: 620,
              display: 'flex',
              flexDirection: 'column',
              color: '#000000',
            }}
          >
            <div
              style={{
                fontFamily: 'Moderniz',
                fontSize: 28,
                color: '#2a760a',
                marginBottom: 6,
                display: 'flex',
              }}
            >
              SPECIAL ABILITIES
            </div>
            <div
              style={{
                fontFamily: 'Agency',
                fontSize: 26,
                marginBottom: 24,
                display: 'flex',
                lineHeight: 1.3,
              }}
            >
              {abilitiesText}
            </div>
            <div
              style={{
                fontFamily: 'Moderniz',
                fontSize: 28,
                color: '#920404',
                marginBottom: 6,
                display: 'flex',
              }}
            >
              WEAKNESSES
            </div>
            <div
              style={{
                fontFamily: 'Agency',
                fontSize: 26,
                display: 'flex',
                lineHeight: 1.3,
              }}
            >
              {weaknessesText}
            </div>
          </div>

          {/* QR */}
          <div
            style={{
              position: 'absolute',
              top: 660,
              left: 1235,
              width: 220,
              height: 220,
              backgroundColor: '#ffffff',
              padding: 4,
              display: 'flex',
            }}
          >
            {qrDataUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUri} alt="" width={212} height={212} style={{ display: 'block' }} />
            ) : null}
          </div>

          {/* Decorative barcode */}
          <BarcodeSvg pattern={barPattern} />

          {/* TRAINER vertical text — DEFERRED for OG renderer.
              Satori (next/og) doesn't reliably support writing-mode,
              transform-rotate-with-flex-children, or flex-column with
              intrinsic-height text children. Tried all three; each
              variant collapsed to a single visible letter. The DOM card
              at /card/[id] renders TRAINER correctly via writing-mode.
              Re-enable here once satori updates or we move OG to a
              sharp-text pipeline. */}

          {/* Bottom URL — using Agency over Inter because the Inter github
              fetch occasionally fails in OG, and Agency renders the slash
              cleanly where the fallback font does not. */}
          <div
            style={{
              position: 'absolute',
              top: 955,
              left: 0,
              width: OG_W - 60,
              display: 'flex',
              justifyContent: 'center',
              fontFamily: 'Agency',
              fontSize: 44,
              color: palette.urlText,
              letterSpacing: '2px',
            }}
          >
            VERITY.XYZ/REF/{bottomHandle}
          </div>

          {/* Verity logo mark */}
          <div
            style={{
              position: 'absolute',
              top: 962,
              right: 115,
              width: 48,
              height: 48,
              display: 'flex',
            }}
          >
            <VerityMarkSvg color={palette.markColor} />
          </div>
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

function AtGlyphSvg({ color, size }: { color: string; size: number }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
    <path d="M3 3 H29 V29 H3 Z M7 7 V25 H25 V7 Z" fill="${color}" fill-rule="evenodd"/>
    <path d="M11 11 H21 V21 H17 V15 H15 V21 H11 Z" fill="${color}"/>
  </svg>`;
  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt=""
      width={size}
      height={size}
    />
  );
}

function VerityMarkSvg({ color }: { color: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
    <circle cx="24" cy="24" r="23" fill="none" stroke="${color}" stroke-width="2"/>
    <path d="M14 32 L24 12 L34 32 L24 26 Z" fill="${color}"/>
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

function BarcodeSvg({ pattern }: { pattern: number[] }) {
  let x = 0;
  const rects: string[] = [];
  pattern.forEach((bit, i) => {
    const w = 2 + (i % 3);
    if (bit) rects.push(`<rect x="${x}" y="0" width="${w}" height="50" fill="#000000"/>`);
    x += w;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 50" width="360" height="50" preserveAspectRatio="none">
    <rect x="0" y="0" width="360" height="50" fill="#ffffff"/>
    ${rects.join('')}
  </svg>`;
  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt=""
      width={360}
      height={50}
      style={{ position: 'absolute', top: 850, left: 135 }}
    />
  );
}

function safeId(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!/^[a-z0-9_-]+$/i.test(raw)) return fallback;
  return raw;
}
