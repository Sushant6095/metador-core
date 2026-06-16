'use client';

import * as React from 'react';

/**
 * DataTable — the dense screener grammar codified as a shared primitive
 * (the grammar that won parity on /screener; docs/research/parity/
 * parity-report-screener.json). Both the marketplace and the cockpit consume
 * it so the trading surfaces read identically:
 *
 *   - 40px standard data row (8px py + 24px content cap)
 *   - 13px (text-xs) mono-tabular cells; numerics right-aligned
 *   - 12px (text-2xs) muted uppercase column headers that recede
 *   - identifier columns flush left; numbers flush right
 *   - hairline row dividers; hover row state; staggered entrance
 *
 * Numerals law (DESIGN.md): every money/market/count/date value is mono +
 * tabular-nums, right-aligned in columns. `align: 'right'` columns get the
 * mono+tabular treatment on the <td> itself so the parity probe (which reads
 * the cell's own computed font-family + font-variant-numeric) counts them.
 *
 * Motion (DESIGN.md #motion): rows stagger at 40-60ms, max 8 animated, the
 * rest instant. Entrances are opacity + translateY only. Honors
 * prefers-reduced-motion via the global media query (transition/animation
 * collapse to ~0ms) — the inline-style entrance below is paint-once and does
 * not re-trigger on data change, so layout never jumps around money values.
 */

const ROW_HEIGHT = 40; // px — benchmark standard data row
const STAGGER_MS = 45; // 40-60ms band (DESIGN.md)
const MAX_STAGGERED = 8; // beyond this, rows appear instantly

export type DataColumnAlign = 'left' | 'right' | 'center';

export interface DataColumn<T> {
  key: string;
  header: string;
  /** Shorter header shown below sm: */
  shortHeader?: string;
  align?: DataColumnAlign;
  /** Tailwind width/visibility classes for the matching <col>. */
  colClassName?: string;
  /** Hide this column below the sm breakpoint. */
  hideBelowSm?: boolean;
  /**
   * Force mono + tabular-nums on the <td> itself even for a left-aligned
   * column. Required for any cell whose text carries digits (addresses,
   * budget %, ids) so the numerals law holds and the parity mono-tabular
   * probe — which reads the cell's OWN computed font — counts it.
   * `align: 'right'` columns get this implicitly.
   */
  mono?: boolean;
  /** Make this column's header a sortable button (requires sort/onSortChange). */
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
}

export type SortDir = 'asc' | 'desc';

export interface DataTableSort {
  key: string;
  dir: SortDir;
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  empty?: React.ReactNode;
  /** Stagger row entrances (first 8). Off for static/long lists. */
  animateRows?: boolean;
  /** aria-label for the <table>. */
  label?: string;
  /**
   * Active sort. When provided, headers become sortable buttons that emit
   * `onSortChange` and carry `aria-sort`. Columns opt in via `sortable`.
   */
  sort?: DataTableSort;
  onSortChange?: (key: string) => void;
  /** Rendered above the table (search, filters) inside the bordered shell. */
  toolbar?: React.ReactNode;
  className?: string;
}

const alignClass: Record<DataColumnAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const HEADER_BASE =
  'py-2 px-2 text-2xs font-medium uppercase tracking-widest text-muted';
const CELL_BASE = 'px-2 py-2 align-middle text-xs';

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 8,
  empty,
  animateRows = false,
  label,
  sort,
  onSortChange,
  toolbar,
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={[
        'w-full overflow-x-auto rounded-md border border-border bg-surface',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-2 border-b border-border">
          {toolbar}
        </div>
      )}
      <table
        className="w-full border-collapse table-fixed"
        aria-label={label}
        style={{ minWidth: '640px' }}
      >
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} className={col.colClassName} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border" style={{ backgroundColor: 'var(--metador-surface)' }}>
            {columns.map((col) => {
              const isSortable = Boolean(col.sortable && sort && onSortChange);
              const isActive = isSortable && sort?.key === col.key;
              const ariaSort: 'ascending' | 'descending' | 'none' | undefined =
                isSortable
                  ? isActive
                    ? sort?.dir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined;
              const headerLabel = col.shortHeader ? (
                <>
                  <span className="hidden sm:inline">{col.header}</span>
                  <span className="sm:hidden">{col.shortHeader}</span>
                </>
              ) : (
                col.header
              );
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={[
                    HEADER_BASE,
                    alignClass[col.align ?? 'left'],
                    col.align === 'right' ? 'font-mono' : '',
                    col.hideBelowSm ? 'hidden sm:table-cell' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(col.key)}
                      className={[
                        'inline-flex items-center gap-1',
                        col.align === 'right' ? 'flex-row-reverse' : 'flex-row',
                        'transition-colors duration-(--metador-duration-fast)',
                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs',
                        isActive ? 'text-primary' : 'text-muted hover:text-text',
                      ].join(' ')}
                      aria-label={`Sort by ${col.header}`}
                    >
                      {headerLabel}
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        aria-hidden="true"
                        style={{
                          opacity: isActive ? 1 : 0.35,
                          transform:
                            isActive && sort?.dir === 'asc'
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',
                          transition: 'transform var(--metador-duration-fast)',
                        }}
                      >
                        <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : (
                    headerLabel
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <tr
                key={`skel-${i}`}
                className="border-b border-border/50"
                style={{ height: `${ROW_HEIGHT}px` }}
                data-skeleton="true"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      CELL_BASE,
                      col.hideBelowSm ? 'hidden sm:table-cell' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div
                      className="h-3 rounded-xs animate-skeleton"
                      style={{
                        width: col.align === 'right' ? '60%' : '75%',
                        marginLeft: col.align === 'right' ? 'auto' : undefined,
                        backgroundColor: 'var(--metador-skeleton-base)',
                      }}
                      aria-hidden="true"
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-muted text-sm"
              >
                {empty ?? 'No data'}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const staggered = animateRows && i < MAX_STAGGERED;
              return (
                <tr
                  key={rowKey(row)}
                  className={[
                    'group border-b border-border/50 hover:bg-raised',
                    'transition-colors duration-(--metador-duration-fast)',
                    staggered ? 'motion-safe:animate-row-enter' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    ...(staggered
                      ? { animationDelay: `${i * STAGGER_MS}ms` }
                      : undefined),
                  }}
                >
                  {columns.map((col) => {
                    const isMono = col.mono || col.align === 'right';
                    return (
                      <td
                        key={col.key}
                        className={[
                          CELL_BASE,
                          alignClass[col.align ?? 'left'],
                          isMono ? 'font-mono tabular-nums' : '',
                          col.align === 'right' ? 'whitespace-nowrap' : '',
                          'text-text',
                          col.hideBelowSm ? 'hidden sm:table-cell' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={
                          isMono
                            ? { fontVariantNumeric: 'tabular-nums lining-nums' }
                            : undefined
                        }
                      >
                        {col.render(row)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
