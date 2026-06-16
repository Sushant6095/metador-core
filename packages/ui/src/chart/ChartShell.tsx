import * as React from 'react';

export type ChartAspect = '16/9' | '4/3' | '2/1' | '3/1';

export interface ChartShellProps {
  label: string;
  aspect?: ChartAspect;
  className?: string;
}

const aspectClass: Record<ChartAspect, string> = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-4/3',
  '2/1': 'aspect-2/1',
  '3/1': 'aspect-3/1',
};

/**
 * Framed empty chart placeholder — used on surfaces where the chart library
 * (lightweight-charts) lands in G1. Shows aspect-ratio shell + label + note.
 */
export function ChartShell({
  label,
  aspect = '16/9',
  className,
}: ChartShellProps) {
  return (
    <div
      className={[
        'w-full rounded-md border border-border bg-surface',
        aspectClass[aspect],
        'flex flex-col items-center justify-center gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={`${label} — chart placeholder`}
    >
      <span className="text-2xs font-medium uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className="text-xs text-faint">Chart lands G1</span>
    </div>
  );
}
