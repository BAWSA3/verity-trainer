'use client';

// Small leaf windows for the trainer dashboard:
// - FullBodyWindow:   tall left-column portrait
// - HeadshotWindow:   bust crop
// - IdentityWindow:   name + zodiac + level + stats
// - LikesWindow:      ✓ LIKES bullet list
// - DislikesWindow:   ✕ DISLIKES bullet list
//
// All windows are "dumb" — TrainerDashboard owns the source-of-truth state
// and passes the slices each window needs.

import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import { ZODIAC_GLYPHS, ZODIAC_OPTIONS } from '@/lib/personality';
import { generateStats, type TrainerStats } from '@/lib/card-utils';
import TrainerSprite from '@/components/TrainerSprite';
import PixelWindow from './PixelWindow';

// ---------- FullBodyWindow ----------

export function FullBodyWindow({ config }: { config: TrainerConfig }) {
  return (
    <PixelWindow title="TRAINER" accent="teal" bg="cream-warm" bodyPad="lg">
      <div className="flex flex-col items-center justify-center min-h-[480px] relative">
        <div className="relative">
          <TrainerSprite config={config} size={272} />
          {/* Olive corner caps for visual flourish */}
          <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-[#90b34d]" />
          <div className="absolute -top-2 -right-2 w-3 h-3 border-t-2 border-r-2 border-[#90b34d]" />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b-2 border-l-2 border-[#90b34d]" />
          <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-[#90b34d]" />
        </div>
      </div>
    </PixelWindow>
  );
}

// ---------- HeadshotWindow ----------

export function HeadshotWindow({ config }: { config: TrainerConfig }) {
  return (
    <PixelWindow title="PORTRAIT" accent="olive" bg="cream" bodyPad="lg">
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="border-2 border-[#90b34d] p-1 bg-[#fffdf3]">
          <TrainerSprite config={config} size={196} crop="bust" />
        </div>
      </div>
    </PixelWindow>
  );
}

// ---------- IdentityWindow ----------

interface IdentityProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  onNameChange: (next: string) => void;
  onZodiacChange: (next: Zodiac | '') => void;
}

export function IdentityWindow({
  config, personality, trainerName, onNameChange, onZodiacChange,
}: IdentityProps) {
  const stats = generateStats(config, personality);
  const total = stats.style + stats.charisma + stats.street + stats.luck;
  const level = Math.max(1, Math.min(10, Math.floor(total / 40)));
  const glyph = personality.zodiac ? ZODIAC_GLYPHS[personality.zodiac] : '◯';

  return (
    <PixelWindow title="MEET THE TRAINER" accent="teal" bg="cream" bodyPad="md">
      <div className="space-y-2.5">
        {/* Row 1: name + level */}
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            value={trainerName}
            onChange={(e) => onNameChange(e.target.value.slice(0, 12))}
            placeholder="trainer name"
            maxLength={12}
            className="flex-1 px-2.5 py-1.5 bg-[#f5f1d6] border-2 border-[#16272c] text-[#16272c] text-[12px] tracking-[0.08em] uppercase rounded-[2px] focus:outline-none focus:border-[#367d95]"
            style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
          />
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#16272c] bg-[#90b34d]/15 rounded-[2px]"
            style={{ fontFamily: 'var(--font-loos), sans-serif' }}
          >
            <span className="text-[9px] tracking-[0.15em] uppercase text-[#367d95] font-bold">
              LV
            </span>
            <span className="text-[14px] text-[#16272c] font-bold tabular-nums">
              {level}
            </span>
            <span className="text-[#c94d4d] text-[11px]">♥</span>
          </div>
        </div>

        {/* Row 2: zodiac dropdown */}
        <div className="flex items-stretch gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-2.5 py-1.5 bg-[#f5f1d6] border-2 border-[#16272c] rounded-[2px]"
            style={{ fontFamily: 'var(--font-loos), sans-serif' }}
          >
            <select
              value={personality.zodiac}
              onChange={(e) => onZodiacChange(e.target.value as Zodiac | '')}
              className="bg-transparent text-[#16272c] text-[11px] tracking-[0.1em] uppercase outline-none w-full appearance-none"
              style={{ fontFamily: 'inherit', fontWeight: 700 }}
            >
              <option value="">— sign —</option>
              {ZODIAC_OPTIONS.map((z) => (
                <option key={z.id} value={z.id}>{z.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-center w-12 border-2 border-[#16272c] bg-[#367d95] text-[#fffdf3] text-[16px] rounded-[2px]">
            {glyph}
          </div>
        </div>

        {/* Row 3: stat strip */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <StatRow label="STYLE" value={stats.style} />
          <StatRow label="CHARISMA" value={stats.charisma} />
          <StatRow label="STREET" value={stats.street} />
          <StatRow label="LUCK" value={stats.luck} />
        </div>
      </div>
    </PixelWindow>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  const cells = 8;
  const filled = Math.round((value / 100) * cells);
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[8px] tracking-[0.15em] uppercase text-[#367d95] font-bold w-[52px] flex-shrink-0"
        style={{ fontFamily: 'var(--font-loos), sans-serif' }}
      >
        {label}
      </span>
      <div className="flex gap-[2px] flex-1">
        {Array.from({ length: cells }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2"
            style={{ background: i < filled ? '#90b34d' : 'rgba(22,39,44,0.15)' }}
          />
        ))}
      </div>
      <span className="text-[10px] text-[#16272c] tabular-nums w-[20px] text-right font-bold">
        {value}
      </span>
    </div>
  );
}

// ---------- LikesWindow + DislikesWindow ----------

export function LikesWindow({ items }: { items: string[] }) {
  return (
    <PixelWindow title="✓ LIKES" accent="olive" bg="cream" bodyPad="md">
      <ChipList items={items} accent="olive" placeholder="(no likes set)" />
    </PixelWindow>
  );
}

export function DislikesWindow({ items }: { items: string[] }) {
  return (
    <PixelWindow title="✕ DISLIKES" accent="dark" bg="cream" bodyPad="md">
      <ChipList items={items} accent="dark" placeholder="(no dislikes set)" />
    </PixelWindow>
  );
}

function ChipList({
  items, accent, placeholder,
}: { items: string[]; accent: 'olive' | 'dark'; placeholder: string }) {
  const dotColor = accent === 'olive' ? '#90b34d' : '#16272c';
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-[#8a7d4d] italic tracking-wide py-2">
        {placeholder}
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {items.map((label, i) => (
        <li
          key={`${label}-${i}`}
          className="flex items-baseline gap-2 text-[12px] text-[#16272c] leading-tight"
          style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
        >
          <span className="text-[10px] flex-shrink-0" style={{ color: dotColor }}>▪</span>
          <span className="tracking-[0.04em] break-words">{label}</span>
        </li>
      ))}
    </ul>
  );
}
