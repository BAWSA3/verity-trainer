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
  const displayName = (trainerName || 'TRAINER').toUpperCase().slice(0, 12);
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
        {/* Outer card surface — black with rounded corners */}
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
          {/* Display title */}
          <div
            style={{
              position: 'absolute',
              top: 60,
              left: 0,
              width: W - 60,
              textAlign: 'center',
              fontFamily: 'var(--font-agency), Impact, sans-serif',
              fontSize: 110,
              letterSpacing: '4px',
              color: '#ffffff',
              fontWeight: 900,
              lineHeight: 1,
              textShadow: tier === 'founder'
                ? '0 0 40px rgba(255, 247, 173, 0.6)'
                : tier === 'gem'
                  ? '0 0 30px rgba(255, 222, 89, 0.4)'
                  : tier === 'mint'
                    ? '0 0 30px rgba(168, 191, 178, 0.3)'
                    : '0 0 30px rgba(255, 255, 255, 0.15)',
            }}
          >
            {displayName}
          </div>

          {/* Hero image area — big tinted block with avatar centered */}
          <div
            style={{
              position: 'absolute',
              top: 220,
              left: 60,
              width: W - 60 - 60 - 60,
              height: 820,
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
            {/* Avatar — oversized so it dominates the hero area */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <TrainerSprite config={config} size={680} />
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
