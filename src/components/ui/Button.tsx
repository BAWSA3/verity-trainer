import * as React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(180deg, #FF6B5C 0%, #E85544 100%)',
    color: 'white',
    border: '1px solid rgba(232, 85, 68, 0.6)',
    boxShadow: '0 8px 20px -8px rgba(232, 85, 68, 0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  secondary: {
    background: 'rgba(255, 253, 243, 0.78)',
    color: 'var(--ink)',
    border: '1px solid rgba(22, 39, 44, 0.18)',
    boxShadow: '0 4px 14px -8px rgba(22, 39, 44, 0.25)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid rgba(22, 39, 44, 0.18)',
  },
  danger: {
    background: 'rgba(232, 85, 68, 0.12)',
    color: '#A53A2E',
    border: '1px solid rgba(232, 85, 68, 0.4)',
  },
};

const sizeStyle: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[12px] gap-1.5',
  md: 'px-4 py-2 text-[13px] gap-2',
  lg: 'px-5 py-2.5 text-[14px] gap-2',
};

const radiusStyle: Record<ButtonSize, string> = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
};

type AnchorOnly = { href: string; target?: string; rel?: string };
type ButtonOnly = { href?: undefined; type?: 'button' | 'submit' | 'reset' };

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export type ButtonProps = CommonProps & (AnchorOnly | ButtonOnly);

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    disabled,
    loading,
    fullWidth,
    leading,
    trailing,
    children,
    className = '',
    title,
    onClick,
  } = props;

  const cls = [
    'inline-flex items-center justify-center font-semibold tracking-tight transition',
    'hover:translate-y-[-1px] active:translate-y-[0px]',
    sizeStyle[size],
    radiusStyle[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'opacity-60 pointer-events-none' : 'cursor-pointer',
    className,
  ].filter(Boolean).join(' ');

  const inner = (
    <>
      {leading ? <span aria-hidden className="inline-flex">{leading}</span> : null}
      <span>{loading ? '…' : children}</span>
      {trailing ? <span aria-hidden className="inline-flex">{trailing}</span> : null}
    </>
  );

  if ('href' in props && props.href) {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.rel}
        className={cls}
        style={variantStyle[variant]}
        title={title}
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={('type' in props && props.type) || 'button'}
      className={cls}
      style={variantStyle[variant]}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}

export default Button;
