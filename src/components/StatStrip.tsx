'use client';

import type { TrainerStats } from '@/lib/card-utils';

interface Props {
  stats: TrainerStats;
  /** Compact = horizontal narrow strip (left rail). Default = full vertical bars. */
  variant?: 'compact' | 'full';
}

const ROWS: { key: keyof TrainerStats; label: string }[] = [
  { key: 'style',    label: 'Style' },
  { key: 'charisma', label: 'Charisma' },
  { key: 'street',   label: 'Street' },
  { key: 'luck',     label: 'Luck' },
];

const SEGMENTS = 10;

export default function StatStrip({ stats, variant = 'full' }: Props) {
  return (
    <div
      className={variant === 'compact' ? 'space-y-1.5' : 'space-y-2'}
      style={{ fontFamily: 'var(--font-loos), sans-serif' }}
    >
      {ROWS.map(({ key, label }) => {
        const value = stats[key];
        const filled = Math.round((value / 100) * SEGMENTS);
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={`text-[#367d95] tracking-[0.2em] uppercase font-bold ${
                variant === 'compact' ? 'text-[8px] w-[58px]' : 'text-[10px] w-[68px]'
              }`}
            >
              {label}
            </span>
            <div
              className="flex gap-[2px] flex-1 max-w-[140px]"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-label={`${label} ${value}/100`}
            >
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span
                  key={i}
                  className={`flex-1 h-2 rounded-[1.5px] ${
                    i < filled ? 'bg-[#90b34d]' : 'bg-[#16272c]/15'
                  }`}
                />
              ))}
            </div>
            <span className={`text-[#16272c] tabular-nums ${variant === 'compact' ? 'text-[10px]' : 'text-[12px]'}`}>
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
