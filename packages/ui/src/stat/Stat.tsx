import * as React from 'react';

export type StatDelta = 'success' | 'danger' | 'neutral';

export interface StatProps {
  label: string;
  value: string;
  /** Optional delta string e.g. "+3.2%" — colored per deltaKind */
  delta?: string;
  deltaKind?: StatDelta;
  className?: string;
}

/**
 * Stat display: muted 2xs uppercase label + mono tabular value.
 * Optional delta row with semantic success/danger coloring and sign.
 */
export function Stat({
  label,
  value,
  delta,
  deltaKind = 'neutral',
  className,
}: StatProps) {
  const deltaColor: Record<StatDelta, string> = {
    success: 'text-success',
    danger: 'text-danger',
    neutral: 'text-muted',
  };

  return (
    <div className={['flex flex-col gap-1', className].filter(Boolean).join(' ')}>
      <span
        className="text-2xs font-medium uppercase tracking-widest text-muted"
        aria-label={label}
      >
        {label}
      </span>
      <span
        className="font-mono text-base tabular-nums lining-nums text-text"
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {value}
      </span>
      {delta !== undefined && (
        <span
          className={[
            'text-xs font-mono tabular-nums',
            deltaColor[deltaKind],
          ].join(' ')}
          style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          aria-label={`Change: ${delta}`}
        >
          {delta}
        </span>
      )}
    </div>
  );
}
