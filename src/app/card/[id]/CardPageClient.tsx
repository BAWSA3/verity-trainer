'use client';

import { useState, useEffect } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { playSuccess } from '@/lib/sounds';
import TrainerCard from '@/components/TrainerCard';
import ShareButtons from '@/components/ShareButtons';
import PokeBackground from '@/components/PokeBackground';

interface CardPageClientProps {
  id: string;
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
}

export default function CardPageClient({
  id, config, personality, trainerName,
}: CardPageClientProps) {
  const [revealed, setRevealed] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => { setRevealed(true); playSuccess(); }, 600);
    const t2 = setTimeout(() => setShowCard(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#fffdf3] text-[#16272c] flex flex-col items-center justify-center p-4 relative"
      style={{ fontFamily: 'var(--font-sora), sans-serif' }}
    >
      <PokeBackground />

      <div className="relative z-10 flex flex-col items-center w-full">
        <div
          className="text-center mb-6"
          style={{ fontFamily: 'var(--font-loos), sans-serif' }}
        >
          <h1 className="text-[#367d95] text-[12px] tracking-[0.3em] uppercase font-bold mb-1">
            verity
          </h1>
          <p
            className={`text-[10px] tracking-[0.2em] uppercase ${
              revealed ? 'text-[#8a7d4d]' : 'text-[#90b34d] animate-pulse'
            }`}
          >
            {revealed ? 'Trainer card generated' : 'Generating trainer card…'}
          </p>
        </div>

        <div
          className={`transition-all duration-700 ${
            showCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <TrainerCard config={config} personality={personality} trainerName={trainerName} />
        </div>

        <div
          className={`max-w-lg w-full transition-all duration-500 delay-300 ${
            showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <ShareButtons cardId={id} trainerName={trainerName} />
        </div>

        <div
          className={`mt-8 text-center transition-all duration-500 delay-500 ${
            showCard ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ fontFamily: 'var(--font-loos), sans-serif' }}
        >
          <a
            href="/create"
            className="text-[#367d95] hover:text-[#16272c] transition-colors text-[10px] tracking-[0.2em] uppercase"
          >
            ‹ Create Another Trainer
          </a>
        </div>
      </div>
    </div>
  );
}
