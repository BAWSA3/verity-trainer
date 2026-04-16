'use client';

import { TrainerConfig } from '@/types/trainer';
import { generateStats } from '@/lib/card-utils';
import SpriteCanvas from './SpriteCanvas';

interface TrainerCardProps {
  config: TrainerConfig;
  trainerName: string;
}

function StatBar({ label, value }: { label: string; value: number }) {
  const filled = Math.round((value / 100) * 12);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(12 - filled);
  return (
    <div className="flex items-center gap-2 font-mono text-[10px]">
      <span className="text-[#888] w-20 shrink-0">{label}</span>
      <span className="text-[#39FF14]">{bar}</span>
      <span className="text-[#666] w-6 text-right">{value}</span>
    </div>
  );
}

export default function TrainerCard({ config, trainerName }: TrainerCardProps) {
  const stats = generateStats(config);

  return (
    <div
      id="trainer-card"
      className="relative border-4 border-[#39FF14] bg-[#0a0a0a] p-6 max-w-lg w-full overflow-hidden"
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      {/* Header */}
      <div className="text-[#39FF14] font-mono text-[10px] tracking-widest mb-4 opacity-60">
        VERITY TRAINER CARD
      </div>

      <div className="flex gap-6 items-start">
        {/* Sprite */}
        <div className="shrink-0">
          <SpriteCanvas config={config} size={160} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-white text-sm mb-1 truncate">
            {trainerName || 'TRAINER'}
          </div>
          <div className="font-mono text-[#FF006E] text-[9px] mb-4 tracking-wider">
            STREETWEAR LEGEND
          </div>

          <div className="space-y-1">
            <StatBar label="STYLE LVL" value={stats.style} />
            <StatBar label="DRIP STAT" value={stats.drip} />
            <StatBar label="FLEX PWR" value={stats.flex} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#222]">
        <p className="font-mono text-[#666] text-[8px] leading-relaxed">
          YOUR STREETWEAR JOURNEY STARTS AT VERITY
        </p>
        <p className="font-mono text-[#39FF14] text-[9px] mt-1">
          LAUNCHING MAY 2026
        </p>
      </div>
    </div>
  );
}
