import * as React from 'react';
import { Skeleton } from '../skeleton/Skeleton';

export type ColumnAlign = 'left' | 'right' | 'center';

export interface ColumnConfig<T> {
  key: string;
  header: string;
  align?: ColumnAlign;
  /** Render cell content from a row */
  render: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: ColumnConfig<T>[];
  rows: T[];
  /** Unique key extractor for each row */
  rowKey: (row: T) => string;
  loading?: boolean;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  empty?: React.ReactNode;
  className?: string;
}

const alignClass: Record<ColumnAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/** Dense numeric table: compact rows, mono right-aligned numeric columns. */
export function Table<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 5,
  empty,
  className,
}: TableProps<T>) {
  return (
    <div className={['w-full overflow-x-auto', className].filter(Boolean).join(' ')}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  'py-2 px-2',
                  'text-2xs font-medium uppercase tracking-widest text-muted',
                  alignClass[col.align ?? 'left'],
                  // Right-aligned columns use mono for headers too (DESIGN.md)
                  col.align === 'right' ? 'font-mono' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={`skel-${i}`} className="border-b border-border/50">
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 px-2">
                      <Skeleton variant="text" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0
              ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-8 text-center text-muted text-sm"
                  >
                    {empty ?? 'No data'}
                  </td>
                </tr>
              )
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={[
                      'border-b border-border/50',
                      'hover:bg-raised',
                      'transition-colors duration-(--metador-duration-fast)',
                    ].join(' ')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={[
                          'py-2 px-2 text-sm text-text',
                          alignClass[col.align ?? 'left'],
                          col.align === 'right'
                            ? 'font-mono tabular-nums lining-nums'
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={
                          col.align === 'right'
                            ? { fontVariantNumeric: 'tabular-nums lining-nums' }
                            : undefined
                        }
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
}
