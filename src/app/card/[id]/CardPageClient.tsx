'use client';

import { useState, useEffect } from 'react';
import { TrainerConfig } from '@/types/trainer';
import { playSuccess } from '@/lib/sounds';
import TrainerCard from '@/components/TrainerCard';
import ShareButtons from '@/components/ShareButtons';

interface CardPageClientProps {
  id: string;
  config: TrainerConfig;
  trainerName: string;
}

export default function CardPageClient({ id, config, trainerName }: CardPageClientProps) {
  const [revealed, setRevealed] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    // Reveal animation sequence
    const t1 = setTimeout(() => {
      setRevealed(true);
      playSuccess();
    }, 600);
    const t2 = setTimeout(() => setShowCard(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-[#39FF14] text-lg tracking-widest mb-2">
          VERITY
        </h1>
        {!revealed ? (
          <p className="text-[#FF006E] text-[10px] tracking-wider animate-pulse">
            GENERATING TRAINER CARD...
          </p>
        ) : (
          <p className="text-[#666] text-[9px] tracking-wider">
            TRAINER CARD GENERATED
          </p>
        )}
      </div>

      {/* Card with reveal animation */}
      <div
        className={`transition-all duration-700 ${
          showCard
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <TrainerCard config={config} trainerName={trainerName} />
      </div>

      {/* Share buttons */}
      <div
        className={`max-w-lg w-full transition-all duration-500 delay-300 ${
          showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <ShareButtons cardId={id} trainerName={trainerName} />
      </div>

      {/* CTA */}
      <div
        className={`mt-8 text-center transition-all duration-500 delay-500 ${
          showCard ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <a
          href="/"
          className="text-[#FF006E] text-[10px] hover:text-[#39FF14] transition-colors"
        >
          {'<'} CREATE ANOTHER TRAINER
        </a>
      </div>
    </div>
  );
}
