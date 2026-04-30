'use client';

// CustomizerWindow — wraps the existing CategoryTabs + CategorySelector +
// PersonalityPanel into a wide pixel-window slot. Reuses every existing
// component from src/components/{CategoryTabs,CategorySelector,PersonalityPanel}.

import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { CATEGORIES } from '@/lib/trainer-options';
import CategorySelector from '@/components/CategorySelector';
import CategoryTabs, { type TabKey } from '@/components/CategoryTabs';
import PersonalityPanel from '@/components/PersonalityPanel';
import PixelWindow from './PixelWindow';

const TAB_CATEGORIES: Record<Exclude<TabKey, 'vibe'>, Array<keyof TrainerConfig>> = {
  body:  ['body', 'hair', 'hairColor', 'eyes'],
  wear:  ['outfit', 'accessory'],
  face:  [],
  extra: [],
};

interface CustomizerWindowProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  onConfigChange: (next: TrainerConfig) => void;
  onPersonalityChange: (next: TrainerPersonality) => void;
  activeTab: TabKey;
  onTabChange: (next: TabKey) => void;
  canGenerate: boolean;
  missingLabels: string[];
  onGenerate: () => void;
  aiContext?: { reasoning: string };
  onRegenerate?: () => void;
}

export default function CustomizerWindow({
  config, personality, onConfigChange, onPersonalityChange,
  activeTab, onTabChange,
  canGenerate, missingLabels, onGenerate,
  aiContext, onRegenerate,
}: CustomizerWindowProps) {
  const unfilledByTab: Partial<Record<TabKey, boolean>> = {
    body: ['body', 'hair', 'hairColor'].some((k) => !config[k as keyof TrainerConfig]),
    wear: !config.outfit,
  };

  const activeKeys = activeTab === 'vibe' ? [] : TAB_CATEGORIES[activeTab];
  const visibleCategories = CATEGORIES.filter((c) => activeKeys.includes(c.key));

  function handleSelect(category: keyof TrainerConfig, id: string) {
    onConfigChange({ ...config, [category]: id });
  }

  return (
    <PixelWindow title="CUSTOMIZE" accent="dark" bg="cream" bodyPad="md">
      <CategoryTabs active={activeTab} onChange={onTabChange} unfilled={unfilledByTab} />

      <div className="pt-4 min-h-[220px]">
        {activeTab === 'vibe' ? (
          <PersonalityPanel value={personality} onChange={onPersonalityChange} />
        ) : (
          <>
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
            {visibleCategories.length === 0 && (
              <p className="text-[#8a7d4d] text-[12px] tracking-wider">
                Use the VIBE tab for zodiac + likes/dislikes.
              </p>
            )}
          </>
        )}
      </div>

      {aiContext?.reasoning && (
        <div className="mt-4 p-3 rounded border border-[#367d95]/30 bg-[#367d95]/5">
          <p
            className="text-[9px] tracking-[0.15em] uppercase text-[#367d95] font-bold mb-1.5"
            style={{ fontFamily: 'var(--font-loos), sans-serif' }}
          >
            Why this trainer
          </p>
          <p className="text-[12px] leading-relaxed text-[#16272c]">
            {aiContext.reasoning}
          </p>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-[#16272c]/15 flex gap-2">
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="px-4 py-3 rounded-[2px] border-2 border-[#16272c] text-[#16272c] text-[10px] tracking-[0.18em] uppercase transition-all hover:bg-[#16272c] hover:text-white"
            style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
            title="Re-roll the AI's choices"
          >
            🎲 Re-roll
          </button>
        )}
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          aria-disabled={!canGenerate}
          className="flex-1 py-3 rounded-[2px] text-white text-[12px] tracking-[0.18em] uppercase transition-all enabled:hover:scale-[1.005] enabled:shadow-[0_8px_20px_-8px_rgba(54,125,149,0.55)] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale border-2 border-[#16272c]"
          style={{
            fontFamily: 'var(--font-loos), sans-serif',
            fontWeight: 700,
            background: 'linear-gradient(134.68deg, rgb(144,179,77) 28%, rgb(54,125,149) 77%, rgb(22,39,44) 100%)',
          }}
        >
          {aiContext ? '▶ Claim Trainer' : '▶ Generate My Trainer'}
        </button>
      </div>
      <p
        className="text-center text-[#8a7d4d] text-[9px] sm:text-[10px] mt-2 tracking-[0.18em] uppercase"
        style={{ fontFamily: 'var(--font-loos), sans-serif' }}
      >
        {canGenerate
          ? aiContext
            ? 'Tweak above or claim as-is'
            : 'Claim before the drop'
          : `Pick ${missingLabels.join(', ')} to claim`}
      </p>
    </PixelWindow>
  );
}
