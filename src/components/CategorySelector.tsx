'use client';

import { useRef, useEffect } from 'react';
import { TrainerOption } from '@/types/trainer';
import { playHover } from '@/lib/sounds';

interface CategorySelectorProps {
  label: string;
  options: TrainerOption[];
  selected: string;
  onSelect: (id: string) => void;
}

function MiniSprite({ pixels, selected }: { pixels: string[][]; selected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);

    const pixelSize = 2; // 32 * 2 = 64
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const color = pixels[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }, [pixels]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className={`border-2 cursor-pointer transition-all ${
        selected
          ? 'border-[#39FF14] shadow-[0_0_8px_#39FF14] scale-110'
          : 'border-[#333] hover:border-[#666] hover:scale-105'
      }`}
      style={{ imageRendering: 'pixelated', background: '#0a0a0a' }}
    />
  );
}

export default function CategorySelector({
  label,
  options,
  selected,
  onSelect,
}: CategorySelectorProps) {
  return (
    <div className="mb-4">
      <div className="text-[#39FF14] text-[9px] sm:text-[10px] mb-2 tracking-wider">
        {'> '}{label}
      </div>
      <div className="flex gap-2 sm:gap-3 flex-wrap">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            onMouseEnter={() => playHover()}
            title={option.label}
            className="flex flex-col items-center gap-1 transition-transform"
          >
            <MiniSprite pixels={option.pixels} selected={selected === option.id} />
            <span className={`text-[6px] sm:text-[7px] tracking-wider ${
              selected === option.id ? 'text-[#39FF14]' : 'text-[#555]'
            }`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
