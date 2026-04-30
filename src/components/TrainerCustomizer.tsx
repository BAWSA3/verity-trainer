'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { CATEGORIES, INITIAL_CONFIG, isReadyToGenerate } from '@/lib/trainer-options';
import { generateStats } from '@/lib/card-utils';
import { playSelect, playGenerate } from '@/lib/sounds';
import TrainerSprite from './TrainerSprite';
import CategorySelector from './CategorySelector';
import CategoryTabs, { type TabKey } from './CategoryTabs';
import PersonalityPanel from './PersonalityPanel';
import StatStrip from './StatStrip';
import SignupGate from './SignupGate';
import TrainerWindow from './TrainerWindow';
import PokeBackground from './PokeBackground';

const INITIAL_PERSONALITY: TrainerPersonality = {
  zodiac: '',
  likes: [],
  dislikes: [],
};

// LimeZu has 6 trait slots; we group them into 3 tabs + VIBE for personality.
const TAB_CATEGORIES: Record<Exclude<TabKey, 'vibe'>, Array<keyof TrainerConfig>> = {
  body:  ['body', 'hair', 'hairColor', 'eyes'],
  wear:  ['outfit', 'accessory'],
  face:  [],
  extra: [],
};

interface TrainerCustomizerProps {
  initialConfig?: TrainerConfig;
  initialPersonality?: TrainerPersonality;
  aiContext?: { reasoning: string };
  onRegenerate?: () => void;
}

export default function TrainerCustomizer({
  initialConfig,
  initialPersonality,
  aiContext,
  onRegenerate,
}: TrainerCustomizerProps = {}) {
  const router = useRouter();
  const [config, setConfig] = useState<TrainerConfig>(initialConfig ?? INITIAL_CONFIG);
  const [personality, setPersonality] = useState<TrainerPersonality>(initialPersonality ?? INITIAL_PERSONALITY);
  const [activeTab, setActiveTab] = useState<TabKey>('body');
  const [showSignup, setShowSignup] = useState(false);
  const [mounted, setMounted] = useState(false);

  // When AI props change (e.g. after a re-roll), sync state.
  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);
  useEffect(() => {
    if (initialPersonality) setPersonality(initialPersonality);
  }, [initialPersonality]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const canGenerate = isReadyToGenerate(config);
  const stats = useMemo(() => generateStats(config, personality), [config, personality]);

  function handleSelect(category: keyof TrainerConfig, id: string) {
    playSelect();
    setConfig((prev) => ({ ...prev, [category]: id }));
  }

  function handleGenerate() {
    if (!canGenerate) return;
    playGenerate();
    setShowSignup(true);
  }

  function handleSignupSuccess(id: string) {
    router.push(`/card/${id}`);
  }

  // Helper text — list missing required slots in friendly labels.
  const missingLabels: string[] = [];
  if (!config.body)      missingLabels.push('skin');
  if (!config.hair)      missingLabels.push('hair');
  if (!config.hairColor) missingLabels.push('hair color');
  if (!config.outfit)    missingLabels.push('outfit');

  // Show a red dot on tabs that still have unfilled required slots.
  // Only body/hair/hairColor/outfit are required; eyes/accessory default to 'none'.
  const unfilledByTab: Partial<Record<TabKey, boolean>> = {
    body: ['body', 'hair', 'hairColor'].some((k) => !config[k as keyof TrainerConfig]),
    wear: !config.outfit,
  };

  const activeKeys = activeTab === 'vibe' ? [] : TAB_CATEGORIES[activeTab];
  const visibleCategories = CATEGORIES.filter((c) => activeKeys.includes(c.key));

  return (
    <div
      className="min-h-screen bg-[#fffdf3] text-[#333] relative"
      style={{
        fontFamily: 'var(--font-sora), sans-serif',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 400ms ease-out',
      }}
    >
      <PokeBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <TrainerWindow
          title="TRAINER.EXE — verity character creator"
          onClose={() => router.push('/')}
        >
          <div className="lg:grid lg:grid-cols-[320px_1fr]">
            <div className="border-b lg:border-b-0 lg:border-r border-[#16272c]/15 p-4 sm:p-5 bg-[#fffdf3]">
              <div className="lg:sticky lg:top-4 flex flex-col items-center gap-4">
                <div className="relative">
                  <TrainerSprite config={config} size={256} />
                  <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-[#90b34d]" />
                  <div className="absolute -top-2 -right-2 w-3 h-3 border-t-2 border-r-2 border-[#90b34d]" />
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b-2 border-l-2 border-[#90b34d]" />
                  <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-[#90b34d]" />
                </div>
                <div className="w-full max-w-[260px]">
                  <StatStrip stats={stats} variant="compact" />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 min-w-0">
              <CategoryTabs active={activeTab} onChange={setActiveTab} unfilled={unfilledByTab} />

              <div className="pt-5 min-h-[260px]">
                {activeTab === 'vibe' ? (
                  <PersonalityPanel value={personality} onChange={setPersonality} />
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
                        currentHairStyle={config.hair || 'bob1'}
                        currentHairColor={config.hairColor || 'v00'}
                      />
                    ))}
                    {visibleCategories.length === 0 && (
                      <p className="text-[#8a7d4d] text-[12px] tracking-wider">
                        No options for this tab yet.
                      </p>
                    )}
                  </>
                )}
              </div>

              {aiContext?.reasoning && (
                <div className="mt-5 p-3 rounded border border-[#367d95]/30 bg-[#367d95]/5">
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[#367d95] font-bold mb-1.5">
                    Why this trainer
                  </p>
                  <p className="text-[12px] leading-relaxed text-[#16272c]">
                    {aiContext.reasoning}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-[#16272c]/15">
                <div className="flex gap-2">
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      type="button"
                      className="px-4 py-3.5 rounded-[40px] border-2 border-[#16272c] text-[#16272c] text-[12px] tracking-[0.15em] uppercase transition-all hover:bg-[#16272c] hover:text-white"
                      style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
                      title="Re-roll the AI's choices"
                    >
                      🎲 Re-roll
                    </button>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    aria-disabled={!canGenerate}
                    className="flex-1 py-3.5 rounded-[40px] text-white text-[14px] tracking-[0.15em] uppercase transition-all
                               enabled:hover:scale-[1.01]
                               enabled:shadow-[0_10px_30px_-10px_rgba(54,125,149,0.5)]
                               enabled:hover:shadow-[0_15px_40px_-10px_rgba(54,125,149,0.7)]
                               disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
                    style={{
                      fontFamily: 'var(--font-loos), sans-serif',
                      fontWeight: 700,
                      background:
                        'linear-gradient(134.68deg, rgb(144,179,77) 28%, rgb(54,125,149) 77%, rgb(22,39,44) 100%)',
                    }}
                  >
                    {aiContext ? '▶ Looks good — claim it' : '▶ Generate My Trainer'}
                  </button>
                </div>
                <p className="text-center text-[#8a7d4d] text-[10px] sm:text-[11px] mt-3 tracking-[0.15em] uppercase">
                  {canGenerate
                    ? aiContext
                      ? 'Tweak any layer above, or claim as-is'
                      : 'Claim your spot before the drop'
                    : `Pick ${missingLabels.join(', ')} to generate`}
                </p>
              </div>
            </div>
          </div>
        </TrainerWindow>
      </div>

      {showSignup && (
        <SignupGate
          config={config}
          personality={personality}
          onSuccess={handleSignupSuccess}
          onClose={() => setShowSignup(false)}
        />
      )}
    </div>
  );
}
