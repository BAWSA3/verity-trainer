'use client';

import { useEffect, useRef, useState } from 'react';
import type { TrainerConfig, TrainerPersonality, TierKey } from '@/types/trainer';
import TrainerSprite from '../TrainerSprite';
import { TIER_PALETTES } from '@/lib/cards/v4-tokens';
import { deriveMemberNo, formatList } from '@/lib/cards/v4-render';

// Verity Trainer Card — V4 chassis. Master canvas 1920×1080.
// All measurements come from `design-templates/verity-trainer-card-spec.md`
// — they're exact pixel values extracted from the source Canva design.
// Do not approximate. If the rendered card looks off, fix the cell-vs-text
// alignment or font loading first; ratios in the spec are authoritative.
//
// The "inner panel" is structurally subtle: it shares the outer card's
// X position and width, and only differs in HEIGHT — covering the top
// 720.7px of the card. The bottom 143.3px strip (where the URL + Verity
// mark sit) is "outer card background only".
//
// `id="trainer-card"` preserved for ShareButtons html2canvas.

const W = 1920;
const H = 1080;

// Card outer geometry (spec §2.3).
const CARD_X = 268.8;
const CARD_Y = 108;
const CARD_W = 1412.3;
const CARD_H = 864;
const CARD_RADIUS = 35;

// Inner panel — same X/W as outer card; ends 143.3px above the card bottom.
const PANEL_H = 720.7;

// Constants from spec §5 ("Constants across all tiers").
const CREAM = '#f5e6c8';
const TABLE_BORDER = '#222226';
const ABILITIES_GREEN = '#2a760a';
const WEAKNESSES_RED = '#920404';

interface Props {
  tier: TierKey;
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  cardId: string;
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
  const quoteRaw = (personality.quote ?? personality.knownFor)?.trim() ?? '';
  const quote = quoteRaw ? `“${quoteRaw}”` : '';

  const abilitiesText = formatList(personality.abilities?.map((a) => a.name));
  const weaknessesText = formatList(personality.weaknesses?.map((w) => w.name));

  const memberNo = memberNumber ?? deriveMemberNo(cardId);
  const typeText = (type ?? (tier === 'founder' ? 'FOUNDER' : 'WAITLIST'));
  const sexText = sex ?? 'N/A';
  const statusText = (status ?? 'GENESIS').toUpperCase();

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

  // Tier-specific barcode asset; both pre-cropped to bar bbox.
  const barcodeSrc = tier === 'black-label'
    ? '/brand/barcode-dark.png'
    : '/brand/barcode-light.png';

  const bottomHandle = (handle.toUpperCase() || 'TRAINER').slice(0, 18);

  // ResizeObserver-based scale-to-fit (CSS container queries with `cqw`
  // don't compile reliably through styled-jsx — verified empirically).
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
        {/* Outer card surface (spec §2.3) */}
        <div
          style={{
            position: 'absolute',
            top: CARD_Y,
            left: CARD_X,
            width: CARD_W,
            height: CARD_H,
            background: palette.outerBg,
            borderRadius: CARD_RADIUS,
            overflow: 'hidden',
          }}
        >
          {/* Inner panel — same X/W as outer card; covers top portion only.
              Background and border per tier. The bottom strip below remains
              "outer card background only" for the URL + Verity mark. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CARD_W,
              height: PANEL_H,
              background: palette.innerBg,
              border: `1px solid ${palette.innerBorder}`,
              boxSizing: 'border-box',
            }}
          />

          {/* All children below are positioned in CANVAS coordinates and
              translated into card-local coords via offsetting CARD_X/CARD_Y. */}
          <CardContent
            palette={palette}
            tier={tier}
            config={config}
            displayName={displayName}
            displayHandle={displayHandle}
            quote={quote}
            memberNo={memberNo}
            typeText={typeText}
            sexText={sexText}
            statusText={statusText}
            abilitiesText={abilitiesText}
            weaknessesText={weaknessesText}
            qrDataUri={qrDataUri}
            barcodeSrc={barcodeSrc}
            bottomHandle={bottomHandle}
          />
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

// All children of the outer card; positions are CANVAS-relative per spec,
// then offset back into card-local coords (-CARD_X, -CARD_Y).
function CardContent({
  palette, tier, config, displayName, displayHandle, quote,
  memberNo, typeText, sexText, statusText,
  abilitiesText, weaknessesText, qrDataUri, barcodeSrc, bottomHandle,
}: {
  palette: typeof TIER_PALETTES[TierKey];
  tier: TierKey;
  config: TrainerConfig;
  displayName: string;
  displayHandle: string;
  quote: string;
  memberNo: string;
  typeText: string;
  sexText: string;
  statusText: string;
  abilitiesText: string;
  weaknessesText: string;
  qrDataUri: string;
  barcodeSrc: string;
  bottomHandle: string;
}) {
  // Helper to convert canvas-relative coords to card-local.
  const cx = (canvasX: number) => canvasX - CARD_X;
  const cy = (canvasY: number) => canvasY - CARD_Y;
  void tier;

  return (
    <>
      {/* §4.1 VERITY CARD header */}
      <div
        style={{
          position: 'absolute',
          top: cy(116.8),
          left: cx(730.9),
          width: 458.2,
          height: 63.3,
          color: palette.headerText,
          fontFamily: 'var(--font-agency), Impact, sans-serif',
          fontSize: 40,
          letterSpacing: '0.162em',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        VERITY CARD
      </div>

      {/* §4.2 Avatar frame */}
      <div
        style={{
          position: 'absolute',
          top: cy(216.3),
          left: cx(305.8),
          width: 418.9,
          height: 538,
          backgroundColor: CREAM,
          border: `2px solid ${palette.innerBorder}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* LimeZu sprites are 48×96 with transparent padding; oversize +
            bottom-align so the visible character fills the frame. */}
        <TrainerSprite config={config} size={500} />
      </div>

      {/* §4.3 Name */}
      <div
        style={{
          position: 'absolute',
          top: cy(216.3),
          left: cx(744.7),
          width: 690.4,
          height: 55.6,
          color: palette.nameText,
          fontFamily: 'var(--font-moderniz), Impact, sans-serif',
          fontSize: 35,
          lineHeight: 1.0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {displayName}
      </div>

      {/* §4.5 @ glyph (separate, sized larger than handle) */}
      <div
        style={{
          position: 'absolute',
          top: cy(266.6),
          left: cx(737.5),
          width: 50.6,
          height: 61.3,
        }}
      >
        <AtGlyph color={palette.nameText} />
      </div>

      {/* §4.4 Handle text (without @) */}
      <div
        style={{
          position: 'absolute',
          top: cy(292.7),
          left: cx(790.7),
          width: 260.7,
          height: 35.1,
          color: palette.nameText,
          fontFamily: 'var(--font-moderniz), Impact, sans-serif',
          fontSize: 22,
          lineHeight: 1.0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {displayHandle}
      </div>

      {/* §4.6 Quote */}
      {quote ? (
        <div
          style={{
            position: 'absolute',
            top: cy(367.3),
            left: cx(788.1),
            width: 734.5,
            height: 73.7,
            color: palette.quoteText,
            fontFamily: 'var(--font-agency), Impact, sans-serif',
            fontSize: 23,
            lineHeight: 1.3,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {quote}
        </div>
      ) : null}

      {/* White sub-panel — visible in all reference PNGs, contains the
          identity table on top and abilities/weaknesses/QR below it on a
          white backdrop. Spec doesn't explicitly call this out but it's
          required for the references to match. Width capped so it ends
          just before the TRAINER column at x=1554.6. */}
      <div
        style={{
          position: 'absolute',
          top: cy(478),
          left: cx(763),
          width: 790,
          height: 360,
          backgroundColor: '#ffffff',
          border: `1px solid ${TABLE_BORDER}`,
          boxSizing: 'border-box',
        }}
      />

      {/* §4.7 + §4.8 Identity table — 4 columns × 2 rows on cream background
          with 1px black borders between cells. Cells extend slightly above /
          below the text bboxes given by spec so the visual cell padding
          matches the references. */}
      <IdTable
        memberNo={memberNo}
        typeText={typeText}
        sexText={sexText}
        statusText={statusText}
        cx={cx}
        cy={cy}
      />

      {/* §4.9 Special Abilities — text directly on card background */}
      <div
        style={{
          position: 'absolute',
          top: cy(642.3),
          left: cx(781.9),
          width: 477.3,
          height: 82.7,
          color: '#000000',
          fontFamily: 'var(--font-agency), Impact, sans-serif',
          fontSize: 16,
          lineHeight: 1.3,
        }}
      >
        <div style={{
          fontFamily: 'var(--font-moderniz), Impact, sans-serif',
          fontSize: 16,
          color: ABILITIES_GREEN,
          lineHeight: 1.0,
          marginBottom: 4,
        }}>
          SPECIAL ABILITIES
        </div>
        <div>{abilitiesText}</div>
      </div>

      {/* §4.10 Weaknesses */}
      <div
        style={{
          position: 'absolute',
          top: cy(744),
          left: cx(783.4),
          width: 474.2,
          height: 82.7,
          color: '#000000',
          fontFamily: 'var(--font-agency), Impact, sans-serif',
          fontSize: 16,
          lineHeight: 1.3,
        }}
      >
        <div style={{
          fontFamily: 'var(--font-moderniz), Impact, sans-serif',
          fontSize: 16,
          color: WEAKNESSES_RED,
          lineHeight: 1.0,
          marginBottom: 4,
        }}>
          WEAKNESSES
        </div>
        <div>{weaknessesText}</div>
      </div>

      {/* §4.11 QR — visual estimate per spec; positioned to fit inside the
          white sub-panel, right of the abilities/weaknesses block. */}
      <div
        style={{
          position: 'absolute',
          top: cy(648),
          left: cx(1352),
          width: 185,
          height: 185,
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

      {/* §4.12 Decorative barcode */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={barcodeSrc}
        alt=""
        style={{
          position: 'absolute',
          top: cy(772.2),
          left: cx(305.8),
          width: 418.9,
          height: 84.1,
          display: 'block',
        }}
      />

      {/* §4.13 TRAINER vertical text — rotated 90° CW. Using CSS
          writing-mode: vertical-rl + text-orientation: mixed renders
          characters rotated sideways and flowing top-to-bottom, which
          matches the reference. The rotated bbox is 118.1 × 648 at
          (1554.6, 211.5) per spec. */}
      <div
        style={{
          position: 'absolute',
          top: cy(211.5),
          left: cx(1554.6),
          width: 118.1,
          height: 648,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: palette.trainerText,
          fontFamily: 'var(--font-moderniz), Impact, sans-serif',
          fontSize: 75,
          lineHeight: 1.0,
          fontWeight: 700,
          letterSpacing: '0px',
        }}
      >
        TRAINER
      </div>

      {/* §4.14 Bottom URL */}
      <div
        style={{
          position: 'absolute',
          top: cy(912.7),
          left: cx(706.7),
          width: 506.6,
          height: 43.7,
          color: palette.urlText,
          fontFamily: 'var(--font-body), Inter, sans-serif',
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1.0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        VERITY.XYZ/REF/{bottomHandle}
      </div>

      {/* §4.15 Verity logo mark */}
      <div
        style={{
          position: 'absolute',
          top: cy(909.5),
          left: cx(1568.7),
          width: 50.1,
          height: 50.1,
        }}
      >
        <VerityMark color={palette.markColor} />
      </div>
    </>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────

function IdTable({
  memberNo, typeText, sexText, statusText, cx, cy,
}: {
  memberNo: string;
  typeText: string;
  sexText: string;
  statusText: string;
  cx: (n: number) => number;
  cy: (n: number) => number;
}) {
  // Per spec §4.7 / §4.8 — text bboxes are given for each cell. The actual
  // CELLS have cream background with 1px borders. We lay the cells out as
  // a single row spanning headers' Y to values' Y+H, split into 4 cols by
  // mid-points between the spec'd text bboxes.

  // Header text bboxes
  const memberH = { x: 768.4, w: 219.3 };
  const typeH   = { x: 1024.9, w: 107.8 };
  const sexH    = { x: 1199.7, w: 107.8 };
  const statusH = { x: 1344.4, w: 143.3 };

  // Compute column boundaries — midpoints between adjacent text bboxes
  const c1 = memberH.x;                                        // left of MEMBER
  const c2 = (memberH.x + memberH.w + typeH.x) / 2;            // MEMBER↔TYPE
  const c3 = (typeH.x + typeH.w + sexH.x) / 2;                 // TYPE↔SEX
  const c4 = (sexH.x + sexH.w + statusH.x) / 2;                // SEX↔STATUS
  const c5 = statusH.x + statusH.w;                            // right of STATUS

  // Cell vertical extents
  const headerY = 480;       // a few px above 489.9 text top
  const dividerY = 540;      // mid-gap between header bottom (518.2) and value top (561.3)
  const tableBottomY = 600;  // a few px below value bottom (593)

  const tableLeft = c1;
  const tableTop = headerY;
  const tableW = c5 - c1;
  const tableH = tableBottomY - headerY;

  return (
    <>
      {/* Cream background rectangle for the entire table */}
      <div
        style={{
          position: 'absolute',
          top: cy(tableTop),
          left: cx(tableLeft),
          width: tableW,
          height: tableH,
          backgroundColor: CREAM,
          border: `1px solid ${TABLE_BORDER}`,
          boxSizing: 'border-box',
        }}
      />

      {/* Vertical column dividers (3 lines between 4 cells) */}
      {[c2, c3, c4].map((boundary, i) => (
        <div
          key={`vd-${i}`}
          style={{
            position: 'absolute',
            top: cy(tableTop),
            left: cx(boundary) - 0.5,
            width: 1,
            height: tableH,
            backgroundColor: TABLE_BORDER,
          }}
        />
      ))}

      {/* Horizontal divider between header and value rows */}
      <div
        style={{
          position: 'absolute',
          top: cy(dividerY) - 0.5,
          left: cx(tableLeft),
          width: tableW,
          height: 1,
          backgroundColor: TABLE_BORDER,
        }}
      />

      {/* Header text — exact spec positions */}
      {[
        { text: 'MEMBER', x: 768.4, y: 489.9, w: 219.3, h: 28.3 },
        { text: 'TYPE',   x: 1024.9, y: 489.9, w: 107.8, h: 28.3 },
        { text: 'SEX',    x: 1199.7, y: 488.9, w: 107.8, h: 28.3 },
        { text: 'STATUS', x: 1344.4, y: 489.9, w: 143.3, h: 28.3 },
      ].map((cell) => (
        <div
          key={`h-${cell.text}`}
          style={{
            position: 'absolute',
            top: cy(cell.y),
            left: cx(cell.x),
            width: cell.w,
            height: cell.h,
            color: '#000000',
            fontFamily: 'var(--font-moderniz), Impact, sans-serif',
            fontSize: 18,
            lineHeight: 1.0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {cell.text}
        </div>
      ))}

      {/* Value text — exact spec positions */}
      {[
        { text: memberNo, x: 778.2,  y: 561.3, w: 199.7, h: 31.7 },
        { text: typeText, x: 977.9,  y: 560.3, w: 207,   h: 31.7 },
        { text: sexText,  x: 1197,   y: 561.3, w: 113.2, h: 31.7 },
        { text: statusText, x: 1343, y: 561.6, w: 146,   h: 31.7 },
      ].map((cell, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: cy(cell.y),
            left: cx(cell.x),
            width: cell.w,
            height: cell.h,
            color: '#000000',
            fontFamily: 'var(--font-agency), Impact, sans-serif',
            fontSize: 20,
            lineHeight: 1.0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {cell.text}
        </div>
      ))}
    </>
  );
}

function AtGlyph({ color }: { color: string }) {
  // Blocky / squared @ glyph approximating Moderniz aesthetic. Sized 100% of
  // its container per spec §4.5. Outer square ring + inner spiral form.
  return (
    <svg viewBox="0 0 32 40" width="100%" height="100%" aria-hidden>
      <path
        d="M3 3 H29 V37 H3 Z M7 7 V33 H25 V7 Z"
        fill={color}
        fillRule="evenodd"
      />
      <path
        d="M11 11 H21 V29 H17 V18 H15 V29 H11 Z"
        fill={color}
      />
    </svg>
  );
}

function VerityMark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 50 50" width="100%" height="100%" aria-hidden>
      <circle cx={25} cy={25} r={23} fill="none" stroke={color} strokeWidth={2} />
      <path d="M14 33 L25 12 L36 33 L25 26 Z" fill={color} />
    </svg>
  );
}
