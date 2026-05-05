'use client';

import { useEffect, useRef, useState } from 'react';
import type { TrainerConfig, TrainerPersonality, TierKey } from '@/types/trainer';
import TrainerSprite from '../TrainerSprite';
import { TIER_PALETTES } from '@/lib/cards/v4-tokens';
import { deriveMemberNo } from '@/lib/cards/v4-render';
import { TIER_CODES, TIER_GRADES, TIER_DISPLAY, HERO_BG } from '@/lib/cards/v5-tokens';

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
  /** V5 — AI-generated hero art (base64 data URI or HTTPS URL).
   *  When present, renders as the hero block image; LimeZu sprite is
   *  the fallback when this is absent or the image fails to load. */
  heroArtSrc?: string;
}


export default function TrainerCardV5({
  tier, config, personality, trainerName, cardId, xHandle, heroArtSrc,
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
              Always uses a near-black bg so the strip reads regardless of
              tier (founder's pink/yellow gradient was washing out the
              text). Tier color shows through the bottom border accent. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: W - 60,
              height: 64,
              background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)',
              borderBottom: `2px solid ${palette.trainerText}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              fontSize: 14,
              letterSpacing: '4px',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ fontWeight: 700 }}>VERITY</span>
            <Bullet color="#ffffff" />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>GRADED</span>
            <Bullet color="#ffffff" />
            <span style={{ color: palette.trainerText, fontWeight: 700 }}>
              {TIER_DISPLAY[tier]} {TIER_GRADES[tier]}
            </span>
            <Bullet color="#ffffff" />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{memberNo}</span>
            <Bullet color="#ffffff" />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>2026.05</span>
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

          {/* Hero image area — solid tier color with radial spotlight,
              VERITY wordmark watermark behind avatar. Clean and minimal
              so the character dominates. Pixel-art scenes were tried but
              felt too busy. */}
          <div
            style={{
              position: 'absolute',
              top: 296,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 700,
              background: HERO_BG[tier],
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              border: `2px solid ${palette.innerBorder}`,
            }}
          >

            {/* VERITY wordmark watermark — large, faint, behind avatar.
                Per-tier opacity tuned so the watermark reads on darker
                tiers (black-label, gem, near-mint) without being too
                loud on lighter tiers (mint, founder). */}
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
                color: tier === 'founder' || tier === 'mint' ? '#000000' : '#ffffff',
                opacity: tier === 'black-label' ? 0.22
                  : tier === 'gem' ? 0.20
                  : tier === 'near-mint' ? 0.18
                  : tier === 'founder' ? 0.16
                  : 0.14, // mint
                letterSpacing: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 2,
                mixBlendMode: tier === 'founder' || tier === 'mint' ? 'multiply' : 'overlay',
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

            {/* Hero subject — AI-generated chibi art when heroArtSrc is
                set, otherwise fall back to LimeZu paper-doll sprite. */}
            {heroArtSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroArtSrc}
                alt=""
                style={{
                  position: 'relative',
                  zIndex: 4,
                  width: '92%',
                  height: '92%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{ position: 'relative', zIndex: 4, marginBottom: 30 }}>
                <TrainerSprite config={config} size={520} />
              </div>
            )}
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

