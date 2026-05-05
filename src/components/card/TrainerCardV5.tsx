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
          {/* Film-grain noise overlay — SVG turbulence as a data URI. Sits
              above all content so the texture reads on every layer of the
              card (slab strip, hero block, footer). Subtle but adds tactile
              depth that flat CSS gradients lack. zIndex high so it covers
              everything except the holo (which uses mix-blend overlay too). */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">'
                  + '<filter id="n">'
                  + '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>'
                  + '<feColorMatrix values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 0.6 0"/>'
                  + '</filter>'
                  + '<rect width="100%" height="100%" filter="url(%23n)"/>'
                  + '</svg>'
              )}")`,
              backgroundSize: '240px 240px',
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
              opacity: 0.35,
              zIndex: 50,
              borderRadius: 32,
            }}
          />

          {/* PSA/CGC-style graded slab strip — 3-col layout with the
              grade label as the dominant visual element (bigger Bebas,
              foil treatment for rare tiers). Brand + serial flank it as
              smaller supporting meta. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: W - 60,
              height: 88,
              background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)',
              borderBottom: `2px solid ${palette.trainerText}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 32px',
            }}
          >
            {/* LEFT — VERITY · GRADED brand stack */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              fontSize: 11,
              letterSpacing: '4px',
              color: 'rgba(255,255,255,0.95)',
              minWidth: 140,
            }}>
              <span style={{ fontWeight: 700 }}>VERITY</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: '5px' }}>
                CERTIFIED · GRADED
              </span>
            </div>

            {/* CENTER — the grade label, dominant element */}
            <div
              className={holoAnimating ? 'card-v5-grade card-v5-grade--foil' : 'card-v5-grade'}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                fontFamily: 'var(--font-bebas), Impact, sans-serif',
                lineHeight: 1,
              }}
            >
              <span style={{
                fontSize: 36,
                color: palette.trainerText,
                letterSpacing: '4px',
              }}>
                {TIER_DISPLAY[tier]}
              </span>
              <span style={{
                fontSize: 44,
                color: palette.trainerText,
                fontWeight: 400,
                letterSpacing: '1px',
              }}>
                {TIER_GRADES[tier]}
              </span>
            </div>

            {/* RIGHT — serial + date stack */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              alignItems: 'flex-end',
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              fontSize: 11,
              letterSpacing: '4px',
              color: 'rgba(255,255,255,0.95)',
              minWidth: 140,
            }}>
              <span style={{ fontWeight: 700 }}>{memberNo}</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: '5px' }}>
                2026.05
              </span>
            </div>
          </div>

          {/* Display title — auto-scaled to fit, Bebas Neue */}
          <div
            style={{
              position: 'absolute',
              top: 108,
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
              VERITY wordmark watermark behind avatar. Bust-cropped sprite
              (head + chest only) centered vertically. Inner glow on the
              edges adds depth (recessed window feel). */}
          <div
            style={{
              position: 'absolute',
              top: 308,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 700,
              background: HERO_BG[tier],
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${palette.innerBorder}`,
              boxShadow: tier === 'black-label'
                ? 'inset 0 0 80px rgba(0,0,0,0.65), inset 0 0 120px rgba(255, 222, 89, 0.18)'
                : tier === 'founder'
                  ? 'inset 0 0 80px rgba(217, 132, 211, 0.5), inset 0 0 140px rgba(255, 247, 173, 0.3)'
                  : tier === 'gem'
                    ? 'inset 0 0 100px rgba(31, 84, 140, 0.6), inset 0 0 160px rgba(255, 222, 89, 0.12)'
                    : tier === 'mint'
                      ? 'inset 0 0 100px rgba(45, 80, 67, 0.55)'
                      : 'inset 0 0 100px rgba(184, 24, 24, 0.55), inset 0 0 160px rgba(255, 49, 49, 0.15)', // near-mint
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

            {/* Corner mint badge — top-right of hero. Marks the card as a
                Genesis Drop edition, gives rare cards a "limited" feel
                without claiming a fixed supply count. */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.55)',
                border: `1px solid ${palette.trainerText}`,
                borderRadius: 6,
                fontFamily: 'var(--font-moderniz), Impact, sans-serif',
                color: palette.trainerText,
                letterSpacing: '3px',
                fontSize: 10,
                lineHeight: 1.2,
                backdropFilter: 'blur(4px)',
              }}
            >
              <span style={{ opacity: 0.7, fontSize: 9 }}>GENESIS DROP</span>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '2px' }}>
                {TIER_CODES[tier]}
              </span>
            </div>

            {/* Tier accent stripe — bottom of hero, visually underlines
                the bust portrait and ties the hero to the tier palette. */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 6,
                background: `linear-gradient(90deg, transparent 0%, ${palette.trainerText} 18%, ${palette.trainerText} 82%, transparent 100%)`,
                zIndex: 5,
              }}
            />

            {/* Hero subject — AI-generated chibi art when heroArtSrc is
                set, otherwise fall back to a custom crop of the LimeZu
                sprite. The bustCrop in the manifest (y=26..66) gave
                head + 10px shoulders only; user wanted "full face +
                upper body cut clean at bottom of frame" so we render
                the full sprite oversized and clip to source y=22..70
                (above hair through mid-torso). */}
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
              <div
                style={{
                  position: 'relative',
                  zIndex: 4,
                  width: 700,
                  height: 700,
                  overflow: 'hidden',
                  borderRadius: 8,
                }}
              >
                {/* Sprite at size=700 renders 700×1400. Top offset -320
                    pushes the transparent padding above the hair OFF the
                    top of the wrapper, putting hair top at wrapper top.
                    Wrapper height 700 = 1× sprite-width = exactly source
                    y=22..70 visible (face + upper body, cut at mid-torso
                    by the hero block's bottom edge). */}
                <div style={{ position: 'absolute', top: -320, left: 0 }}>
                  <TrainerSprite config={config} size={700} />
                </div>
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

          {/* Card-edge highlight — subtle inset glow that simulates a
              beveled physical card edge. Top edge catches a faint white
              gloss; bottom catches a darker shadow. Sells "this is an
              object you could pick up." Holo treatment moved from the
              whole card surface to just the grade label in the slab strip
              — cleaner, more legit-feeling. */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              borderRadius: 32,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)`,
              zIndex: 52,
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
        /* Grade label — sits in the slab strip. .--foil adds the
           animated rainbow shimmer overlay (rare tiers only). */
        :global(.card-v5-grade) {
          position: relative;
        }
        :global(.card-v5-grade--foil) {
          background: linear-gradient(
            115deg,
            #ff61ab 0%,
            #6dffe2 18%,
            #ffec61 36%,
            #61c1ff 54%,
            #d161ff 72%,
            #ff61ab 90%
          );
          background-size: 300% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: cardV5GradeFoil 5s ease-in-out infinite;
          filter: drop-shadow(0 0 12px rgba(255,255,255,0.25));
        }
        @keyframes cardV5GradeFoil {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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

