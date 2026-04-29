'use client';

import { useState } from 'react';
import type { TrainerPersonality, Zodiac } from '@/types/trainer';
import { ZODIAC_OPTIONS } from '@/lib/personality';

const MAX_CHIPS = 5;
const MAX_CHIP_LEN = 24;

const SUGGESTED_LIKES = ['coffee', 'denim', 'vintage', 'vinyl', 'streetwear', 'arcades', 'noodles'];
const SUGGESTED_DISLIKES = ['hype drops', 'ai art', 'mid graders', 'bots', 'crypto bros', 'fast food'];

interface Props {
  value: TrainerPersonality;
  onChange: (next: TrainerPersonality) => void;
}

export default function PersonalityPanel({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label
          className="text-[#367d95] text-[10px] tracking-[0.2em] uppercase block mb-2"
          style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
        >
          Zodiac <span className="text-[#8a7d4d]/60 font-normal normal-case ml-1">optional</span>
        </label>
        <select
          value={value.zodiac}
          onChange={(e) => onChange({ ...value, zodiac: (e.target.value || '') as Zodiac | '' })}
          className="w-full bg-white border border-[#90b34d]/30 text-[#333] text-sm p-2.5 rounded-[8px] focus:border-[#367d95] focus:outline-none"
        >
          <option value="">Pick a sign</option>
          {ZODIAC_OPTIONS.map((z) => (
            <option key={z.id} value={z.id}>
              {z.glyph}  {z.label}
            </option>
          ))}
        </select>
      </div>

      <ChipField
        label="Likes"
        chips={value.likes}
        suggestions={SUGGESTED_LIKES.filter((s) => !value.likes.includes(s))}
        onChange={(chips) => onChange({ ...value, likes: chips })}
      />
      <ChipField
        label="Dislikes"
        chips={value.dislikes}
        suggestions={SUGGESTED_DISLIKES.filter((s) => !value.dislikes.includes(s))}
        onChange={(chips) => onChange({ ...value, dislikes: chips })}
      />

      <p className="text-[#8a7d4d]/80 text-[10px] leading-relaxed">
        Likes and dislikes show up on your trainer card. Up to {MAX_CHIPS} each, {MAX_CHIP_LEN} chars per chip.
      </p>
    </div>
  );
}

function ChipField({
  label,
  chips,
  suggestions,
  onChange,
}: {
  label: string;
  chips: string[];
  suggestions: string[];
  onChange: (chips: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHIP_LEN) return;
    if (chips.includes(trimmed)) return;
    if (chips.length >= MAX_CHIPS) return;
    onChange([...chips, trimmed]);
    setDraft('');
  }

  function remove(idx: number) {
    onChange(chips.filter((_, i) => i !== idx));
  }

  const isFull = chips.length >= MAX_CHIPS;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label
          className="text-[#367d95] text-[10px] tracking-[0.2em] uppercase"
          style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
        >
          {label}
        </label>
        <span className="text-[#8a7d4d]/60 text-[9px] tracking-[0.15em]">
          {chips.length}/{MAX_CHIPS}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {chips.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center gap-1.5 bg-[#90b34d]/15 border border-[#90b34d]/40 text-[#16272c] text-[12px] pl-2.5 pr-1.5 py-1 rounded-full"
          >
            {chip}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${chip}`}
              className="text-[#16272c]/60 hover:text-[#c94d4d] text-[14px] leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {!isFull && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHIP_LEN))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add(draft);
              }
            }}
            placeholder={`Add a ${label.toLowerCase().slice(0, -1)}…`}
            maxLength={MAX_CHIP_LEN}
            className="flex-1 bg-white border border-[#90b34d]/30 text-[#333] text-sm p-2 rounded-[8px] focus:border-[#367d95] focus:outline-none placeholder:text-[#8a7d4d]/50"
          />
          <button
            type="button"
            onClick={() => add(draft)}
            disabled={!draft.trim()}
            className="px-3 rounded-[8px] bg-[#90b34d]/20 hover:bg-[#90b34d]/40 text-[#16272c] text-sm border border-[#90b34d]/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      )}

      {!isFull && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-[11px] text-[#367d95] border border-[#367d95]/30 hover:bg-[#367d95]/10 px-2 py-0.5 rounded-full transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
