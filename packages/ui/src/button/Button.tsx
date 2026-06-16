'use client';

import * as React from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'revoke';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary text-on-primary',
    'hover:bg-primary-bright',
    'active:bg-primary-deep',
    'disabled:bg-faint disabled:text-muted disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'bg-transparent text-text border border-border',
    'hover:bg-raised hover:border-muted',
    'active:bg-raised',
    'disabled:text-faint disabled:border-faint disabled:cursor-not-allowed',
  ].join(' '),
  danger: [
    'bg-danger/10 text-danger border border-danger/30',
    'hover:bg-danger/20 hover:border-danger/50',
    'active:bg-danger/30',
    'disabled:text-faint disabled:border-faint disabled:cursor-not-allowed',
  ].join(' '),
  revoke: [
    'bg-revoke text-on-revoke',
    'hover:opacity-90',
    'active:opacity-80',
    'disabled:bg-faint disabled:text-muted disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
};

/**
 * Brass spinner — pure CSS, transform/opacity only, token colors.
 * Used in the loading state; also re-exported for the REVOKE in-flight state.
 */
export function BrassSpinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-block',
        width: '1em',
        height: '1em',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'metador-spin 0.6s linear infinite',
      }}
    />
  );
}

/**
 * Core button primitive. Variants: primary (brass), ghost, danger, revoke.
 * The revoke variant is ONLY for the revoke confirmation flow (DESIGN.md).
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? loading;

  return (
    <>
      {/* Inject spin keyframes once; harmless if duplicated across SSR */}
      <style>{`
        @keyframes metador-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        {...props}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          // Layout
          'inline-flex items-center justify-center',
          // Shape
          'rounded-sm font-medium',
          // Focus ring (DESIGN.md — brass on every interactive element)
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          // Duration via arbitrary-var (DESIGN.md Tailwind v4 caveat)
          'transition-[background-color,border-color,opacity,box-shadow]',
          'duration-(--metador-duration-fast)',
          sizeStyles[size],
          variantStyles[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {loading && <BrassSpinner />}
        {children}
      </button>
    </>
  );
}
