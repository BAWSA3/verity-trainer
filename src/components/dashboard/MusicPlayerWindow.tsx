'use client';

// MusicPlayerWindow — animated eye-loop + transport controls + scrubber.
// Reads tracks from public/audio/manifest.json. State + audio playback
// managed by useAudioPlayer hook.
//
// First play requires a user gesture (the ⏯ button) per browser autoplay policy.

import type { TrainerConfig } from '@/types/trainer';
import TrainerSprite from '@/components/TrainerSprite';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import PixelWindow from './PixelWindow';

interface Props {
  config: TrainerConfig;
}

export default function MusicPlayerWindow({ config }: Props) {
  const player = useAudioPlayer();
  const { currentTrack, isPlaying, position, duration, volume } = player;

  const fmt = (t: number) => {
    if (!Number.isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  const trackLabel = currentTrack
    ? currentTrack.title
    : player.tracks.length > 0
      ? 'Press ⏯ to play'
      : 'No tracks loaded';

  return (
    <PixelWindow title="NOW PLAYING" accent="teal" bg="cream-warm" bodyPad="md">
      <div className="flex flex-col items-center gap-2">
        {/* Eye-loop window */}
        <div
          className="border-2 border-[#16272c] bg-[#fffdf3] p-1.5 relative overflow-hidden"
          style={{ width: 132, height: 88 }}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: 'translate(-50%, -50%)',
              animation: isPlaying ? 'verity-eye-pulse 2.4s ease-in-out infinite' : 'none',
            }}
          >
            <TrainerSprite config={config} size={108} crop="bust" />
          </div>
          {!isPlaying && (
            <div className="absolute inset-0 bg-[#16272c]/15 pointer-events-none" />
          )}
        </div>

        {/* Track title */}
        <div className="w-full text-center min-h-[16px]">
          <p
            className="text-[10px] tracking-[0.12em] uppercase text-[#16272c] truncate"
            style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
          >
            {trackLabel}
          </p>
        </div>

        {/* Transport controls */}
        <div className="flex items-center gap-1 w-full">
          <TransportButton onClick={player.prev} label="⏮" disabled={player.tracks.length === 0} />
          <TransportButton
            onClick={player.toggle}
            label={isPlaying ? '⏸' : '▶'}
            disabled={player.tracks.length === 0}
            primary
          />
          <TransportButton onClick={player.next} label="⏭" disabled={player.tracks.length === 0} />
          <div className="flex-1 ml-2 flex items-center gap-1.5">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="w-full accent-[#367d95] h-1"
              aria-label="Volume"
            />
          </div>
        </div>

        {/* Scrubber */}
        <div className="w-full flex items-center gap-2">
          <span
            className="text-[9px] text-[#8a7d4d] tabular-nums"
            style={{ fontFamily: 'var(--font-loos), sans-serif' }}
          >
            {fmt(position)}
          </span>
          <div
            className="flex-1 h-2 bg-[#fffdf3] border border-[#16272c]/40 rounded-[1px] cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              if (duration > 0) player.seek(pct * duration);
            }}
          >
            <div
              className="absolute left-0 top-0 h-full bg-[#90b34d]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span
            className="text-[9px] text-[#8a7d4d] tabular-nums"
            style={{ fontFamily: 'var(--font-loos), sans-serif' }}
          >
            {fmt(duration)}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes verity-eye-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          48%      { transform: translate(-50%, -50%) scale(1); }
          50%      { transform: translate(-50%, -50%) scale(0.94); }
          52%      { transform: translate(-50%, -50%) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes verity-eye-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
          }
        }
      `}</style>
    </PixelWindow>
  );
}

function TransportButton({
  onClick, label, disabled, primary,
}: { onClick?: () => void; label: string; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex items-center justify-center border-2 border-[#16272c] rounded-[2px] text-[14px] leading-none transition-colors ${
        primary
          ? 'bg-[#367d95] text-[#fffdf3] hover:bg-[#16272c] w-10 h-9'
          : 'bg-[#fffdf3] text-[#16272c] hover:bg-[#90b34d]/30 w-9 h-9'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ fontFamily: 'var(--font-loos), sans-serif' }}
    >
      {label}
    </button>
  );
}
