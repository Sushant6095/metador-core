import * as React from 'react';

export type SkeletonVariant = 'text' | 'rect' | 'row';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Width for rect variant (e.g. '100%', '64px') */
  width?: string;
  /** Height for rect variant (e.g. '48px') */
  height?: string;
  className?: string;
}

/**
 * Skeleton placeholder — opacity-only pulse via --animate-skeleton.
 * text: single line, rect: explicit dimensions, row: full-width row.
 * No animated gradient position — only opacity (DESIGN.md #motion).
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const base = [
    'rounded-xs',
    'bg-skeleton-base',
    'animate-skeleton',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (variant === 'text') {
    return (
      <span
        className={[base, 'block h-[1em] w-3/4'].join(' ')}
        aria-hidden="true"
        role="presentation"
      />
    );
  }

  if (variant === 'rect') {
    return (
      <span
        className={base}
        style={{ display: 'block', width: width ?? '100%', height: height ?? '40px' }}
        aria-hidden="true"
        role="presentation"
      />
    );
  }

  // row variant — full width, typical row height
  return (
    <span
      className={[base, 'block h-8 w-full'].join(' ')}
      aria-hidden="true"
      role="presentation"
    />
  );
}
