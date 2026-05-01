'use client';

// ConsoleScreen — the entire interactive surface that lives inside the
// Console's screen cutout. Header (name, zodiac, level, music toggle), stat
// strip, trainer hero, 2 tabs (BODY/WEAR), scrolling selector body, and a
// sticky footer with Re-roll + Claim CTAs. AI-generated abilities + knownFor
// are read-only and surface on the share card after claim.

import { useEffect } from 'react';
import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import { ZODIAC_GLYPHS, ZODIAC_OPTIONS } from '@/lib/personality';
import { generateStats, STAT_LABELS, type TrainerStats } from '@/lib/card-utils';
import { CATEGORIES } from '@/lib/trainer-options';
import TrainerSprite from '@/components/TrainerSprite';
import CategoryTabs, { type TabKey } from '@/components/CategoryTabs';
import CategorySelector from '@/components/CategorySelector';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePressState } from '@/components/device/ConsolePressState';

const TAB_CATEGORIES: Record<TabKey, Array<keyof TrainerConfig>> = {
  body: ['body', 'hair', 'hairColor', 'eyes'],
  wear: ['outfit', 'accessory'],
};

const TAB_ORDER: TabKey[] = ['body', 'wear'];

interface ConsoleScreenProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  activeTab: TabKey;
  shownLikes: boolean[];
  shownDislikes: boolean[];
  canGenerate: boolean;
  missingLabels: string[];
  hasAi: boolean;
  onConfigChange: (next: TrainerConfig) => void;
  onPersonalityChange: (next: TrainerPersonality) => void;
  onTabChange: (next: TabKey) => void;
  onNameChange: (next: string) => void;
  onZodiacChange: (next: Zodiac | '') => void;
  onToggleShownLike: (i: number) => void;
  onToggleShownDislike: (i: number) => void;
  onGenerate: () => void;
  onRegenerate?: () => void;
}

export default function ConsoleScreen({
  config, personality, trainerName, activeTab,
  shownLikes, shownDislikes,
  canGenerate, missingLabels, hasAi,
  onConfigChange, onPersonalityChange, onTabChange,
  onNameChange, onZodiacChange,
  onToggleShownLike, onToggleShownDislike,
  onGenerate, onRegenerate,
}: ConsoleScreenProps) {
  const audio = useAudioPlayer();
  const { pulse } = usePressState();

  // Status LEDs — green pulses subtly while sprite is mounted; coral pulses
  // when AI generated this trainer; azure pulses while audio is playing.
  useEffect(() => {
    pulse('ledGreen', 600);
  }, [config, pulse]);
  useEffect(() => {
    if (audio.isPlaying) pulse('ledAzure', 600);
  }, [audio.isPlaying, pulse]);

  function handleTabChange(next: TabKey) {
    const cur = TAB_ORDER.indexOf(activeTab);
    const nxt = TAB_ORDER.indexOf(next);
    if (nxt > cur) pulse('dpadR');
    else if (nxt < cur) pulse('dpadL');
    pulse('btnY');
    onTabChange(next);
  }

  function handleClaim() {
    if (!canGenerate) return;
    pulse('btnA', 280);
    onGenerate();
  }

  function handleRegenerate() {
    if (!onRegenerate) return;
    pulse('btnB', 280);
    pulse('ledCoral', 600);
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

  const unfilledByTab: Partial<Record<TabKey, boolean>> = {
    body: ['body', 'hair', 'hairColor'].some((k) => !config[k as keyof TrainerConfig]),
    wear: !config.outfit,
  };

  const activeKeys = TAB_CATEGORIES[activeTab];
  const visibleCategories = CATEGORIES.filter((c) => activeKeys.includes(c.key));

  function handleSelect(category: keyof TrainerConfig, id: string) {
    onConfigChange({ ...config, [category]: id });
  }

  return (
    <div className="screen-grid">
      {/* Header strip — name + zodiac + level */}
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
      <div className="screen-stats">
        {(Object.keys(STAT_LABELS) as Array<keyof TrainerStats>).map((k) => (
          <Stat key={k} label={STAT_LABELS[k]} value={stats[k]} />
        ))}
      </div>

      {/* Trainer hero — size responsive via wrapper */}
      <div className="screen-hero">
        <div className="hero-floor" aria-hidden />
        <div className="hero-sprite-wrap">
          <TrainerSprite config={config} size={220} />
        </div>
      </div>

      {/* Tabs row */}
      <div className="screen-tabs">
        <CategoryTabs active={activeTab} onChange={handleTabChange} unfilled={unfilledByTab} />
      </div>

      {/* Selector body — scrolls internally */}
      <div className="screen-body">
        {visibleCategories.map((cat) => (
          <CategorySelector
            key={cat.key}
            label={cat.label}
            categoryKey={cat.key}
            options={cat.options}
            selected={config[cat.key] ?? ''}
            onSelect={(id) => handleSelect(cat.key, id)}
            currentBody={config.body || ''}
            currentHairStyle={config.hair || '01'}
            currentHairColor={config.hairColor || '01'}
          />
        ))}
      </div>

      {/* Sticky footer — Re-roll + Claim */}
      <div className="screen-footer">
        {onRegenerate && (
          <button
            type="button"
            onClick={handleRegenerate}
            className="footer-btn footer-secondary"
            aria-label="Re-roll the AI's choices"
            title="Re-roll"
          >
            <span aria-hidden style={{ fontSize: 13 }}>🎲</span>
            <span>Re-roll</span>
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
          gap: 6px;
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
        }
        @media (min-width: 1024px) {
          .screen-stats { grid-template-columns: repeat(4, 1fr); }
        }
        .screen-stats > :global(.stat-cell) {
          min-width: 0;
        }

        .screen-hero {
          position: relative;
          display: grid;
          place-items: center;
          background:
            radial-gradient(ellipse 70% 35% at 50% 95%, rgba(67, 56, 202, 0.1) 0%, transparent 70%),
            transparent;
          border-radius: 8px;
          padding: 6px 0;
          flex: 0 0 260px;
          overflow: hidden;
        }
        .hero-sprite-wrap {
          position: relative;
          width: 132px;
          height: 264px;
          flex-shrink: 0;
        }
        .hero-sprite-wrap > :global(*) {
          position: absolute;
          top: 0;
          left: 0;
          transform: scale(0.6);
          transform-origin: top left;
        }
        @media (max-width: 479px) {
          .screen-hero { flex: 0 0 180px; }
          .hero-sprite-wrap {
            width: 88px;
            height: 176px;
          }
          .hero-sprite-wrap > :global(*) {
            transform: scale(0.4);
          }
        }
        @media (min-width: 1280px) {
          .screen-hero { flex: 0 0 300px; }
          .hero-sprite-wrap {
            width: 154px;
            height: 308px;
          }
          .hero-sprite-wrap > :global(*) {
            transform: scale(0.7);
          }
        }
        .hero-floor {
          position: absolute;
          inset: auto 24px 18px 24px;
          height: 4px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(67, 56, 202, 0.18), transparent 70%);
        }

        .screen-tabs {
          padding: 0 2px;
        }

        .screen-body {
          flex: 1 1 0;
          overflow-y: auto;
          padding: 4px 2px 2px;
          min-height: 0;
        }

        .screen-footer {
          display: flex;
          gap: 6px;
          padding-top: 6px;
          border-top: 1px solid rgba(22, 39, 44, 0.10);
        }
        .footer-btn {
          flex: 1;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 120ms ease, background 160ms ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .footer-btn:active { transform: translateY(1px); }
        .footer-secondary {
          flex: 0 0 auto;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(22, 39, 44, 0.18);
          color: var(--ink);
        }
        .footer-secondary:hover { background: rgba(255, 255, 255, 0.95); }
        .footer-primary {
          background: linear-gradient(180deg, #FF7A6B 0%, #E85544 100%);
          border: 1px solid rgba(232, 85, 68, 0.6);
          color: #fff;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 4px 8px -2px rgba(232, 85, 68, 0.4);
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
          background: linear-gradient(90deg, #FF6B5C 0%, #FFCB9A 100%);
          border-radius: 2px;
          transition: width 220ms ease;
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
