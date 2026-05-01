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
  /** Show-on-card masks. Same length as likes/dislikes; undefined = treat all as shown. */
  shownLikes?: boolean[];
  shownDislikes?: boolean[];
  /** Toggle whether a like at index i appears on the public card. */
  onToggleShownLike?: (i: number) => void;
  onToggleShownDislike?: (i: number) => void;
}

export default function PersonalityPanel({
  value,
  onChange,
  shownLikes,
  shownDislikes,
  onToggleShownLike,
  onToggleShownDislike,
}: Props) {
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
        shown={shownLikes}
        onToggleShown={onToggleShownLike}
        suggestions={SUGGESTED_LIKES.filter((s) => !value.likes.includes(s))}
        onChange={(chips) => onChange({ ...value, likes: chips })}
      />
      <ChipField
        label="Dislikes"
        chips={value.dislikes}
        shown={shownDislikes}
        onToggleShown={onToggleShownDislike}
        suggestions={SUGGESTED_DISLIKES.filter((s) => !value.dislikes.includes(s))}
        onChange={(chips) => onChange({ ...value, dislikes: chips })}
      />

      <p className="text-[#8a7d4d]/80 text-[10px] leading-relaxed">
        Tap the eye to hide a chip from your public card. Up to {MAX_CHIPS} each, {MAX_CHIP_LEN} chars per chip.
      </p>
    </div>
  );
}

function ChipField({
  label,
  chips,
  shown,
  onToggleShown,
  suggestions,
  onChange,
}: {
  label: string;
  chips: string[];
  shown?: boolean[];
  onToggleShown?: (i: number) => void;
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
        {chips.map((chip, i) => {
          const isShown = shown?.[i] ?? true;
          const canToggle = !!onToggleShown;
          return (
            <span
              key={`${chip}-${i}`}
              className={`inline-flex items-center gap-1 bg-[#90b34d]/15 border border-[#90b34d]/40 text-[#16272c] text-[12px] pl-2.5 pr-1 py-1 rounded-full transition-opacity ${
                isShown ? '' : 'opacity-50 line-through decoration-[#16272c]/40'
              }`}
            >
              {chip}
              {canToggle && (
                <button
                  type="button"
                  onClick={() => onToggleShown?.(i)}
                  aria-label={isShown ? `Hide ${chip} from card` : `Show ${chip} on card`}
                  title={isShown ? 'Showing on card' : 'Hidden from card'}
                  className="grid place-items-center w-5 h-5 rounded-full text-[#16272c]/55 hover:text-[#367d95] hover:bg-[#367d95]/10 transition-colors"
                >
                  {isShown ? <EyeOpen /> : <EyeClosed />}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${chip}`}
                className="text-[#16272c]/60 hover:text-[#c94d4d] text-[14px] leading-none px-1"
              >
                ×
              </button>
            </span>
          );
        })}
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

function EyeOpen() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M1 8 C3 4 5.5 2.5 8 2.5 C10.5 2.5 13 4 15 8 C13 12 10.5 13.5 8 13.5 C5.5 13.5 3 12 1 8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M1.5 6.5 C4 10 6 11 8 11 C10 11 12 10 14.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 11 L4 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 11 L12 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 11.5 L8 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
