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

// Which trait keys live under which tab. VIBE renders PersonalityPanel
// (no trait categories) and is handled inline below.
const TAB_CATEGORIES: Record<Exclude<TabKey, 'vibe'>, Array<keyof TrainerConfig>> = {
  body:  ['gender', 'body', 'hair', 'hairColor'],
  wear:  ['top', 'bottom', 'shoes', 'outerwear'],
  face:  ['expression', 'glasses'],
  extra: ['hat'],
};

export default function TrainerCustomizer() {
  const router = useRouter();
  const [config, setConfig] = useState<TrainerConfig>(INITIAL_CONFIG);
  const [personality, setPersonality] = useState<TrainerPersonality>(INITIAL_PERSONALITY);
  const [activeTab, setActiveTab] = useState<TabKey>('body');
  const [showSignup, setShowSignup] = useState(false);
  const [mounted, setMounted] = useState(false);

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
  if (!config.gender) missingLabels.push('gender');
  if (!config.body) missingLabels.push('skin');
  if (!config.hair) missingLabels.push('hair');
  if (!config.hairColor) missingLabels.push('hair color');
  if (!config.top) missingLabels.push('top');
  if (!config.bottom) missingLabels.push('bottom');
  if (!config.shoes || config.shoes === 'none') missingLabels.push('shoes');

  // Show a red dot on tabs that still have unfilled required slots.
  const unfilledByTab: Partial<Record<TabKey, boolean>> = {
    body: ['gender', 'body', 'hair', 'hairColor'].some((k) => !config[k as keyof TrainerConfig]),
    wear: ['top', 'bottom', 'shoes'].some((k) => !config[k as keyof TrainerConfig] || config[k as keyof TrainerConfig] === 'none'),
  };

  // Build category list for the active tab.
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
            {/* Left rail — sticky preview + stats */}
            <div className="border-b lg:border-b-0 lg:border-r border-[#16272c]/15 p-4 sm:p-5 bg-[#fffdf3]">
              <div className="lg:sticky lg:top-4 flex flex-col items-center gap-4">
                <div className="relative">
                  <TrainerSprite config={config} size={256} />
                  {/* corner brackets */}
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

            {/* Right column — tabs + categories + generate */}
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
                        gender={config.gender || 'm'}
                        currentSkin={config.body || ''}
                        currentHairStyle={config.hair || ''}
                        currentHairColor={config.hairColor || 'black'}
                      />
                    ))}
                    {visibleCategories.length === 0 && (
                      <p className="text-[#8a7d4d] text-[12px] tracking-wider">
                        No options yet — Limezu pack import is pending.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-[#16272c]/15">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  aria-disabled={!canGenerate}
                  className="w-full py-3.5 rounded-[40px] text-white text-[14px] tracking-[0.15em] uppercase transition-all
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
                  ▶ Generate My Trainer
                </button>
                <p className="text-center text-[#8a7d4d] text-[10px] sm:text-[11px] mt-3 tracking-[0.15em] uppercase">
                  {canGenerate
                    ? 'Claim your spot before the drop'
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
