'use client';

import { playHover } from '@/lib/sounds';

export type TabKey = 'body' | 'wear' | 'vibe';

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: 'body', label: 'Body' },
  { key: 'wear', label: 'Wear' },
  { key: 'vibe', label: 'Vibe' },
];

interface Props {
  active: TabKey;
  onChange: (key: TabKey) => void;
  /** When set, an accent dot appears on tabs whose required slots are unfilled. */
  unfilled?: Partial<Record<TabKey, boolean>>;
}

export default function CategoryTabs({ active, onChange, unfilled }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Customizer sections"
      className="flex items-stretch gap-1 border-b border-[#16272c]/20 px-1"
      style={{ fontFamily: 'var(--font-loos), sans-serif' }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const showDot = unfilled?.[tab.key];
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            onMouseEnter={() => playHover()}
            className={`relative px-4 py-2.5 text-[10px] sm:text-[11px] tracking-[0.18em] uppercase transition-colors ${
              isActive
                ? 'text-[#16272c] font-bold border-b-2 border-[#90b34d] -mb-[1px]'
                : 'text-[#8a7d4d] hover:text-[#367d95]'
            }`}
          >
            {tab.label}
            {showDot && (
              <span
                aria-label="Required field unfilled"
                className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-[#c94d4d]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
