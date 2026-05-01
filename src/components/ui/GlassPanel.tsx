import * as React from 'react';

type GlassTone = 'cream' | 'blush' | 'azure' | 'olive' | 'dark';
type GlassRadius = 'md' | 'lg' | 'xl';
type GlassPadding = 'none' | 'sm' | 'md' | 'lg';

const toneTint: Record<GlassTone, string> = {
  cream: '',
  blush: 'rgba(255, 230, 230, 0.35)',
  azure: 'rgba(194, 221, 255, 0.35)',
  olive: 'rgba(144, 179, 77, 0.18)',
  dark: 'rgba(22, 39, 44, 0.06)',
};

const radiusMap: Record<GlassRadius, string> = {
  md: 'rounded-2xl',     // 16px
  lg: 'rounded-[20px]',
  xl: 'rounded-3xl',     // 24px
};

const padMap: Record<GlassPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export interface GlassPanelProps {
  tone?: GlassTone;
  radius?: GlassRadius;
  padding?: GlassPadding;
  /** When true, panel stretches to fill its grid/flex parent (h-full + flex-col + min-h-0). */
  fill?: boolean;
  /** Strength of the glass tint. Default 'normal'. */
  strength?: 'soft' | 'normal' | 'strong';
  header?: React.ReactNode;
  /** Where the header sits visually. Default 'inset' (inside the panel chrome). */
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
}

export function GlassPanel({
  tone = 'cream',
  radius = 'lg',
  padding = 'md',
  fill = false,
  strength = 'normal',
  header,
  className = '',
  style,
  children,
  id,
}: GlassPanelProps) {
  const glassClass =
    strength === 'strong' ? 'glass-strong' : strength === 'soft' ? 'glass-soft' : 'glass';

  const fillClass = fill ? 'h-full flex flex-col min-h-0' : '';

  const tint = toneTint[tone];
  const tintStyle: React.CSSProperties | undefined = tint
    ? { backgroundImage: 'linear-gradient(to bottom right, ' + tint + ', transparent)' }
    : undefined;

  return (
    <section
      id={id}
      className={[glassClass, radiusMap[radius], 'overflow-hidden', fillClass, className].filter(Boolean).join(' ')}
      style={{ ...tintStyle, ...style }}
    >
      {header ? (
        <header className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
          {header}
        </header>
      ) : null}
      <div className={[padMap[padding], fill ? 'flex-1 min-h-0' : ''].filter(Boolean).join(' ')}>
        {children}
      </div>
    </section>
  );
}

export default GlassPanel;
