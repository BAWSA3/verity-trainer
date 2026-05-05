'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { TrainerConfig, TrainerPersonality, TierKey } from '@/types/trainer';
import TrainerSprite from '../TrainerSprite';
import { TIER_PALETTES } from '@/lib/cards/v4-tokens';
import { barcodePattern, deriveMemberNo, formatList } from '@/lib/cards/v4-render';

// Verity Trainer Card — V4 chassis (replaces V3.2).
//
// Master canvas is 1920×1080. All measurements live in master pixels; the
// outer wrapper scales the entire card to fit its container via CSS
// transform. This keeps visual fidelity to the reference PNGs in
// design-templates/ regardless of viewport size.
//
// Tier visuals (red / green / blue / black-label / founder) are driven
// entirely by `TIER_PALETTES`. The layout is identical across tiers — only
// colors swap. See `verity-trainer-card-spec.md` (in design-templates/) for
// the source spec. Where the spec contradicted the reference PNGs, the
// references win — see `v4-tokens.ts` notes for specifics.
//
// `id="trainer-card"` preserved so ShareButtons html2canvas keeps working.

const W = 1920;
const H = 1080;

interface Props {
  tier: TierKey;
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  cardId: string;
  /** X handle drives MEMBER # derivation, QR target, and bottom URL. */
  xHandle?: string;
  /** Override for backend-assigned member number (not yet wired). */
  memberNumber?: string;
  /** Override for type field (defaults to WAITLIST per Phase 1). */
  type?: 'WAITLIST' | 'EARLY' | 'MEMBER' | 'FOUNDER';
  /** Override for sex field (defaults to N/A). */
  sex?: 'M' | 'F' | 'N/A';
  /** Override for status field (defaults to GENESIS per Phase 1). */
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

  // V4 flattens structured abilities/weaknesses into comma-separated text
  // (matches the reference PNGs: "BUILDING BRAND SYSTEMS, REAL FRIENDSHIPS, & DIGITAL COLLECTIBLES").
  const abilitiesText = formatList(personality.abilities?.map((a) => a.name));
  const weaknessesText = formatList(personality.weaknesses?.map((w) => w.name));

  // Derived MEMBER # — pending real backend column. Hash card id → 5-digit.
  const memberNo = memberNumber ?? deriveMemberNo(cardId);
  const typeText = (type ?? (tier === 'founder' ? 'FOUNDER' : 'WAITLIST'));
  const sexText = sex ?? 'N/A';
  const statusText = (status ?? 'GENESIS').toUpperCase();

  // QR target — referral entry on verity.xyz once tech-team owns the domain.
  // For now, fall back to the trainer.verity.gg /create?ref= path so existing
  // shares stay functional. Both forms encode handle.
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

  const barPattern = useMemo(() => barcodePattern(cardId), [cardId]);
  const bottomHandle = (handle.toUpperCase() || 'TRAINER').slice(0, 18);

  // Scale the 1920×1080 master canvas to fit the wrapper. Using a
  // ResizeObserver here (rather than CSS container queries) because
  // `transform: scale(calc(100cqw / 1920))` doesn't compile reliably
  // through styled-jsx — verified empirically.
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
    <div
      id="trainer-card"
      className="card-v4-wrapper"
      ref={wrapperRef}
    >
      <div className="card-v4-canvas" style={{ transform: `scale(${scale})` }}>
        {/* Outer card surface */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            right: 30,
            bottom: 30,
            background: palette.outerBg,
            borderRadius: 35,
            overflow: 'hidden',
          }}
        >
          {/* VERITY CARD header */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-agency), Impact, sans-serif',
              fontSize: 64,
              letterSpacing: '12px',
              color: palette.headerText,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            VERITY CARD
          </div>

          {/* Inner content panel — visible on green and black-label tiers; on red/blue
              the inner panel is white and contains only the table + abilities + QR
              (avatar frame is OUTSIDE this panel per spec §2.4). To match the
              reference PNGs we render the inner panel as a tier-themed rectangle
              behind the table+abilities+QR area only. */}
          <div
            style={{
              position: 'absolute',
              top: 145,
              left: 60,
              right: 60,
              bottom: 145,
              border: `1px solid ${palette.innerBorder}`,
              borderRadius: 6,
              background: palette.innerBg,
            }}
          />

          {/* Avatar frame — sits ON TOP of the inner panel border on the left,
              with a constant cream backdrop across all tiers. */}
          <div
            style={{
              position: 'absolute',
              top: 230,
              left: 165,
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
            {/* LimeZu sprites are 48×96 with transparent padding around the
                character, so sizing past the frame and bottom-aligning is the
                cleanest way to make the character fill the frame visually. */}
            <TrainerSprite config={config} size={520} />
          </div>

          {/* Name + handle block */}
          <div
            style={{
              position: 'absolute',
              top: 235,
              left: 605,
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              color: palette.nameText,
              lineHeight: 1.0,
            }}
          >
            <div style={{ fontSize: 64, letterSpacing: '0px' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 38, marginTop: 16, letterSpacing: '0px' }}>
              <AtGlyph color={palette.nameText} size={38} />
              {displayHandle}
            </div>
          </div>

          {/* Quote — right of avatar, below the name block */}
          {quote ? (
            <div
              style={{
                position: 'absolute',
                top: 410,
                left: 800,
                width: 700,
                fontFamily: 'var(--font-agency), Impact, sans-serif',
                fontSize: 30,
                lineHeight: 1.3,
                color: palette.quoteText,
                textAlign: 'center',
              }}
            >
              &ldquo;{quote.toUpperCase()}&rdquo;
            </div>
          ) : null}

          {/* Identity table — MEMBER / TYPE / SEX / STATUS */}
          <IdTable
            memberNo={memberNo}
            typeText={typeText}
            sexText={sexText}
            statusText={statusText}
          />

          {/* SPECIAL ABILITIES + WEAKNESSES block */}
          <AbilitiesWeaknesses abilities={abilitiesText} weaknesses={weaknessesText} />

          {/* QR code */}
          <div
            style={{
              position: 'absolute',
              top: 660,
              left: 1265,
              width: 220,
              height: 220,
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

          {/* Decorative barcode — bottom-left, deterministic from card id */}
          <Barcode pattern={barPattern} />

          {/* TRAINER vertical text — right edge */}
          <div
            style={{
              position: 'absolute',
              top: 230,
              right: 90,
              fontFamily: 'var(--font-moderniz), Impact, sans-serif',
              fontSize: 130,
              letterSpacing: '0px',
              color: palette.trainerText,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              lineHeight: 1.0,
              fontWeight: 700,
            }}
          >
            TRAINER
          </div>

          {/* Bottom URL — centered, with logo mark to the right */}
          <div
            style={{
              position: 'absolute',
              top: 985,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 44,
              fontWeight: 600,
              color: palette.urlText,
              letterSpacing: '0px',
            }}
          >
            VERITY.XYZ/REF/{bottomHandle}
          </div>

          {/* Verity logo mark — bottom-right */}
          <div
            style={{
              position: 'absolute',
              top: 992,
              right: 145,
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
        top: 530,
        left: 605,
        width: 920,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        border: '1px solid #222226',
        background: '#f5e6c8',
        boxSizing: 'border-box',
      }}
    >
      {headers.map((h, i) => (
        <div
          key={`h-${i}`}
          style={{
            padding: '14px 0',
            textAlign: 'center',
            fontFamily: 'var(--font-moderniz), Impact, sans-serif',
            fontSize: 30,
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
            padding: '12px 0',
            textAlign: 'center',
            fontFamily: 'var(--font-agency), Impact, sans-serif',
            fontSize: 32,
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
        top: 670,
        left: 605,
        width: 620,
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
        marginBottom: 6,
      }}>
        SPECIAL ABILITIES
      </div>
      <div style={{ marginBottom: 24 }}>{abilities}</div>
      <div style={{
        fontFamily: 'var(--font-moderniz), Impact, sans-serif',
        fontSize: 28,
        color: '#920404',
        marginBottom: 6,
      }}>
        WEAKNESSES
      </div>
      <div>{weaknesses}</div>
    </div>
  );
}

function Barcode({ pattern }: { pattern: number[] }) {
  // Pre-compute bar positions so render stays pure (no mutation across map iters).
  const bars = pattern.reduce<{ rects: { x: number; w: number; key: number }[]; x: number }>(
    (acc, bit, i) => {
      const w = 2 + (i % 3);
      if (bit) acc.rects.push({ x: acc.x, w, key: i });
      acc.x += w;
      return acc;
    },
    { rects: [], x: 0 },
  ).rects;
  return (
    <svg
      style={{ position: 'absolute', top: 850, left: 165, width: 360, height: 50 }}
      viewBox="0 0 360 50"
      preserveAspectRatio="none"
    >
      <rect x={0} y={0} width={360} height={50} fill="#ffffff" />
      {bars.map((b) => (
        <rect key={b.key} x={b.x} y={0} width={b.w} height={50} fill="#000000" />
      ))}
    </svg>
  );
}

function AtGlyph({ color, size }: { color: string; size: number }) {
  // Square / blocky '@' approximation (Moderniz lacks the glyph). Sized to
  // match the handle's font size; the inline-block + vertical-align keeps
  // it baseline-aligned with the surrounding text.
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        marginRight: 4,
        verticalAlign: 'baseline',
        position: 'relative',
        top: -size * 0.05,
      }}
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        {/* outer ring */}
        <path
          d="M3 3 H29 V29 H3 Z M7 7 V25 H25 V7 Z"
          fill={color}
          fillRule="evenodd"
        />
        {/* inner curl */}
        <path
          d="M11 11 H21 V21 H17 V15 H15 V21 H11 Z"
          fill={color}
        />
      </svg>
    </span>
  );
}

function VerityMark({ color }: { color: string }) {
  // Diamond/triangle mark from V3 brand — same path, recolored per tier.
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden>
      <circle cx={24} cy={24} r={23} fill="none" stroke={color} strokeWidth={2} />
      <path d="M14 32 L24 12 L34 32 L24 26 Z" fill={color} />
    </svg>
  );
}

