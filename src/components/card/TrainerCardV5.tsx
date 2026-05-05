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

// PSA-style numeric grades — communicates rarity in a TCG-native way.
const TIER_GRADES: Record<TierKey, string> = {
  'near-mint':   '8.0',
  'mint':        '8.5',
  'gem':         '9.0',
  'black-label': '9.5',
  'founder':     '10.0',
};

// Full tier display names for the slab strip.
const TIER_DISPLAY: Record<TierKey, string> = {
  'near-mint':   'NEAR MINT',
  'mint':        'MINT',
  'gem':         'GEM',
  'black-label': 'BLACK LABEL',
  'founder':     'FOUNDER 1/1',
};

// Pixel-art scene bg per tier — uses the LimeZu scenes that ship at
// public/sprites/limezu/scenes/. Avatar composites on top.
const TIER_SCENES: Record<TierKey, string> = {
  'near-mint':   '/sprites/limezu/scenes/gym.png',
  'mint':        '/sprites/limezu/scenes/generic-home.png',
  'gem':         '/sprites/limezu/scenes/tv-studio.png',
  'black-label': '/sprites/limezu/scenes/museum.png',
  'founder':     '/sprites/limezu/scenes/japanese-home.png',
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

  // Tier-tinted overlay color — applied on top of the pixel-art scene to
  // tie the hero block into the tier color palette. Subtle so the scene
  // still shows through.
  const heroTint = useMemo(() => {
    if (tier === 'mint') return 'linear-gradient(135deg, rgba(168,191,178,0.35) 0%, rgba(45,80,67,0.55) 100%)';
    if (tier === 'founder') return 'linear-gradient(135deg, rgba(255,247,173,0.45) 0%, rgba(217,132,211,0.55) 100%)';
    if (tier === 'gem') return 'linear-gradient(180deg, rgba(70,139,213,0.45) 0%, rgba(44,107,166,0.6) 100%)';
    if (tier === 'near-mint') return 'linear-gradient(180deg, rgba(255,49,49,0.45) 0%, rgba(200,28,28,0.65) 100%)';
    return 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)'; // black-label
  }, [tier]);

  // Holo foil shimmer — animated for rare tiers (matches existing spec
  // §8.3 "rare cards feel alive" requirement). Common tiers get a static
  // diagonal sheen; black-label + founder get a slow-loop animation.
  const holoAnimating = tier === 'black-label' || tier === 'founder';

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

          {/* PSA/CGC-style graded slab strip — top label band reading
              "VERITY · GRADED · NEAR MINT 9.0 · #00076 · 2026.05".
              Visually frames the card like a serious collectible. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: W - 60,
              height: 64,
              background: `linear-gradient(180deg, ${palette.outerBg} 0%, ${palette.outerBg.startsWith('linear-gradient') ? '#1a1a1a' : '#1a1a1a'} 100%)`,
              borderBottom: `2px solid ${palette.innerBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              fontSize: 14,
              letterSpacing: '4px',
              color: palette.urlText,
              textTransform: 'uppercase',
            }}
          >
            <span style={{ fontWeight: 700 }}>VERITY</span>
            <Bullet color={palette.urlText} />
            <span>GRADED</span>
            <Bullet color={palette.urlText} />
            <span style={{ color: palette.trainerText, fontWeight: 700 }}>
              {TIER_DISPLAY[tier]} {TIER_GRADES[tier]}
            </span>
            <Bullet color={palette.urlText} />
            <span>{memberNo}</span>
            <Bullet color={palette.urlText} />
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>2026.05</span>
          </div>

          {/* Display title — auto-scaled to fit, Bebas Neue */}
          <div
            style={{
              position: 'absolute',
              top: 96,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 180,
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

          {/* Hero image area — pixel-art LimeZu scene with tier-tinted
              overlay, VERITY wordmark watermark, vignette, and avatar
              composited on top. */}
          <div
            style={{
              position: 'absolute',
              top: 296,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 700,
              background: '#000',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              border: `2px solid ${palette.innerBorder}`,
            }}
          >
            {/* Pixel-art scene layer — bottom of stack */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TIER_SCENES[tier]}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                imageRendering: 'pixelated',
                zIndex: 0,
              }}
            />

            {/* Tier-tint overlay on the scene */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: heroTint,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* VERITY wordmark watermark — large, faint, behind avatar */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -55%)',
                fontFamily: 'var(--font-bebas), Impact, sans-serif',
                fontSize: 280,
                lineHeight: 0.85,
                color: '#ffffff',
                opacity: tier === 'founder' ? 0.18 : 0.13,
                letterSpacing: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 2,
                mixBlendMode: 'overlay',
                textShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}
            >
              VERITY
            </div>

            {/* Vignette */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 30%, rgba(0,0,0,0.55) 100%)',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />

            {/* Avatar — oversized, bottom-anchored. zIndex above all bg layers. */}
            <div style={{ position: 'relative', zIndex: 4, marginBottom: 10 }}>
              <TrainerSprite config={config} size={580} />
            </div>
          </div>

          {/* Metadata strip — '1080X1500PX | PNG | RGBA | <TIER>' */}
          <div
            style={{
              position: 'absolute',
              top: 1018,
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
              top: 1090,
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
              top: 1340,
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
              top: 1370,
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

          {/* Holo foil shimmer — diagonal rainbow overlay across the whole
              card. Static for common tiers; loops for rare tiers (matches
              spec §8.3 "rare cards feel alive"). Mix-blend overlay so it
              tints content rather than obscuring it. */}
          <div
            aria-hidden
            className={holoAnimating ? 'card-v5-holo card-v5-holo--animated' : 'card-v5-holo'}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              borderRadius: 32,
              overflow: 'hidden',
              mixBlendMode: 'overlay',
              opacity: holoAnimating ? 0.28 : 0.12,
            }}
          />
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
        /* Holo foil — diagonal rainbow gradient. Wider than the card so
           the animated variant can pan it across without clipping. */
        :global(.card-v5-holo) {
          background: linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 97, 171, 0.6) 18%,
            rgba(109, 255, 226, 0.6) 32%,
            rgba(255, 236, 97, 0.6) 46%,
            rgba(97, 193, 255, 0.6) 60%,
            rgba(209, 97, 255, 0.6) 74%,
            transparent 92%
          );
          background-size: 220% 220%;
          background-position: 0% 0%;
        }
        :global(.card-v5-holo--animated) {
          animation: cardV5HoloShimmer 6s ease-in-out infinite;
        }
        @keyframes cardV5HoloShimmer {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
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

// Small dot separator used in the slab strip (PSA-style).
function Bullet({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: color,
        opacity: 0.6,
        flexShrink: 0,
      }}
    />
  );
}

