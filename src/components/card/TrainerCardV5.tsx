'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TrainerConfig, TrainerPersonality, TierKey } from '@/types/trainer';
import TrainerSprite from '../TrainerSprite';
import { TIER_PALETTES } from '@/lib/cards/v4-tokens';
import { deriveMemberNo } from '@/lib/cards/v4-render';

// V5 — Cardi/Amoxx-inspired prototype. Vertical 3:4 portrait.
// Concept: dominant hero image, minimal data, premium dark aesthetic.
// Card stack:
//   - Display title (TRAINER NAME)
//   - Big hero image area (avatar at large scale on tier-tinted bg)
//   - Metadata strip (size · format · tier code)
//   - 3-col footer: holo sticker | member# + name | yellow QR pill

const W = 1080;
const H = 1500;

interface Props {
  tier: TierKey;
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  cardId: string;
  xHandle?: string;
}

const TIER_CODES: Record<TierKey, string> = {
  'near-mint':   'NM01',
  'mint':        'MT02',
  'gem':         'GM03',
  'black-label': 'BL04',
  'founder':     'F1/1',
};

export default function TrainerCardV5({
  tier, config, personality, trainerName, cardId, xHandle,
}: Props) {
  const palette = TIER_PALETTES[tier];
  const handle = (xHandle ?? '').replace(/[^a-zA-Z0-9_]/g, '');
  // Cap at 18 chars now that title auto-scales (was 12). Names longer than
  // 18 chars are truncated with ellipsis as a hard backstop.
  const rawName = (trainerName || 'TRAINER').toUpperCase();
  const displayName = rawName.length > 18 ? rawName.slice(0, 17) + '…' : rawName;
  // Auto-scale title font so long names fit on one line. Numbers tuned for
  // Bebas Neue's character widths inside the available 960px title bbox.
  const titleFontSize = displayName.length <= 7
    ? 180
    : displayName.length <= 10
      ? 150
      : displayName.length <= 13
        ? 125
        : displayName.length <= 16
          ? 105
          : 90;
  const memberNo = deriveMemberNo(cardId);
  const memberShort = memberNo.replace('#', '').padStart(3, '0').slice(-3);
  const tierCode = TIER_CODES[tier];

  const refUrlBase = process.env.NEXT_PUBLIC_REFERRAL_URL_BASE
    || 'https://verity.xyz/ref/';
  const qrTarget = handle ? `${refUrlBase}${handle.toUpperCase()}` : refUrlBase;

  const [qrDataUri, setQrDataUri] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(qrTarget, {
        margin: 1,
        width: 360,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }).then((dataUri: string) => {
        if (!cancelled) setQrDataUri(dataUri);
      });
    });
    return () => { cancelled = true; };
  }, [qrTarget]);

  // Personality used elsewhere; keep but don't render in V5.
  void personality;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScale(w / W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pick a hero-area background — lighter tint of the tier color so the
  // avatar pops. For solid-color tiers we shade; for gradient tiers we
  // reuse the gradient.
  const heroBg = useMemo(() => {
    if (tier === 'mint') return 'linear-gradient(135deg, #b9d3c5 0%, #5b8a7a 100%)';
    if (tier === 'founder') return 'linear-gradient(135deg, #fff7ad 0%, #d984d3 100%)';
    if (tier === 'gem') return 'linear-gradient(180deg, #6ba6e0 0%, #468bd5 70%, #2c6ba6 100%)';
    if (tier === 'near-mint') return 'linear-gradient(180deg, #ff5454 0%, #ff3131 60%, #c81c1c 100%)';
    return 'linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%)'; // black-label
  }, [tier]);

  return (
    <div id="trainer-card" className="card-v5-wrapper" ref={wrapperRef}>
      <div className="card-v5-canvas" style={{ transform: `scale(${scale})` }}>
        {/* Outer card surface — black with rounded corners + paper texture */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            width: W - 60,
            height: H - 60,
            background: '#0a0a0a',
            borderRadius: 32,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Subtle paper-noise texture overlay (CSS-only) */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)`,
              backgroundSize: '6px 6px, 11px 11px',
              backgroundPosition: '0 0, 3px 5px',
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
              opacity: 0.6,
            }}
          />

          {/* Display title — auto-scaled to fit, Bebas Neue */}
          <div
            style={{
              position: 'absolute',
              top: 70,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 200,
              textAlign: 'center',
              fontFamily: 'var(--font-bebas), Impact, sans-serif',
              fontSize: titleFontSize,
              letterSpacing: '2px',
              color: '#ffffff',
              fontWeight: 400, // Bebas only ships 400
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              textShadow: tier === 'founder'
                ? '0 0 50px rgba(255, 247, 173, 0.7), 0 0 24px rgba(217, 132, 211, 0.5)'
                : tier === 'gem'
                  ? '0 0 36px rgba(255, 222, 89, 0.5)'
                  : tier === 'mint'
                    ? '0 0 32px rgba(168, 191, 178, 0.4)'
                    : tier === 'near-mint'
                      ? '0 0 36px rgba(255, 49, 49, 0.45)'
                      : '0 0 30px rgba(255, 222, 89, 0.35)',
            }}
          >
            {displayName}
          </div>

          {/* Hero image area — big tinted block with avatar centered */}
          <div
            style={{
              position: 'absolute',
              top: 280,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 760,
              background: heroBg,
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* Subtle vignette for depth */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 40%, rgba(0,0,0,0.4) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Tantama-style doodle accents — hand-drawn lines, sparkles,
                swooshes around the avatar. Color varies per tier so they
                pop against the hero bg. */}
            <DoodleAccents tier={tier} />

            {/* Avatar — oversized so it dominates the hero area */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <TrainerSprite config={config} size={620} />
            </div>
          </div>

          {/* Metadata strip — '1080X1500PX | PNG | RGBA | <TIER>' */}
          <div
            style={{
              position: 'absolute',
              top: 1070,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              fontSize: 14,
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            <MetaPill>1080X1500PX</MetaPill>
            <MetaPill>PNG</MetaPill>
            <MetaPill>RGBA</MetaPill>
            <MetaPill accent={palette.trainerText}>{tierCode}</MetaPill>
          </div>

          {/* 3-col footer: holo sticker | id + name | yellow QR pill */}
          <div
            style={{
              position: 'absolute',
              top: 1140,
              left: 60,
              width: W - 60 - 60 - 60,
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
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Faint diagonal sheen */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 70%)',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }} />
              <div style={{
                fontFamily: 'var(--font-moderniz), Impact, sans-serif',
                fontSize: 32,
                color: 'rgba(0,0,0,0.55)',
                letterSpacing: '2px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}>
                VERITY<br/>HOLO
              </div>
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
                gap: 8,
                padding: '0 16px',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-agency), Impact, sans-serif',
                fontSize: 100,
                fontWeight: 900,
                color: '#0a0a0a',
                lineHeight: 1,
                letterSpacing: '2px',
              }}>
                {memberShort}
              </div>
              <div style={{
                fontFamily: 'var(--font-moderniz), Impact, sans-serif',
                fontSize: 18,
                color: '#0a0a0a',
                letterSpacing: '2px',
              }}>
                &ldquo;{displayName}&rdquo;
              </div>
            </div>

            {/* QR pill — yellow accent */}
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
                position: 'relative',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-moderniz), Impact, sans-serif',
                fontSize: 13,
                color: '#0a0a0a',
                letterSpacing: '2px',
                marginBottom: 8,
              }}>
                SCAN TO CLAIM
              </div>
              <div style={{
                width: 160,
                height: 160,
                background: '#ffffff',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                boxSizing: 'border-box',
              }}>
                {qrDataUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUri}
                    alt=""
                    style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Bottom serial — "AUTHORISED COPYING OF CARD IS PROHIBITED" */}
          <div
            style={{
              position: 'absolute',
              top: 1395,
              left: 0,
              width: W - 60,
              textAlign: 'center',
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              fontSize: 11,
              letterSpacing: '3px',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            UNAUTHORISED COPYING OF CARD IS PROHIBITED
          </div>

          {/* Bottom footer row — prototype label + serial */}
          <div
            style={{
              position: 'absolute',
              top: 1418,
              left: 30,
              right: 30,
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-body), Inter, sans-serif',
              fontSize: 10,
              letterSpacing: '1px',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <span>prototype#01</span>
            <span>VRT{tierCode}{memberShort}{cardId.slice(0, 4).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-v5-wrapper {
          width: 100%;
          aspect-ratio: ${W} / ${H};
          position: relative;
          overflow: hidden;
        }
        .card-v5-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: ${W}px;
          height: ${H}px;
          background-color: #000000;
          transform-origin: top left;
        }
      `}</style>
    </div>
  );
}

function MetaPill({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        border: `1px solid ${accent ?? 'rgba(255,255,255,0.18)'}`,
        borderRadius: 4,
        color: accent ?? 'rgba(255,255,255,0.7)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

// Tantama-style hand-drawn accents — sparkles, swooshes, lines, dots —
// scattered around the avatar to give the card energy. Single SVG covering
// the hero block; positioned absolutely. Color picks per tier so the
// doodles read against the hero bg.
function DoodleAccents({ tier }: { tier: TierKey }) {
  const stroke = tier === 'black-label' ? '#ffde59'
    : tier === 'founder' ? '#000000'
    : tier === 'mint' ? '#fffdf3'
    : tier === 'gem' ? '#ffde59'
    : '#fffdf3'; // near-mint
  const strokeAlpha = 0.85;

  return (
    <svg
      aria-hidden
      viewBox="0 0 960 760"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: strokeAlpha,
      }}
    >
      <g stroke={stroke} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Top-left sparkle */}
        <path d="M 110 130 L 110 170 M 90 150 L 130 150" />
        <circle cx="110" cy="150" r="3" fill={stroke} stroke="none" />
        {/* Top-right squiggle */}
        <path d="M 800 90 q 20 -15 40 0 t 40 0" strokeWidth="5" />
        {/* Top-right star burst */}
        <path d="M 870 200 L 870 230 M 855 215 L 885 215 M 860 205 L 880 225 M 880 205 L 860 225" strokeWidth="4" />
        {/* Right-mid swoosh */}
        <path d="M 880 380 q -30 -25 -60 0" strokeWidth="5" />
        <path d="M 870 410 q -20 -18 -40 0" strokeWidth="5" />
        {/* Bottom-right dots */}
        <circle cx="850" cy="600" r="6" fill={stroke} stroke="none" />
        <circle cx="880" cy="630" r="4" fill={stroke} stroke="none" />
        <circle cx="820" cy="640" r="4" fill={stroke} stroke="none" />
        {/* Bottom-left zigzag motion lines */}
        <path d="M 60 580 l 24 -10 l -16 -10 l 28 -8" strokeWidth="5" />
        <path d="M 90 620 l 30 -10 l -20 -12 l 35 -8" strokeWidth="5" />
        {/* Mid-left small sparkle */}
        <path d="M 70 340 L 70 370 M 55 355 L 85 355" strokeWidth="4" />
        {/* Bottom-mid arc — under the character */}
        <path d="M 340 720 q 140 30 280 0" strokeWidth="5" opacity="0.55" />
        {/* Top-mid above character */}
        <path d="M 420 60 q 60 -18 120 0" strokeWidth="4" opacity="0.6" />
        {/* Asterisk top-far-right */}
        <g transform="translate(720,60)" strokeWidth="4">
          <path d="M -10 0 L 10 0 M 0 -10 L 0 10 M -7 -7 L 7 7 M -7 7 L 7 -7" />
        </g>
        {/* Asterisk bottom-left */}
        <g transform="translate(170,470)" strokeWidth="4">
          <path d="M -8 0 L 8 0 M 0 -8 L 0 8 M -6 -6 L 6 6 M -6 6 L 6 -6" />
        </g>
      </g>
    </svg>
  );
}
