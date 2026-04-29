'use client';

import type { ReactNode } from 'react';

interface TrainerWindowProps {
  title: string;
  iconLabel?: string;     // small letter/glyph next to title (e.g. "▣", "♦")
  onClose?: () => void;   // routes to / by default in V1
  children: ReactNode;
  className?: string;
}

// Cream/teal/olive Win98-flavored window chrome. Reused by V1 customizer
// (single window) and V2 multi-window dashboard.
export default function TrainerWindow({
  title,
  iconLabel = '▣',
  onClose,
  children,
  className,
}: TrainerWindowProps) {
  return (
    <div
      className={`bg-[#fffdf3] border-2 border-[#16272c] rounded-[6px] shadow-[0_24px_60px_-24px_rgba(22,39,44,0.35)] overflow-hidden ${className ?? ''}`}
    >
      {/* title bar */}
      <div
        className="flex items-center justify-between gap-2 bg-[#fffdf3] border-b-[1.5px] border-[#16272c] px-3 py-2"
        style={{ fontFamily: 'var(--font-loos), sans-serif' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#90b34d] text-[14px] leading-none">{iconLabel}</span>
          <span className="text-[#16272c] text-[11px] tracking-[0.15em] uppercase font-bold truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <WindowButton label="_" disabled />
          <WindowButton label="▢" disabled />
          <WindowButton label="✕" onClick={onClose} />
        </div>
      </div>
      {/* body */}
      <div>{children}</div>
    </div>
  );
}

function WindowButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-label={label}
      className={`w-5 h-5 flex items-center justify-center border border-[#16272c]/40 rounded-[2px] text-[#16272c] text-[11px] leading-none transition-colors ${
        disabled || !onClick
          ? 'opacity-50 cursor-default'
          : 'hover:bg-[#90b34d]/20 cursor-pointer'
      }`}
    >
      {label}
    </button>
  );
}
