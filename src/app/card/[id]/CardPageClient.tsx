'use client';

import { useState, useEffect } from 'react';
import type { TrainerConfig, TrainerPersonality, TierKey } from '@/types/trainer';
import { playSuccess } from '@/lib/sounds';
import TrainerCardV5 from '@/components/card/TrainerCardV5';
import ShareButtons from '@/components/ShareButtons';
import { Button } from '@/components/ui';
import { resolveTier } from '@/lib/cards/v4-tokens';

interface CardPageClientProps {
  id: string;
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  reasoning?: string;
  xHandle?: string;
  /** Tier rolled at signup. Falls back to deterministic seed roll if absent. */
  tier?: TierKey;
}

export default function CardPageClient({
  id, config, personality, trainerName, xHandle, tier,
}: CardPageClientProps) {
  const [revealed, setRevealed] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => { setRevealed(true); playSuccess(); }, 600);
    const t2 = setTimeout(() => setShowCard(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const resolvedTier = resolveTier(tier, id);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 py-10">
      <div className="relative z-10 flex flex-col items-center w-full max-w-[640px]">
        <div className="text-center mb-6">
          <h1 className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase font-bold text-[color:var(--accent-coral)] mb-1.5">
            verity
          </h1>
          <p
            className={'text-[11px] tracking-[0.2em] uppercase font-semibold transition-colors ' +
              (revealed ? 'text-[color:var(--ink-soft)]' : 'text-[color:var(--accent-coral)] animate-pulse')}
          >
            {revealed ? 'Trainer card generated' : 'Generating trainer card…'}
          </p>
        </div>

        <div
          className={'w-full transition-all duration-700 ' +
            (showCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95')}
        >
          <TrainerCardV5
            tier={resolvedTier}
            config={config}
            personality={personality}
            trainerName={trainerName}
            cardId={id}
            xHandle={xHandle}
          />
        </div>

        <div
          className={'w-full transition-all duration-500 delay-300 ' +
            (showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}
        >
          <ShareButtons cardId={id} trainerName={trainerName} />
        </div>

        <div
          className={'mt-8 transition-all duration-500 delay-500 ' +
            (showCard ? 'opacity-100' : 'opacity-0')}
        >
          <Button href="/create" variant="ghost" size="md">
            Make your own →
          </Button>
        </div>
      </div>
    </main>
  );
}
