'use client';

import { useState, useMemo } from 'react';
import type { TrainerOption, Gender } from '@/types/trainer';
import {
  bodyPath, hairPath, topPath, bottomPath, shoesPath,
  outerwearPath, hatPath, glassesPath, expressionPath,
} from '@/lib/trainer-options';
import { playHover } from '@/lib/sounds';

// Categories with more than this many items collapse behind a "+N MORE" toggle
// to keep the panel scannable.
const PREVIEW_LIMIT = 6;

interface CategorySelectorProps {
  label: string;
  categoryKey: string;
  options: TrainerOption[];
  selected: string;
  onSelect: (id: string) => void;
  gender: Gender;
  currentSkin: string;
  currentHairStyle: string;
  currentHairColor: string;
}

/** Where to source the 64x64 thumbnail for a given trait option. */
function thumbnailSrc(
  categoryKey: string,
  optionId: string,
  gender: Gender,
  currentHairStyle: string,
  currentHairColor: string,
): string {
  switch (categoryKey) {
    // Gender thumbnails are rendered specially (silhouette icon) — no sprite path.
    case 'gender':     return '';
    case 'body':       return bodyPath(gender, optionId);
    case 'hair':       return hairPath(currentHairColor || 'black', optionId);
    case 'hairColor':  return hairPath(optionId, currentHairStyle || 'default');
    case 'top':        return topPath(gender, optionId);
    case 'bottom':     return bottomPath(gender, optionId);
    case 'shoes':      return shoesPath(optionId);
    case 'outerwear':  return outerwearPath(gender, optionId);
    case 'hat':        return hatPath(optionId);
    case 'glasses':    return glassesPath(optionId);
    case 'expression': return expressionPath(optionId);
    default:           return '';
  }
}

interface ThumbProps {
  optionId: string;
  optionLabel: string;
  categoryKey: string;
  selected: boolean;
  gender: Gender;
  currentHairStyle: string;
  currentHairColor: string;
}

function Thumb({
  optionId, optionLabel, categoryKey, selected, gender, currentHairStyle, currentHairColor,
}: ThumbProps) {
  const baseCls = `border-2 cursor-pointer transition-all rounded-[8px] ${
    selected
      ? 'border-[#367d95] shadow-[0_0_12px_rgba(54,125,149,0.4)] scale-110'
      : 'border-[#333]/15 hover:border-[#90b34d]/60 hover:scale-105'
  }`;

  // 'none' for optional categories — show a labeled empty box.
  if (optionId === 'none') {
    return (
      <div
        className={`w-16 h-16 flex items-center justify-center ${baseCls}`}
        style={{ background: 'rgba(255, 253, 243, 0.6)' }}
      >
        <span className="text-[#8a7d4d] text-[8px] tracking-wider">NONE</span>
      </div>
    );
  }

  // Gender — show m/f icon labels rather than sprites.
  if (categoryKey === 'gender') {
    return (
      <div
        className={`w-16 h-16 flex items-center justify-center ${baseCls}`}
        style={{ background: 'rgba(255, 253, 243, 0.6)' }}
      >
        <span
          className="text-[#367d95] text-[28px] tracking-wider"
          style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
        >
          {optionId === 'm' ? '♂' : '♀'}
        </span>
      </div>
    );
  }

  const src = thumbnailSrc(categoryKey, optionId, gender, currentHairStyle, currentHairColor);
  if (!src) {
    return (
      <div
        className={`w-16 h-16 flex items-center justify-center ${baseCls}`}
        style={{ background: 'rgba(255, 253, 243, 0.6)' }}
      >
        <span className="text-[#8a7d4d] text-[7px] tracking-wider">{optionLabel.slice(0, 4).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={optionLabel}
      width={64}
      height={64}
      loading="lazy"
      className={baseCls}
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
  currentHairStyle,
  currentHairColor,
}: CategorySelectorProps) {
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when the selected option lives past the preview cutoff so the
  // user always sees their pick without first clicking "MORE".
  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.id === selected),
    [options, selected],
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
            <Thumb
              optionId={option.id}
              optionLabel={option.label}
              categoryKey={categoryKey}
              selected={selected === option.id}
              gender={gender}
              currentHairStyle={currentHairStyle}
              currentHairColor={currentHairColor}
            />
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
            <span className="text-[7px] sm:text-[8px] tracking-[0.15em] uppercase text-[#367d95] font-bold">
              {isExpanded ? 'SHOW LESS' : 'SHOW MORE'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
