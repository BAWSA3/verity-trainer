import * as React from 'react';

type ChipVariant = 'olive' | 'dark' | 'ghost' | 'coral' | 'cream';
type ChipSize = 'sm' | 'md';

const variantStyle: Record<ChipVariant, React.CSSProperties> = {
  olive: {
    background: 'rgba(144, 179, 77, 0.18)',
    border: '1px solid rgba(144, 179, 77, 0.45)',
    color: '#3F5520',
  },
  dark: {
    background: 'rgba(22, 39, 44, 0.08)',
    border: '1px solid rgba(22, 39, 44, 0.35)',
    color: 'var(--ink)',
  },
  ghost: {
    background: 'rgba(255, 255, 255, 0.45)',
    border: '1px solid rgba(22, 39, 44, 0.12)',
    color: 'var(--ink-soft)',
  },
  coral: {
    background: 'rgba(255, 107, 92, 0.14)',
    border: '1px solid rgba(255, 107, 92, 0.5)',
    color: '#A53A2E',
  },
  cream: {
    background: 'rgba(255, 253, 243, 0.85)',
    border: '1px solid rgba(22, 39, 44, 0.12)',
    color: 'var(--ink)',
  },
};

const sizeStyle: Record<ChipSize, string> = {
  sm: 'px-2 py-[3px] text-[11px]',
  md: 'px-2.5 py-[5px] text-[12px]',
};

export interface ChipProps {
  variant?: ChipVariant;
  size?: ChipSize;
  removable?: boolean;
  onRemove?: () => void;
  /** Optional show-on-card toggle, when present renders a checkbox dot at left. */
  selected?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Chip({
  variant = 'ghost',
  size = 'md',
  removable = false,
  onRemove,
  selected,
  onToggle,
  children,
  className = '',
  title,
}: ChipProps) {
  const showToggle = typeof selected === 'boolean';
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium leading-none whitespace-nowrap',
        sizeStyle[size],
        className,
      ].join(' ')}
      style={variantStyle[variant]}
      title={title}
    >
      {showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={selected ? 'Hide on card' : 'Show on card'}
          aria-pressed={selected}
          className="grid place-items-center"
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: selected ? 'currentColor' : 'transparent',
            border: '1.5px solid currentColor',
            opacity: selected ? 1 : 0.55,
            transition: 'opacity 120ms, background 120ms',
            cursor: 'pointer',
          }}
        >
          {selected ? (
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
              <path d="M1.5 4.2 L3.2 5.8 L6.5 2.2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
      ) : null}
      <span>{children}</span>
      {removable ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="ml-0.5 grid place-items-center rounded-full opacity-60 hover:opacity-100"
          style={{ width: 14, height: 14, color: 'inherit' }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
            <path d="M1 1 L7 7 M7 1 L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}

export default Chip;
