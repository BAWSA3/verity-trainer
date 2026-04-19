'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { TrainerOption, Gender } from '@/types/trainer';
import { USE_PNG_SPRITES } from '@/lib/trainer-options';
import { playHover } from '@/lib/sounds';

// Categories with more than this many items collapse behind a "+N MORE" toggle
// to keep the panel scannable. Tuned to fit ~2 rows at the default thumbnail
// size on mobile + desktop.
const PREVIEW_LIMIT = 6;

interface CategorySelectorProps {
  label: string;
  categoryKey: string;
  options: TrainerOption[];
  selected: string;
  onSelect: (id: string) => void;
  gender: Gender;              // current gender so thumbnails reflect user's picks
  currentSkin: string;         // current skin tone so thumbnails use it for clothes/hair/etc
  currentHairStyle: string;    // current hair style for HAIR COLOR thumbnails
  currentHairColor: string;    // current hair color for HAIR style thumbnails
}

function MiniSpritePixel({ pixels, selected }: { pixels: string[][]; selected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);
    const pixelSize = 2;
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
      className={`border-2 cursor-pointer transition-all rounded-[8px] ${
        selected
          ? 'border-[#367d95] shadow-[0_0_12px_rgba(54,125,149,0.4)] scale-110'
          : 'border-[#333]/15 hover:border-[#90b34d]/60 hover:scale-105'
      }`}
      style={{ imageRendering: 'pixelated', background: 'rgba(255, 253, 243, 0.6)' }}
    />
  );
}

function thumbnailSrc(
  categoryKey: string,
  optionId: string,
  gender: Gender,
  currentSkin: string,
  currentHairStyle: string,
  currentHairColor: string,
): string {
  switch (categoryKey) {
    case 'gender':
      // Show body silhouette in current skin tone — clearly communicates body shape
      return `/sprites/body/${optionId}/${currentSkin}.png`;
    case 'body':
      // Show face only in that skin tone — cleaner than full body
      return `/sprites/head/${gender}/${optionId}.png`;
    case 'top':
      return `/sprites/tops/${gender}/${optionId}.png`;
    case 'hair':
      // Style thumbnails show the current hair color
      return `/sprites/hair/${currentHairColor}/${optionId}.png`;
    case 'hairColor':
      // Color thumbnails show the current hair style
      return `/sprites/hair/${optionId}/${currentHairStyle}.png`;
    case 'bottom':
      return `/sprites/bottoms/${optionId}.png`;
    case 'accessory':
      return `/sprites/accessories/${optionId}.png`;
    case 'shoes':
      return `/sprites/shoes/${optionId}.png`;
    case 'face':
      return `/sprites/face/${optionId}.png`;
    case 'neck':
      return `/sprites/neck/${gender}/${optionId}.png`;
    case 'facialHair':
      return `/sprites/facial-hair/${optionId}.png`;
    default:
      return '';
  }
}

function MiniSpritePNG({
  optionId,
  categoryKey,
  selected,
  gender,
  currentSkin,
  currentHairStyle,
  currentHairColor,
}: {
  optionId: string;
  categoryKey: string;
  selected: boolean;
  gender: Gender;
  currentSkin: string;
  currentHairStyle: string;
  currentHairColor: string;
}) {
  if (optionId === 'none') {
    return (
      <div
        className={`w-16 h-16 flex items-center justify-center border-2 cursor-pointer transition-all rounded-[8px] ${
          selected
            ? 'border-[#367d95] shadow-[0_0_12px_rgba(54,125,149,0.4)] scale-110'
            : 'border-[#333]/15 hover:border-[#90b34d]/60 hover:scale-105'
        }`}
        style={{ background: 'rgba(255, 253, 243, 0.6)' }}
      >
        <span className="text-[#8a7d4d] text-[8px] tracking-wider">NONE</span>
      </div>
    );
  }

  const src = thumbnailSrc(categoryKey, optionId, gender, currentSkin, currentHairStyle, currentHairColor);

  return (
    <img
      src={src}
      alt={optionId}
      width={64}
      height={64}
      className={`border-2 cursor-pointer transition-all rounded-[8px] ${
        selected
          ? 'border-[#367d95] shadow-[0_0_12px_rgba(54,125,149,0.4)] scale-110'
          : 'border-[#333]/15 hover:border-[#90b34d]/60 hover:scale-105'
      }`}
      style={{ imageRendering: 'pixelated', background: 'rgba(255, 253, 243, 0.6)' }}
    />
  );
}

export default function CategorySelector({
  label,
  categoryKey,
  options,
  selected,
  onSelect,
  gender,
  currentSkin,
  currentHairStyle,
  currentHairColor,
}: CategorySelectorProps) {
  const [expanded, setExpanded] = useState(false);

  // If the currently-selected option lives past the preview cutoff, force-expand
  // so the user always sees their pick without first clicking "MORE". Tracked as
  // an effect of the option list rather than one-shot so a fresh random pick
  // beyond the cutoff still reveals.
  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.id === selected),
    [options, selected]
  );
  const overflows = options.length > PREVIEW_LIMIT;
  const forceExpanded = overflows && selectedIndex >= PREVIEW_LIMIT;
  const isExpanded = expanded || forceExpanded;

  const visibleOptions =
    overflows && !isExpanded ? options.slice(0, PREVIEW_LIMIT) : options;
  const hiddenCount = options.length - PREVIEW_LIMIT;

  return (
    <div className="mb-5">
      <div
        className="text-[#367d95] text-[9px] sm:text-[11px] mb-2 tracking-[0.2em] uppercase flex items-baseline justify-between"
        style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
      >
        <span>{label}</span>
        <span className="text-[#8a7d4d]/60 text-[8px] sm:text-[10px] tracking-[0.15em] normal-case">
          {options.length} {options.length === 1 ? 'OPTION' : 'OPTIONS'}
        </span>
      </div>
      <div className="flex gap-2 sm:gap-3 flex-wrap">
        {visibleOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            onMouseEnter={() => playHover()}
            title={option.label}
            className="flex flex-col items-center gap-1 transition-transform"
          >
            {USE_PNG_SPRITES ? (
              <MiniSpritePNG
                optionId={option.id}
                categoryKey={categoryKey}
                selected={selected === option.id}
                gender={gender}
                currentSkin={currentSkin}
                currentHairStyle={currentHairStyle}
                currentHairColor={currentHairColor}
              />
            ) : (
              <MiniSpritePixel pixels={option.pixels} selected={selected === option.id} />
            )}
            <span
              className={`text-[7px] sm:text-[8px] tracking-[0.15em] uppercase ${
                selected === option.id ? 'text-[#367d95] font-bold' : 'text-[#8a7d4d]'
              }`}
            >
              {option.label}
            </span>
          </button>
        ))}
        {overflows && (
          <button
            onClick={() => setExpanded((e) => !e)}
            onMouseEnter={() => playHover()}
            disabled={forceExpanded}
            className={`flex flex-col items-center gap-1 transition-transform ${
              forceExpanded ? 'opacity-50 cursor-default' : ''
            }`}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Show fewer options' : `Show ${hiddenCount} more options`}
          >
            <div
              className="w-16 h-16 flex items-center justify-center border-2 cursor-pointer transition-all rounded-[8px] border-[#367d95]/30 hover:border-[#367d95] hover:scale-105 text-[#367d95] text-[10px] tracking-wider"
              style={{ background: 'rgba(255, 253, 243, 0.6)' }}
            >
              {isExpanded ? (
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-[14px] leading-none">−</span>
                  <span className="text-[7px] tracking-[0.15em] mt-1">LESS</span>
                </span>
              ) : (
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-[12px] font-bold leading-none">+{hiddenCount}</span>
                  <span className="text-[7px] tracking-[0.15em] mt-1">MORE</span>
                </span>
              )}
            </div>
            <span
              className="text-[7px] sm:text-[8px] tracking-[0.15em] uppercase text-[#367d95] font-bold"
            >
              {isExpanded ? 'SHOW LESS' : 'SHOW MORE'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
