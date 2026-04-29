'use client';

import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { generateStats } from '@/lib/card-utils';
import { ZODIAC_GLYPHS } from '@/lib/personality';
import { sanitizeChipsForDisplay } from '@/lib/moderation/sanitize';
import TrainerSprite from './TrainerSprite';
import StatStrip from './StatStrip';
import TrainerWindow from './TrainerWindow';

interface TrainerCardProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
}

export default function TrainerCard({ config, personality, trainerName }: TrainerCardProps) {
  const stats = generateStats(config, personality);
  const safeLikes = sanitizeChipsForDisplay(personality.likes);
  const safeDislikes = sanitizeChipsForDisplay(personality.dislikes);
  const zodiacGlyph = personality.zodiac ? ZODIAC_GLYPHS[personality.zodiac] : null;

  return (
    <div id="trainer-card" className="max-w-md w-full">
      <TrainerWindow title="TRAINER CARD — verity">
        <div className="bg-[#fffdf3] p-5 sm:p-6">
          {/* Top — bust + name + stats */}
          <div className="flex gap-5 items-start">
            <div className="relative flex-shrink-0">
              <div className="border-2 border-[#90b34d] rounded-[6px] overflow-hidden bg-[#fffdf3]/40">
                <TrainerSprite config={config} size={128} crop="bust" />
              </div>
            </div>

            <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--font-loos), sans-serif' }}>
              <div
                className="text-[#16272c] text-[18px] sm:text-[22px] tracking-[0.05em] uppercase font-bold leading-tight truncate"
                style={{ fontFamily: 'var(--font-sora), sans-serif', fontWeight: 700 }}
              >
                {trainerName || 'TRAINER'}
              </div>

              <div className="text-[#367d95] text-[10px] tracking-[0.18em] uppercase mt-1 mb-3">
                {zodiacGlyph ? (
                  <>
                    <span className="text-[14px] mr-1">{zodiacGlyph}</span>
                    {personality.zodiac} · streetwear class
                  </>
                ) : (
                  'streetwear class'
                )}
              </div>

              <StatStrip stats={stats} variant="compact" />
            </div>
          </div>

          {/* Likes / Dislikes */}
          {(safeLikes.length > 0 || safeDislikes.length > 0) && (
            <div className="mt-5 pt-4 border-t border-[#16272c]/15 space-y-2"
                 style={{ fontFamily: 'var(--font-loos), sans-serif' }}>
              {safeLikes.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[#367d95] text-[9px] tracking-[0.2em] uppercase font-bold w-16 flex-shrink-0">
                    Likes
                  </span>
                  <span className="text-[#16272c] text-[12px]"
                        style={{ fontFamily: 'var(--font-sora), sans-serif' }}>
                    {safeLikes.join(' · ')}
                  </span>
                </div>
              )}
              {safeDislikes.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <span className="text-[#c94d4d] text-[9px] tracking-[0.2em] uppercase font-bold w-16 flex-shrink-0">
                    Dislikes
                  </span>
                  <span className="text-[#16272c] text-[12px]"
                        style={{ fontFamily: 'var(--font-sora), sans-serif' }}>
                    {safeDislikes.join(' · ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-[#16272c]/15 text-center"
               style={{ fontFamily: 'var(--font-loos), sans-serif' }}>
            <p className="text-[#8a7d4d] text-[9px] tracking-[0.25em] uppercase">
              ─── verity early access · may 2026 ───
            </p>
          </div>
        </div>
      </TrainerWindow>
    </div>
  );
}
