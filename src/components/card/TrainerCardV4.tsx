'use client';

import { useEffect, useRef, useState } from 'react';
import type { TrainerConfig, TrainerPersonality, TierKey } from '@/types/trainer';
import TrainerSprite from '../TrainerSprite';
import { TIER_PALETTES } from '@/lib/cards/v4-tokens';
import { deriveMemberNo, formatList } from '@/lib/cards/v4-render';

// Verity Trainer Card — V4 chassis. 1920×1080 master canvas with two columns:
// LEFT — avatar frame on top, decorative barcode below. RIGHT — name + handle
// + quote, then a single large white "inner panel" containing the identity
// table (top half) and SPECIAL ABILITIES + WEAKNESSES + QR (bottom half).
// TRAINER vertical text runs along the card's right edge. Bottom URL +
// Verity mark sit on the card background below the inner panel.
//
// Tier theming (red / mint / gem / black-label / founder) is driven entirely
// by `TIER_PALETTES`; the layout is identical across all 5 tiers.
//
// `id="trainer-card"` preserved so ShareButtons html2canvas keeps working.

const W = 1920;
const H = 1080;

// All inner positions are relative to the OUTER CARD origin (which itself
// sits at (CARD_X, CARD_Y) inside the canvas). Keeps the math readable.
const CARD_X = 30;
const CARD_Y = 30;
const CARD_W = W - 2 * CARD_X;
const CARD_H = H - 2 * CARD_Y;

// Horizontal split: left column = avatar + barcode; right column = identity.
const LEFT_X = 110;
const LEFT_W = 380;

// Right column starts where the inner panel does, so the name/quote line up.
const RIGHT_X = 600;
const RIGHT_RIGHT = 1490;
const RIGHT_W = RIGHT_RIGHT - RIGHT_X;

interface Props {
  tier: TierKey;
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  cardId: string;
  /** X handle drives MEMBER # derivation, QR target, and bottom URL. */
  xHandle?: string;
  memberNumber?: string;
  type?: 'WAITLIST' | 'EARLY' | 'MEMBER' | 'FOUNDER';
  sex?: 'M' | 'F' | 'N/A';
  status?: string;
}

export default function TrainerCardV4({
  tier, config, personality, trainerName, cardId, xHandle,
  memberNumber, type, sex, status,
}: Props) {
  const palette = TIER_PALETTES[tier];

  const handle = (xHandle ?? '').replace(/[^a-zA-Z0-9_]/g, '');
  const displayName = (trainerName || 'TRAINER').toUpperCase().slice(0, 14);
  const displayHandle = handle.toUpperCase().slice(0, 12);
  const quote = (personality.quote ?? personality.knownFor)?.trim() ?? '';

  const abilitiesText = formatList(personality.abilities?.map((a) => a.name));
  const weaknessesText = formatList(personality.weaknesses?.map((w) => w.name));

  const memberNo = memberNumber ?? deriveMemberNo(cardId);
  const typeText = (type ?? (tier === 'founder' ? 'FOUNDER' : 'WAITLIST'));
  const sexText = sex ?? 'N/A';
  const statusText = (status ?? 'GENESIS').toUpperCase();

  const refUrlBase = process.env.NEXT_PUBLIC_REFERRAL_URL_BASE
    || (process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg') + '/create?ref=';
  const qrTarget = handle ? `${refUrlBase}${handle}` : refUrlBase;

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

  // Static barcode asset chosen by tier — black-label uses white bars on
  // its dark surface; every other tier uses the black-bars variant on its
  // lighter surface. Both PNGs are pre-cropped to their bar bbox in
  // public/brand/.
  const barcodeSrc = tier === 'black-label'
    ? '/brand/barcode-dark.png'
    : '/brand/barcode-light.png';
  const bottomHandle = (handle.toUpperCase() || 'TRAINER').slice(0, 18);

  // ResizeObserver-based scale to fit. CSS container queries with `cqw`
  // don't compile reliably through styled-jsx — verified empirically.
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

  return (
    <div id="trainer-card" className="card-v4-wrapper" ref={wrapperRef}>
      <div className="card-v4-canvas" style={{ transform: `scale(${scale})` }}>
        {/* Outer card surface */}
        <div
          style={{
            position: 'absolute',
            top: CARD_Y,
            left: CARD_X,
            width: CARD_W,
            height: CARD_H,
            background: palette.outerBg,
            borderRadius: 60,
            overflow: 'hidden',
          }}
        >
          {/* VERITY CARD header */}
          <div
            style={{
              position: 'absolute',
              top: 65,
              left: 0,
              width: CARD_W,
              textAlign: 'center',
              fontFamily: 'var(--font-agency), Impact, sans-serif',
              fontSize: 80,
              letterSpacing: '14px',
              color: palette.headerText,
              fontWeight: 700,
              lineHeight: 1.0,
            }}
          >
            VERITY CARD
          </div>

          {/* Header divider line — runs full card width below VERITY CARD */}
          <div
            style={{
              position: 'absolute',
              top: 175,
              left: 30,
              right: 30,
              height: 2,
              background: palette.innerBorder,
            }}
          />

          {/* Avatar frame (left column) */}
          <div
            style={{
              position: 'absolute',
              top: 215,
              left: LEFT_X,
              width: LEFT_W,
              height: 540,
              backgroundColor: '#f5e6c8',
              border: `2px solid ${palette.innerBorder}`,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* LimeZu sprites are 48×96 with transparent padding around the
                character; oversize the sprite + bottom-align so the visible
                character fills the frame nicely. */}
            <TrainerSprite config={config} size={520} />
          </div>

          {/* Decorative barcode (below avatar). Width matches avatar frame
              and aspect ratio is preserved per the source PNG so the bars
              stay proportional to the design. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={barcodeSrc}
            alt=""
            style={{
              position: 'absolute',
              top: 770,
              left: LEFT_X,
              width: LEFT_W,
              height: 'auto',
              display: 'block',
            }}
          />

          {/* Name + handle block (right column, top). Width capped to the
              inner-panel width so long handles never overlap the TRAINER
              column on the right. */}
          <div
            style={{
              position: 'absolute',
              top: 220,
              left: RIGHT_X,
              width: RIGHT_W,
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              color: palette.nameText,
              lineHeight: 1.0,
            }}
          >
            <div style={{ fontSize: 64, letterSpacing: '0px' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 38, marginTop: 18, letterSpacing: '0px', display: 'flex', alignItems: 'baseline' }}>
              <AtGlyph color={palette.nameText} size={38} />
              {displayHandle}
            </div>
          </div>

          {/* Quote — centered between avatar right edge and TRAINER column */}
          {quote ? (
            <div
              style={{
                position: 'absolute',
                top: 360,
                left: RIGHT_X + 30,
                width: RIGHT_W - 60,
                fontFamily: 'var(--font-agency), Impact, sans-serif',
                fontSize: 34,
                lineHeight: 1.3,
                color: palette.quoteText,
                textAlign: 'center',
                letterSpacing: '1px',
              }}
            >
              &ldquo;{quote.toUpperCase()}&rdquo;
            </div>
          ) : null}

          {/* Inner content panel — single solid white/cream block on the right.
              Bottom edge aligns with the avatar+barcode column's bottom (~855)
              so the right-half mass matches the left-half mass per the
              reference PNGs. Contains identity table on top + abilities /
              weaknesses on bottom-left + QR on bottom-right. */}
          <div
            style={{
              position: 'absolute',
              top: 470,
              left: RIGHT_X,
              width: RIGHT_W,
              height: 390,
              background: palette.innerBg,
              border: `1px solid ${palette.innerBorder}`,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* Identity table — top portion */}
            <IdTable
              memberNo={memberNo}
              typeText={typeText}
              sexText={sexText}
              statusText={statusText}
            />

            {/* SPECIAL ABILITIES + WEAKNESSES — bottom-left of inner panel */}
            <AbilitiesWeaknesses
              abilities={abilitiesText}
              weaknesses={weaknessesText}
            />

            {/* QR code — bottom-right of inner panel */}
            <div
              style={{
                position: 'absolute',
                top: 150,
                right: 30,
                width: 180,
                height: 180,
                backgroundColor: '#ffffff',
                padding: 4,
                boxSizing: 'border-box',
              }}
            >
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

          {/* TRAINER vertical text — letters stacked along card right edge */}
          <div
            style={{
              position: 'absolute',
              top: 200,
              left: 1530,
              width: 110,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {'TRAINER'.split('').map((letter, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'var(--font-moderniz), Impact, sans-serif',
                  fontSize: 95,
                  lineHeight: 0.95,
                  color: palette.trainerText,
                  fontWeight: 700,
                  letterSpacing: '0px',
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Bottom URL */}
          <div
            style={{
              position: 'absolute',
              top: 925,
              left: 0,
              width: CARD_W,
              textAlign: 'center',
              fontFamily: 'var(--font-agency), Impact, sans-serif',
              fontSize: 50,
              fontWeight: 700,
              color: palette.urlText,
              letterSpacing: '4px',
            }}
          >
            VERITY.XYZ/REF/{bottomHandle}
          </div>

          {/* Verity logo mark — bottom-right, inline with URL */}
          <div
            style={{
              position: 'absolute',
              top: 935,
              right: 80,
              width: 50,
              height: 50,
            }}
          >
            <VerityMark color={palette.markColor} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-v4-wrapper {
          width: 100%;
          aspect-ratio: ${W} / ${H};
          position: relative;
          overflow: hidden;
        }
        .card-v4-canvas {
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

// ─── Subcomponents ──────────────────────────────────────────────────────

function IdTable({
  memberNo, typeText, sexText, statusText,
}: { memberNo: string; typeText: string; sexText: string; statusText: string }) {
  const headers = ['MEMBER', 'TYPE', 'SEX', 'STATUS'];
  const values = [memberNo, typeText, sexText, statusText];
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 140,
        display: 'grid',
        gridTemplateRows: '70px 70px',
        gridTemplateColumns: 'repeat(4, 1fr)',
        boxSizing: 'border-box',
      }}
    >
      {headers.map((h, i) => (
        <div
          key={`h-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-moderniz), Impact, sans-serif',
            fontSize: 32,
            color: '#000000',
            borderRight: i < headers.length - 1 ? '1px solid #222226' : 'none',
            borderBottom: '1px solid #222226',
          }}
        >
          {h}
        </div>
      ))}
      {values.map((v, i) => (
        <div
          key={`v-${i}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-agency), Impact, sans-serif',
            fontSize: 36,
            color: '#000000',
            borderRight: i < values.length - 1 ? '1px solid #222226' : 'none',
            letterSpacing: '1px',
          }}
        >
          {v}
        </div>
      ))}
    </div>
  );
}

function AbilitiesWeaknesses({ abilities, weaknesses }: { abilities: string; weaknesses: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 155,
        left: 30,
        right: 240, // leave room for QR
        color: '#000000',
        fontFamily: 'var(--font-agency), Impact, sans-serif',
        fontSize: 26,
        lineHeight: 1.3,
      }}
    >
      <div style={{
        fontFamily: 'var(--font-moderniz), Impact, sans-serif',
        fontSize: 28,
        color: '#2a760a',
        marginBottom: 4,
      }}>
        SPECIAL ABILITIES
      </div>
      <div style={{ marginBottom: 14, letterSpacing: '0.5px' }}>{abilities}</div>
      <div style={{
        fontFamily: 'var(--font-moderniz), Impact, sans-serif',
        fontSize: 28,
        color: '#920404',
        marginBottom: 4,
      }}>
        WEAKNESSES
      </div>
      <div style={{ letterSpacing: '0.5px' }}>{weaknesses}</div>
    </div>
  );
}

function AtGlyph({ color, size }: { color: string; size: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        marginRight: 6,
        verticalAlign: 'baseline',
        position: 'relative',
        top: -size * 0.05,
      }}
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <path
          d="M3 3 H29 V29 H3 Z M7 7 V25 H25 V7 Z"
          fill={color}
          fillRule="evenodd"
        />
        <path
          d="M11 11 H21 V21 H17 V15 H15 V21 H11 Z"
          fill={color}
        />
      </svg>
    </span>
  );
}

function VerityMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden>
      <circle cx={24} cy={24} r={22} fill="none" stroke={color} strokeWidth={2} />
      <path d="M14 32 L24 12 L34 32 L24 26 Z" fill={color} />
    </svg>
  );
}
