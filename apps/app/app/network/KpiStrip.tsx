'use client';

/**
 * KpiStrip — divider-delimited (NOT boxed cards), ~34px mono value,
 * 12px muted uppercase label. Highlighted column on --metador-raised.
 * Value color-flashes on change (120ms toward success/danger, then back).
 * Matches the pixel target header strip exactly.
 */

import * as React from 'react';

interface KpiItem {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  warn?: boolean;
}

interface KpiStripProps {
  items: KpiItem[];
}

interface KpiCellProps extends KpiItem {
  isFirst: boolean;
}

function KpiCell({ label, value, unit, highlight, warn, isFirst }: KpiCellProps) {
  const [flash, setFlash] = React.useState<'none' | 'up' | 'down'>('none');
  const prevValue = React.useRef(value);

  React.useEffect(() => {
    if (value === prevValue.current) return;
    // Detect direction by attempting numeric parse
    const prev = parseFloat(prevValue.current.replace(/[^0-9.\-]/g, ''));
    const curr = parseFloat(value.replace(/[^0-9.\-]/g, ''));
    const dir = !isNaN(prev) && !isNaN(curr) ? (curr > prev ? 'up' : 'down') : 'up';
    prevValue.current = value;
    setFlash(dir);
    const t = setTimeout(() => setFlash('none'), 120);
    return () => clearTimeout(t);
  }, [value]);

  const valueColor = warn
    ? 'text-warn'
    : flash === 'up'
    ? 'text-success'
    : flash === 'down'
    ? 'text-danger'
    : 'text-text';

  return (
    <div
      className={[
        'flex flex-col justify-center px-4 py-4',
        !isFirst ? 'border-l border-border' : '',
        highlight ? 'bg-raised' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ minWidth: 0 }}
    >
      <span
        className="text-2xs font-medium uppercase tracking-wider text-muted mb-2"
        style={{ letterSpacing: '0.06em' }}
      >
        {label}
      </span>
      <span
        className={[
          'tabular-nums lining-nums font-text font-medium leading-none',
          valueColor,
          'transition-colors',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          fontSize: 'var(--metador-text-2xl)',
          fontVariantNumeric: 'tabular-nums lining-nums',
          transitionDuration: 'var(--metador-duration-fast)',
        }}
      >
        {value}
        {unit && (
          <small
            className="text-faint"
            style={{ fontSize: 'var(--metador-text-sm)', marginLeft: '4px', fontWeight: 400 }}
          >
            {unit}
          </small>
        )}
      </span>
    </div>
  );
}

export function KpiStrip({ items }: KpiStripProps) {
  return (
    <div
      className="w-full border-t border-b border-border"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      }}
      role="list"
      aria-label="Network key metrics"
    >
      {items.map((item, i) => (
        <div key={item.label} role="listitem">
          <KpiCell {...item} isFirst={i === 0} />
        </div>
      ))}
    </div>
  );
}
