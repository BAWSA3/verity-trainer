'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrainerConfig } from '@/types/trainer';
import { CATEGORIES, DEFAULT_CONFIG } from '@/lib/trainer-options';
import { playSelect, playGenerate } from '@/lib/sounds';
import SpriteCanvas from './SpriteCanvas';
import CategorySelector from './CategorySelector';
import SignupGate from './SignupGate';

export default function TrainerCustomizer() {
  const router = useRouter();
  const [config, setConfig] = useState<TrainerConfig>(DEFAULT_CONFIG);
  const [showSignup, setShowSignup] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);

  // Boot sequence animation
  useEffect(() => {
    const lines = [
      '> VERITY OS v1.0.0',
      '> INITIALIZING TRAINER SYSTEM...',
      '> LOADING STREETWEAR DATABASE...',
      '> SPRITE ENGINE: ONLINE',
      '> CARD GENERATOR: READY',
      '> SYSTEM STATUS: OPERATIONAL',
      '',
      '> PRESS START TO BEGIN',
    ];

    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i > lines.length) {
        clearInterval(interval);
        setTimeout(() => setHeroReady(true), 400);
        return;
      }
      setBootLines(lines.slice(0, i));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  function handleSelect(category: keyof TrainerConfig, id: string) {
    playSelect();
    setConfig(prev => ({ ...prev, [category]: id }));
  }

  function handleGenerate() {
    playGenerate();
    setShowSignup(true);
  }

  function handleSignupSuccess(id: string) {
    router.push(`/card/${id}`);
  }

  // Hero / Landing Screen
  if (showHero) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-[#39FF14] text-2xl sm:text-3xl tracking-[0.3em] mb-3">
            VERITY
          </h1>
          <div className="text-[#FF006E] text-[10px] sm:text-xs tracking-widest">
            TRAINER CREATOR
          </div>
        </div>

        {/* Boot terminal */}
        <div className="border-2 border-[#222] bg-[#0a0a0a] p-4 sm:p-6 max-w-md w-full mb-8">
          <div className="space-y-1">
            {bootLines.map((line, i) => {
              const safeLine = line ?? '';
              return (
                <div
                  key={i}
                  className={`text-[9px] sm:text-[10px] font-mono ${
                    safeLine.startsWith('> PRESS') ? 'text-[#FF006E]' : 'text-[#39FF14]'
                  }`}
                  style={{ opacity: safeLine === '' ? 0 : 1 }}
                >
                  {safeLine}
                  {i === bootLines.length - 1 && (
                    <span className="animate-blink">_</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        {heroReady && (
          <button
            onClick={() => {
              playSelect();
              setShowHero(false);
            }}
            className="border-2 border-[#FF006E] bg-[#FF006E]/10 text-[#FF006E]
                       text-xs sm:text-sm py-3 px-8 tracking-wider
                       hover:bg-[#FF006E]/20 transition-all
                       animate-pulse"
          >
            [ START ]
          </button>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[#333] text-[7px] sm:text-[8px] tracking-wider">
            DESIGN YOUR TRAINER // CLAIM YOUR CARD // JOIN THE DROP
          </p>
          <p className="text-[#222] text-[7px] mt-2">
            VERITY MARKETPLACE — MAY 2026
          </p>
        </div>
      </div>
    );
  }

  // Main Customizer
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="text-center pt-6 sm:pt-8 pb-3 sm:pb-4 px-4">
        <h1 className="text-[#39FF14] text-base sm:text-lg tracking-widest mb-1">
          VERITY
        </h1>
        <p className="text-[#666] text-[8px] sm:text-[10px] tracking-wider">
          DESIGN YOUR TRAINER // CLAIM YOUR CARD
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Character Preview */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative">
            <SpriteCanvas config={config} size={384} />
            {/* Corner decorations */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#39FF14]" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#39FF14]" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#39FF14]" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#39FF14]" />
          </div>
        </div>

        {/* Category Selectors */}
        <div className="border-2 border-[#222] p-3 sm:p-4 mb-6">
          <div className="text-[#39FF14] text-[8px] sm:text-[9px] tracking-wider mb-3 sm:mb-4 opacity-60">
            {'// SELECT YOUR GEAR'}
          </div>
          {CATEGORIES.map(cat => (
            <CategorySelector
              key={cat.key}
              label={cat.label}
              categoryKey={cat.key}
              options={cat.options}
              selected={config[cat.key]}
              onSelect={(id) => handleSelect(cat.key, id)}
              gender={config.gender}
              currentSkin={config.body}
            />
          ))}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full border-2 border-[#FF006E] bg-[#FF006E]/10 text-[#FF006E]
                     text-xs sm:text-sm py-4 hover:bg-[#FF006E]/20 transition-all
                     tracking-wider hover:shadow-[0_0_20px_rgba(255,0,110,0.3)]"
        >
          [ GENERATE MY CARD ]
        </button>

        <p className="text-center text-[#333] text-[7px] sm:text-[8px] mt-3">
          GET EARLY ACCESS TO THE VERITY MARKETPLACE
        </p>
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
