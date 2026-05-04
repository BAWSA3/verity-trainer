'use client';

// ConsoleScreen — value-first re-roll loop. AI generates the trainer; user
// sees the roast quote, stats, and hero, then either RE-ROLLs the visual
// (slot-machine dopamine — stats reshuffle on every pull) or CLAIMs to
// commit. Tier rolls happen at claim, not at re-roll, so users never know
// what tier they'll get until they sign.
//
// Customization tabs (BODY/WEAR/VIBE) intentionally removed — the flow now
// trades manual overrides for a tighter funnel + slot-machine engagement.

import { useEffect, useRef, useState } from 'react';
import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import { ZODIAC_GLYPHS, ZODIAC_OPTIONS } from '@/lib/personality';
import { generateStats, STAT_LABELS, type TrainerStats } from '@/lib/card-utils';
import TrainerSprite from '@/components/TrainerSprite';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePressState } from '@/components/device/ConsolePressState';

interface ConsoleScreenProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  canGenerate: boolean;
  missingLabels: string[];
  hasAi: boolean;
  onNameChange: (next: string) => void;
  onZodiacChange: (next: Zodiac | '') => void;
  onGenerate: () => void;
  onRegenerate?: () => void;
}

export default function ConsoleScreen({
  config, personality, trainerName,
  canGenerate, missingLabels, hasAi,
  onNameChange, onZodiacChange,
  onGenerate, onRegenerate,
}: ConsoleScreenProps) {
  const audio = useAudioPlayer();
  const { pulse } = usePressState();

  // Roll counter + animation state. Drives the dopamine loop:
  //   - "ROLL #N" badge increments on each re-roll
  //   - sprite + stats briefly shake/flash to acknowledge the pull
  //   - sound effect on each pull (handled in audio.toggle path)
  const [rollCount, setRollCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Status LEDs — green pulses while sprite is mounted; azure while audio plays.
  useEffect(() => {
    pulse('ledGreen', 600);
  }, [config, pulse]);
  useEffect(() => {
    if (audio.isPlaying) pulse('ledAzure', 600);
  }, [audio.isPlaying, pulse]);

  function handleClaim() {
    if (!canGenerate) return;
    pulse('btnA', 280);
    onGenerate();
  }

  function handleRegenerate() {
    if (!onRegenerate) return;
    pulse('btnB', 280);
    pulse('ledCoral', 600);
    setRollCount((n) => n + 1);
    setIsRolling(true);
    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    rollTimeoutRef.current = setTimeout(() => setIsRolling(false), 360);
    onRegenerate();
  }

  function handleMusicToggle() {
    pulse('btnX');
    audio.toggle();
  }

  const stats = generateStats(config, personality);
  const total = stats.presence + stats.wit + stats.taste + stats.resolve;
  const level = Math.max(1, Math.min(10, Math.floor(total / 40)));
  const glyph = personality.zodiac ? ZODIAC_GLYPHS[personality.zodiac] : '◯';
  const quote = personality.quote ?? personality.knownFor;

  return (
    <div className="screen-grid">
      {/* Header strip — name + zodiac + level + music */}
      <header className="screen-header">
        <div className="screen-name">
          <span className="screen-label">TRAINER</span>
          <input
            type="text"
            value={trainerName}
            onChange={(e) => onNameChange(e.target.value.slice(0, 12))}
            placeholder="enter a name"
            maxLength={12}
            className="name-input"
          />
        </div>
        <select
          value={personality.zodiac}
          onChange={(e) => onZodiacChange(e.target.value as Zodiac | '')}
          className="zodiac-select"
          aria-label="Zodiac"
        >
          <option value="">— sign —</option>
          {ZODIAC_OPTIONS.map((z) => (
            <option key={z.id} value={z.id}>{z.label}</option>
          ))}
        </select>
        <span className="zodiac-glyph" aria-hidden>{glyph}</span>
        <span className="level-pill">
          <span className="level-label">LV</span>
          <span className="level-value">{level}</span>
        </span>
        <button
          type="button"
          onClick={handleMusicToggle}
          className="music-toggle"
          aria-label={audio.isPlaying ? 'Pause music' : 'Play music'}
          title={audio.currentTrack?.title ?? 'Music'}
        >
          {audio.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </header>

      {/* Stat strip */}
      <div className={'screen-stats ' + (isRolling ? 'is-rolling' : '')}>
        {(Object.keys(STAT_LABELS) as Array<keyof TrainerStats>).map((k) => (
          <Stat key={k} label={STAT_LABELS[k]} value={stats[k]} />
        ))}
      </div>

      {/* Trainer hero — bigger now that tabs are gone */}
      <div className={'screen-hero ' + (isRolling ? 'is-rolling' : '')}>
        <div className="hero-floor" aria-hidden />
        <div className="hero-sprite-wrap">
          <TrainerSprite config={config} size={220} />
        </div>
        {rollCount > 0 ? (
          <span className="roll-counter" aria-live="polite">
            ROLL #{rollCount + 1}
          </span>
        ) : null}
      </div>

      {/* AI roast quote — the share-worthy line */}
      {quote ? (
        <div className="screen-quote">
          <span className="quote-mark">“</span>
          <p className="quote-body">{quote}</p>
        </div>
      ) : null}

      {/* Sticky footer — Re-roll (left) + Claim (right) */}
      <div className="screen-footer">
        {onRegenerate && (
          <button
            type="button"
            onClick={handleRegenerate}
            className="footer-btn footer-reroll"
            aria-label="Re-roll the trainer"
            title="Roll again — keep pulling until you're happy"
          >
            <span className="reroll-icon" aria-hidden>🎲</span>
            <span className="reroll-label">Re-roll</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleClaim}
          disabled={!canGenerate}
          className="footer-btn footer-primary"
        >
          {canGenerate
            ? hasAi ? 'Claim Trainer →' : 'Generate Trainer →'
            : `Pick ${missingLabels.join(', ')}`}
        </button>
      </div>

      <style jsx>{`
        .screen-grid {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: var(--ink);
          overflow: hidden;
          min-height: 0;
        }

        .screen-header {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .screen-name {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .screen-label {
          font-size: 8px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--ink-muted);
          flex-shrink: 0;
        }
        .name-input {
          flex: 1;
          min-width: 0;
          padding: 5px 8px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(22, 39, 44, 0.15);
          color: var(--ink);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .name-input:focus { outline: none; border-color: var(--accent-coral); }
        .zodiac-select {
          padding: 5px 8px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(22, 39, 44, 0.15);
          border-radius: 6px;
          font-size: 11px;
          color: var(--ink);
          cursor: pointer;
        }
        .zodiac-glyph {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: rgba(54, 125, 149, 0.12);
          border: 1px solid rgba(54, 125, 149, 0.3);
          color: #1F5469;
          font-size: 14px;
        }
        .level-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          background: linear-gradient(135deg, rgba(255, 107, 92, 0.14), rgba(255, 107, 92, 0.06));
          border: 1px solid rgba(255, 107, 92, 0.4);
          color: #A53A2E;
        }
        .level-label { font-size: 8px; letter-spacing: 0.16em; font-weight: 700; }
        .level-value { font-size: 12px; font-weight: 700; }
        .music-toggle {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: rgba(54, 125, 149, 0.12);
          border: 1px solid rgba(54, 125, 149, 0.3);
          color: #1F5469;
          cursor: pointer;
          transition: background 160ms ease, transform 120ms ease;
        }
        .music-toggle:hover { background: rgba(54, 125, 149, 0.22); }
        .music-toggle:active { transform: scale(0.92); }

        .screen-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
          min-width: 0;
          transition: transform 220ms ease, filter 220ms ease;
        }
        .screen-stats.is-rolling {
          animation: roll-flash 360ms ease-out;
        }
        @media (min-width: 1024px) {
          .screen-stats { grid-template-columns: repeat(4, 1fr); }
        }

        .screen-hero {
          position: relative;
          display: grid;
          place-items: center;
          background:
            radial-gradient(ellipse 70% 35% at 50% 95%, rgba(67, 56, 202, 0.10) 0%, transparent 70%),
            transparent;
          border-radius: 8px;
          padding: 10px 0;
          flex: 1 1 auto;
          min-height: 0;
          overflow: hidden;
        }
        .screen-hero.is-rolling .hero-sprite-wrap {
          animation: sprite-pull 360ms ease-out;
        }
        /* Sprite wrap fits the hero box: fill height, derive width from the
           48×96 (1:2) LimeZu aspect, and let the inner sprite stretch to 100%
           via the override below. Avoids the previous fixed-px sizing that
           overflowed .screen-hero (which has overflow:hidden) and clipped the
           lower body — most visible at desktop widths and at small viewports
           where vertical space gets squeezed. No min-height on purpose: on
           tight portrait viewports the sprite shrinks rather than overflows. */
        .hero-sprite-wrap {
          position: relative;
          height: 100%;
          max-height: 100%;
          aspect-ratio: 1 / 2;
          flex-shrink: 1;
        }
        .hero-sprite-wrap > :global(*) {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
        }
        .hero-floor {
          position: absolute;
          inset: auto 24px 18px 24px;
          height: 4px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(67, 56, 202, 0.18), transparent 70%);
        }
        .roll-counter {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 3px 8px;
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 9px;
          letter-spacing: 0.20em;
          font-weight: 700;
          color: #A53A2E;
          background: rgba(255, 107, 92, 0.12);
          border: 1px solid rgba(255, 107, 92, 0.4);
          border-radius: 999px;
          animation: counter-pop 240ms ease-out;
        }

        .screen-quote {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(54, 125, 149, 0.06);
          border: 1px solid rgba(54, 125, 149, 0.20);
          border-radius: 8px;
        }
        .quote-mark {
          font-size: 22px;
          line-height: 0.9;
          color: rgba(54, 125, 149, 0.55);
          font-family: var(--font-agency), Georgia, serif;
          flex-shrink: 0;
        }
        .quote-body {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
          color: var(--ink);
          font-style: italic;
        }

        .screen-footer {
          display: flex;
          gap: 8px;
          padding-top: 4px;
        }
        .footer-btn {
          padding: 12px 14px;
          border-radius: 10px;
          font-family: var(--font-moderniz), 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 120ms ease, background 160ms ease, box-shadow 160ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .footer-btn:active { transform: translateY(1px) scale(0.98); }

        .footer-reroll {
          flex: 0 0 auto;
          background: linear-gradient(180deg, #FFFEF7 0%, #F1ECDA 100%);
          border: 1px solid rgba(232, 85, 68, 0.35);
          color: #A53A2E;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.7) inset,
            0 4px 8px -2px rgba(232, 85, 68, 0.20);
        }
        .footer-reroll:hover {
          background: linear-gradient(180deg, #FFFFFF 0%, #FFEDE5 100%);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.8) inset,
            0 6px 12px -2px rgba(232, 85, 68, 0.30);
        }
        .reroll-icon {
          font-size: 16px;
          display: inline-block;
          transition: transform 220ms ease;
        }
        .footer-reroll:hover .reroll-icon { transform: rotate(-12deg) scale(1.08); }
        .reroll-label { font-weight: 700; }

        .footer-primary {
          flex: 1 1 auto;
          background: linear-gradient(180deg, #FF7A6B 0%, #E85544 100%);
          border: 1px solid rgba(232, 85, 68, 0.6);
          color: #fff;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.4) inset,
            0 6px 12px -2px rgba(232, 85, 68, 0.40);
        }
        .footer-primary:hover:not(:disabled) {
          background: linear-gradient(180deg, #FF8B7E 0%, #FF6B5C 100%);
        }
        .footer-primary:disabled {
          background: linear-gradient(180deg, #d0c8b8 0%, #b8b0a0 100%);
          border-color: rgba(22, 39, 44, 0.18);
          color: rgba(255, 255, 255, 0.7);
          cursor: not-allowed;
          box-shadow: none;
        }

        @keyframes roll-flash {
          0%   { transform: scale(1);    filter: brightness(1); }
          25%  { transform: scale(1.02); filter: brightness(1.08); }
          100% { transform: scale(1);    filter: brightness(1); }
        }
        @keyframes sprite-pull {
          0%   { transform: scale(1);    filter: brightness(1); }
          20%  { transform: scale(0.94); filter: brightness(1.15); }
          60%  { transform: scale(1.04); filter: brightness(1.05); }
          100% { transform: scale(1);    filter: brightness(1); }
        }
        @keyframes counter-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }

        /* Mobile compaction. The console aspect-ratio (1080/1680) makes the
           screen short on portrait viewports, so we have to claw back vertical
           space for the sprite hero. Concretely: name row gets its own line
           (otherwise the input shrinks to ~18px), zodiac glyph is hidden
           (redundant with the select), stats collapse to a single 4-col row
           (saves ~40px vs 2x2), and quote/footer paddings tighten. */
        /* Mobile compaction (≤479px). Screen height is constrained by the
           console's 1080/1680 aspect, so every block has to give a little:
           - Banner: name row gets its own line so the input doesn't shrink
             to ~18px; zodiac glyph is dropped (redundant with the select).
           - Stats collapse to a single 4-col row with shorter labels so a
             second row doesn't eat ~32px of vertical space.
           - Hero gets a min-height so the sprite stays visible even when
             everything else is laid out.
           - Quote trims to a single line + ellipsis. Footer paddings shrink.
         */
        @media (max-width: 479px) {
          .screen-grid { padding: 6px 8px; gap: 4px; font-size: 11px; }
          .screen-name { flex-basis: 100%; }
          .zodiac-glyph { display: none; }
          .screen-stats { grid-template-columns: repeat(4, 1fr); gap: 3px; }
          .screen-hero { min-height: 100px; padding: 2px 0; }
          .screen-quote { padding: 4px 8px; }
          .quote-mark { font-size: 16px; }
          .quote-body {
            font-size: 10px;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .footer-btn { padding: 8px 10px; font-size: 10px; }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="stat-cell">
      <div className="stat-row">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: pct + '%' }} />
      </div>
      <style jsx>{`
        .stat-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 4px 6px;
          background: rgba(255, 253, 243, 0.7);
          border: 1px solid rgba(22, 39, 44, 0.08);
          border-radius: 6px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stat-label {
          font-size: 8px;
          letter-spacing: 0.16em;
          font-weight: 700;
          color: var(--ink-muted);
        }
        .stat-value {
          font-size: 10px;
          font-weight: 700;
          color: var(--ink);
        }
        .stat-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(22, 39, 44, 0.08);
          overflow: hidden;
        }
        .stat-fill {
          height: 100%;
          background: linear-gradient(90deg, #367D95 0%, #90B34D 100%);
          border-radius: 2px;
          transition: width 220ms ease;
        }
        /* Mobile: tighter so 4-col stats fits "RESOLVE 67" without clipping. */
        @media (max-width: 479px) {
          .stat-cell { padding: 3px 4px; gap: 2px; }
          .stat-label { font-size: 7px; letter-spacing: 0.10em; }
          .stat-value { font-size: 9px; }
          .stat-track { height: 2px; }
        }
      `}</style>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
      <path d="M3 2 L10 6 L3 10 Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
      <rect x="3" y="2.5" width="2" height="7" fill="currentColor" rx="0.5" />
      <rect x="7" y="2.5" width="2" height="7" fill="currentColor" rx="0.5" />
    </svg>
  );
}
