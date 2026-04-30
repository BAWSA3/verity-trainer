'use client';

import type { ReactNode } from 'react';

type Accent = 'olive' | 'teal' | 'dark';
type Bg = 'cream' | 'cream-warm';

interface PixelWindowProps {
  title?: string;                    // omit for chromeless/title-less windows
  accent?: Accent;                   // title bar color
  bg?: Bg;                           // body background tone
  controls?: boolean | 'static';     // false hides; 'static' renders disabled glyphs (decorative)
  onClose?: () => void;              // when set, ✕ becomes interactive
  bodyPad?: 'none' | 'sm' | 'md' | 'lg';
  /** When true, the window stretches to fill its parent grid cell + lets
   *  body content flex (used by FullBody/Customizer/Scene which need to
   *  absorb vertical slack in the fixed-view dashboard). */
  fill?: boolean;
  children: ReactNode;
  className?: string;
}

const ACCENT_BG: Record<Accent, string> = {
  olive: '#90b34d',
  teal:  '#367d95',
  dark:  '#16272c',
};

const ACCENT_TEXT: Record<Accent, string> = {
  olive: '#16272c',  // dark text on olive (better contrast)
  teal:  '#fffdf3',  // cream text on teal
  dark:  '#fffdf3',  // cream text on dark
};

const BG_FILL: Record<Bg, string> = {
  cream:      '#fffdf3',
  'cream-warm': '#f5f1d6',
};

const PAD: Record<NonNullable<PixelWindowProps['bodyPad']>, string> = {
  none: 'p-0',
  sm: 'p-2.5',
  md: 'p-3.5',
  lg: 'p-5',
};

export default function PixelWindow({
  title,
  accent = 'teal',
  bg = 'cream',
  controls = 'static',
  onClose,
  bodyPad = 'md',
  fill = false,
  children,
  className,
}: PixelWindowProps) {
  const showControls = controls !== false;
  const interactive = controls === true || controls === undefined;
  const fillCls = fill ? 'h-full flex flex-col min-h-0' : '';

  return (
    <div
      className={`relative border-2 border-[#16272c] rounded-[3px] shadow-[0_8px_24px_-12px_rgba(22,39,44,0.45)] overflow-hidden ${fillCls} ${className ?? ''}`}
      style={{ background: BG_FILL[bg] }}
    >
      {(title || showControls) && (
        <div
          className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b-[1.5px] border-[#16272c]"
          style={{
            background: ACCENT_BG[accent],
            color: ACCENT_TEXT[accent],
            fontFamily: 'var(--font-loos), sans-serif',
          }}
        >
          <span className="text-[10px] tracking-[0.18em] uppercase font-bold leading-none truncate">
            {title ?? ' '}
          </span>
          {showControls && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <WindowGlyph label="_" interactive={false} accent={accent} />
              <WindowGlyph label="▢" interactive={false} accent={accent} />
              <WindowGlyph
                label="✕"
                interactive={interactive && Boolean(onClose)}
                onClick={onClose}
                accent={accent}
              />
            </div>
          )}
        </div>
      )}
      {/* Body. When fill=true, body becomes a flex column so the customizer's
          internal layout (sticky tabs / scrollable middle / sticky footer) can
          actually flex. Without flex flex-col here, child `flex-1` is a no-op
          and the scroll div collapses to its content height. */}
      <div
        className={`${PAD[bodyPad]} ${fill ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

function WindowGlyph({
  label,
  interactive,
  accent,
  onClick,
}: {
  label: string;
  interactive: boolean;
  accent: Accent;
  onClick?: () => void;
}) {
  // Tight rectangular button — pixel-game feel rather than rounded chrome.
  const fg = ACCENT_TEXT[accent];
  const cls = `w-[16px] h-[14px] flex items-center justify-center text-[10px] leading-none border border-current/50 rounded-[1px] transition-colors`;
  if (!interactive) {
    return (
      <span
        aria-hidden
        className={cls}
        style={{ color: fg, opacity: 0.7 }}
      >
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${cls} hover:bg-[rgba(255,253,243,0.25)] cursor-pointer`}
      style={{ color: fg }}
    >
      {label}
    </button>
  );
}
