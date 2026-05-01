'use client';

// TrainerCard V3 — landscape card with full-body sprite, AI-generated
// Special Abilities, and a Known For tagline. Verity color system only.
//
//   Header band      VERITY · TRAINER CARD                    [zodiac]
//   Body row         [ full-body sprite | name + known-for + stats + abilities ]
//   Footer           VERITY · EARLY ACCESS · MAY 2026
//
// Same id="trainer-card" as v1/v2 so the html2canvas download in ShareButtons
// keeps working. data-flatten-glass="true" on capture flips backdrop-filter
// for solid fills (html2canvas can't render blur).

import { useEffect, useState } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { ZODIAC_GLYPHS } from '@/lib/personality';
import { generateStats, STAT_LABELS, type TrainerStats } from '@/lib/card-utils';
import TrainerSprite from './TrainerSprite';

interface TrainerCardProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  cardId?: string;
  /** Owner's X handle — drives the referral QR target (`/create?ref=<handle>`). */
  xHandle?: string;
  /** AI-generated one-liner subtitle (only present for AI-generated trainers). */
  reasoning?: string;
}

export default function TrainerCard({
  config, personality, trainerName, cardId, xHandle,
}: TrainerCardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verity-trainer.vercel.app';
  // QR encodes the referral entry — scanning brings someone to the trainer
  // creation flow with the owner's handle attached for attribution.
  const cleanHandle = (xHandle ?? '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
  const qrTarget = cleanHandle
    ? `${appUrl}/create?ref=${cleanHandle}`
    : `${appUrl}/create`;

  const [qrDataUri, setQrDataUri] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(qrTarget, {
        margin: 1,
        width: 280,
        color: { dark: '#16272C', light: '#00000000' },
        errorCorrectionLevel: 'M',
      }).then((dataUri: string) => {
        if (!cancelled) setQrDataUri(dataUri);
      });
    });
    return () => { cancelled = true; };
  }, [qrTarget]);

  const stats = generateStats(config, personality);
  const zodiacGlyph = personality.zodiac ? ZODIAC_GLYPHS[personality.zodiac] : null;
  const displayName = (trainerName || 'TRAINER').toUpperCase().slice(0, 12);
  const knownFor = personality.knownFor?.trim() ?? '';
  const abilities = personality.abilities ?? [];

  return (
    <div
      id="trainer-card"
      className="trainer-card"
      style={{
        width: '100%',
        maxWidth: 720,
      }}
    >
      {/* Header strip */}
      <div className="card-header">
        <span className="brand-mark">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <path d="M2 13 L8 3 L14 13 Z" fill="#FFFDF3" />
          </svg>
          <span className="brand-text">VERITY</span>
          <span className="brand-divider">·</span>
          <span className="brand-sub">TRAINER CARD</span>
        </span>
        {zodiacGlyph ? (
          <span className="zodiac-pill">
            <span className="zodiac-glyph" aria-hidden>{zodiacGlyph}</span>
            <span className="zodiac-name">{personality.zodiac}</span>
          </span>
        ) : null}
      </div>

      {/* Body row */}
      <div className="card-body">
        {/* Sprite column (full body, no bust crop) */}
        <div className="sprite-col">
          <div className="sprite-frame">
            <div className="sprite-grid" aria-hidden />
            <div className="sprite-wrap">
              <TrainerSprite config={config} size={180} />
            </div>
          </div>
          <div className="sprite-tag">
            <span className="tag-no">№ {(cardId ?? '0001').slice(-4).toUpperCase()}</span>
          </div>
        </div>

        {/* Identity column */}
        <div className="identity-col">
          <h2 className="trainer-name">{displayName}</h2>

          {knownFor ? (
            <div className="known-for-block">
              <span className="section-eyebrow">Known For</span>
              <p className="known-for-body">{knownFor}</p>
            </div>
          ) : null}

          {/* Stats — 4 PRESENCE/WIT/TASTE/RESOLVE */}
          <div className="stats-grid">
            {(Object.keys(STAT_LABELS) as Array<keyof TrainerStats>).map((key) => (
              <StatCell key={key} label={STAT_LABELS[key]} value={stats[key]} />
            ))}
          </div>

          {/* Special Abilities + QR row */}
          <div className="abilities-row">
            {abilities.length > 0 ? (
              <div className="abilities-block">
                <span className="section-eyebrow">Special Abilities</span>
                <div className="abilities-list">
                  {abilities.slice(0, 2).map((a, i) => (
                    <div key={i} className="ability">
                      <div className="ability-name">{a.name}</div>
                      <div className="ability-desc">{a.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div style={{ flex: 1 }} />}

            {/* Referral QR */}
            <div className="qr-block">
              <div className="qr-frame">
                {qrDataUri ? (
                  <img src={qrDataUri} alt="" className="qr-img" />
                ) : null}
              </div>
              <span className="qr-caption">SCAN · MAKE YOURS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="card-footer">
        <span>VERITY</span>
        <span className="dot" aria-hidden>·</span>
        <span>EARLY ACCESS</span>
        <span className="dot" aria-hidden>·</span>
        <span>MAY 2026</span>
      </div>

      <style jsx>{`
        .trainer-card {
          position: relative;
          background: #FFFDF3;
          border: 1px solid rgba(22, 39, 44, 0.14);
          border-radius: 18px;
          overflow: hidden;
          box-shadow:
            0 32px 64px -24px rgba(22, 39, 44, 0.22),
            0 8px 16px -4px rgba(22, 39, 44, 0.10);
          font-family: var(--font-body), 'Inter', system-ui, sans-serif;
          color: #16272C;
        }

        /* Header */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 22px;
          background: #16272C;
          color: #FFFDF3;
          letter-spacing: 0.18em;
        }
        .brand-mark {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
        }
        .brand-text { font-weight: 700; }
        .brand-divider { opacity: 0.45; }
        .brand-sub { color: rgba(255, 253, 243, 0.7); font-weight: 500; }
        .zodiac-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255, 253, 243, 0.08);
          border: 1px solid rgba(255, 253, 243, 0.22);
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
        }
        .zodiac-glyph { font-size: 12px; line-height: 1; }
        .zodiac-name { color: rgba(255, 253, 243, 0.85); }

        /* Body */
        .card-body {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 22px;
          padding: 22px;
        }

        .sprite-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sprite-frame {
          position: relative;
          aspect-ratio: 1 / 2;
          background:
            linear-gradient(180deg, rgba(54, 125, 149, 0.06) 0%, rgba(144, 179, 77, 0.10) 100%),
            #FFFDF3;
          border: 1px solid rgba(22, 39, 44, 0.16);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 14px 0;
        }
        .sprite-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(22, 39, 44, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22, 39, 44, 0.05) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.6;
          pointer-events: none;
        }
        .sprite-wrap { position: relative; z-index: 1; }
        .sprite-tag {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: rgba(22, 39, 44, 0.55);
        }
        .tag-no { letter-spacing: 0.22em; }

        /* Identity column */
        .identity-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }
        .trainer-name {
          font-family: var(--font-agency), 'Impact', sans-serif;
          font-size: 56px;
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: #16272C;
          margin: 0;
          word-break: break-word;
        }

        .section-eyebrow {
          display: inline-block;
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: #367D95;
          font-weight: 700;
        }

        .known-for-block { display: flex; flex-direction: column; gap: 4px; }
        .known-for-body {
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(22, 39, 44, 0.78);
          margin: 0;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        /* Abilities + QR row */
        .abilities-row {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }
        .abilities-block { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
        .abilities-list { display: flex; flex-direction: column; gap: 6px; }
        .qr-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .qr-frame {
          width: 124px;
          height: 124px;
          padding: 8px;
          background: #FFFDF3;
          border: 1px solid rgba(22, 39, 44, 0.14);
          border-radius: 10px;
        }
        .qr-img { width: 100%; height: 100%; display: block; }
        .qr-caption {
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.32em;
          color: rgba(22, 39, 44, 0.55);
          font-weight: 700;
        }
        .ability {
          display: grid;
          grid-template-columns: minmax(96px, 28%) 1fr;
          gap: 12px;
          align-items: baseline;
          padding: 10px 12px;
          background: rgba(144, 179, 77, 0.08);
          border: 1px solid rgba(144, 179, 77, 0.30);
          border-radius: 10px;
        }
        .ability-name {
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 700;
          color: #3F5520;
        }
        .ability-desc {
          font-family: var(--font-body), 'Inter', sans-serif;
          font-size: 12.5px;
          line-height: 1.4;
          color: #16272C;
        }

        /* Footer */
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 12px 22px;
          background: #FFFDF3;
          border-top: 1px solid rgba(22, 39, 44, 0.10);
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(22, 39, 44, 0.55);
        }
        .card-footer .dot { color: rgba(22, 39, 44, 0.30); }
      `}</style>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="stat-cell">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: pct + '%' }} />
      </div>
      <style jsx>{`
        .stat-cell {
          display: grid;
          grid-template-columns: 1fr auto;
          row-gap: 4px;
          align-items: baseline;
          padding: 8px 10px;
          background: #FFFDF3;
          border: 1px solid rgba(22, 39, 44, 0.10);
          border-radius: 8px;
          min-width: 0;
        }
        .stat-label {
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 700;
          color: rgba(22, 39, 44, 0.55);
        }
        .stat-value {
          font-family: var(--font-agency), 'Impact', sans-serif;
          font-size: 18px;
          line-height: 1;
          color: #16272C;
          letter-spacing: 0.02em;
        }
        .stat-track {
          grid-column: 1 / -1;
          height: 4px;
          background: rgba(22, 39, 44, 0.08);
          border-radius: 999px;
          overflow: hidden;
        }
        .stat-fill {
          height: 100%;
          background: linear-gradient(90deg, #367D95 0%, #90B34D 100%);
          border-radius: 999px;
          transition: width 220ms ease;
        }
      `}</style>
    </div>
  );
}
