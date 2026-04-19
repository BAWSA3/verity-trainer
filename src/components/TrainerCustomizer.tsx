'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrainerConfig } from '@/types/trainer';
import { CATEGORIES, INITIAL_CONFIG, isReadyToGenerate } from '@/lib/trainer-options';
import { playSelect, playGenerate } from '@/lib/sounds';
import SpriteCanvas from './SpriteCanvas';
import CategorySelector from './CategorySelector';
import SignupGate from './SignupGate';
import PokeBackground from './PokeBackground';

export default function TrainerCustomizer() {
  const router = useRouter();
  const [config, setConfig] = useState<TrainerConfig>(INITIAL_CONFIG);
  const [showSignup, setShowSignup] = useState(false);
  const [mounted, setMounted] = useState(false);
  const canGenerate = isReadyToGenerate(config);

  // Fade-in on mount (replaces boot screen)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function handleSelect(category: keyof TrainerConfig, id: string) {
    playSelect();
    setConfig((prev) => ({ ...prev, [category]: id }));
  }

  function handleGenerate() {
    if (!canGenerate) return;
    playGenerate();
    setShowSignup(true);
  }

  // Which required categories are still unpicked — used in helper text
  const missingLabels: string[] = [];
  if (!config.gender) missingLabels.push('gender');
  if (!config.body) missingLabels.push('skin');
  if (!config.hair) missingLabels.push('hair');
  if (!config.hairColor) missingLabels.push('hair color');
  if (!config.top) missingLabels.push('top');
  if (!config.bottom) missingLabels.push('bottom');
  if (!config.shoes || config.shoes === 'none') missingLabels.push('shoes');

  function handleSignupSuccess(id: string) {
    router.push(`/card/${id}`);
  }

  return (
    <div
      className="min-h-screen bg-[#fffdf3] text-[#333] relative"
      style={{
        fontFamily: 'var(--font-sora), sans-serif',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 400ms ease-out',
      }}
    >
      {/* Ambient Ghibli background */}
      <PokeBackground />

      {/* Header */}
      <div className="relative z-10 text-center pt-6 sm:pt-8 pb-3 sm:pb-4 px-4">
        <h1
          className="text-[#367d95] text-xl sm:text-3xl tracking-[0.2em]"
          style={{ fontFamily: 'var(--font-gerion), serif' }}
        >
          verity
        </h1>
        <p className="text-[#8a7d4d] text-[9px] sm:text-[11px] tracking-[0.2em] mt-1 uppercase">
          Design Your Trainer · Claim Your Capsule
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-12 lg:grid lg:grid-cols-[auto_1fr] lg:gap-8 lg:items-start">
        {/* Character Preview — sticky */}
        <div
          className="sticky top-0 z-20 bg-[#fffdf3]/90 backdrop-blur-sm
                     py-4 mb-2 lg:mb-0 lg:py-0 lg:top-6
                     flex justify-center"
        >
          <div className="relative">
            <SpriteCanvas config={config} size={384} />
            {/* Corner brackets in olive */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#90b34d]" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#90b34d]" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#90b34d]" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#90b34d]" />
          </div>
        </div>

        {/* Right column: Traits + CTA */}
        <div className="min-w-0">
          {/* Category Selectors */}
          <div
            className="border border-[#90b34d]/30 p-4 sm:p-5 mb-6 rounded-[24px] backdrop-blur-sm"
            style={{ background: 'rgba(255, 253, 243, 0.7)' }}
          >
            <div
              className="text-[#367d95] text-[9px] sm:text-[10px] tracking-[0.2em] mb-4 uppercase"
              style={{ fontFamily: 'var(--font-loos)', fontWeight: 700 }}
            >
              Select Your Gear
            </div>
            {CATEGORIES.filter(
              (cat) => !(cat.key === 'facialHair' && config.gender === 'female'),
            ).map((cat) => (
              <CategorySelector
                key={cat.key}
                label={cat.label}
                categoryKey={cat.key}
                options={cat.options}
                selected={config[cat.key]}
                onSelect={(id) => handleSelect(cat.key, id)}
                gender={config.gender || 'male'}
                currentSkin={config.body || 'medium'}
                currentHairStyle={config.hair || 'buzz'}
                currentHairColor={config.hairColor || 'black'}
              />
            ))}
          </div>

          {/* Generate Button — disabled until all required slots filled */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            aria-disabled={!canGenerate}
            className="w-full py-4 sm:py-[20px] rounded-[40px]
                       text-white text-sm sm:text-[20px] tracking-wider
                       transition-all
                       enabled:hover:scale-[1.01]
                       enabled:shadow-[0_10px_30px_-10px_rgba(54,125,149,0.5)]
                       enabled:hover:shadow-[0_15px_40px_-10px_rgba(54,125,149,0.7)]
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
            style={{
              fontFamily: 'var(--font-sora)',
              fontWeight: 700,
              background:
                'linear-gradient(134.68deg, rgb(144,179,77) 28%, rgb(54,125,149) 77%, rgb(22,39,44) 100%)',
            }}
          >
            Generate My Card
          </button>

          <p className="text-center text-[#8a7d4d] text-[10px] sm:text-[11px] mt-3 tracking-wider">
            {canGenerate
              ? 'Claim your spot before the drop'
              : `Pick ${missingLabels.join(', ')} to generate your card`}
          </p>
        </div>
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <SignupGate
          config={config}
          onSuccess={handleSignupSuccess}
          onClose={() => setShowSignup(false)}
        />
      )}
    </div>
  );
}
