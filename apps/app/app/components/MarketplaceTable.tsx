'use client';

import * as React from 'react';
import Link from 'next/link';
import { AddressPill, DataTable } from '@metador/ui';
import type { DataColumn, DataTableSort } from '@metador/ui';
import { computeFillPercent } from '@metador/ui';
import { formatBaseUnits } from '@metador/deepbook';
import type { MockVault } from '../../lib/mock-vaults';

/**
 * MarketplaceTable — the client island that owns the dense DataTable for the
 * marketplace. The page stays a Server Component (route metadata + bigint
 * aggregates server-side) and hands this a serializable MockVault[]
 * (container/presentational split). Render functions, sort state, and the
 * search filter live here.
 *
 * Grammar: screener density (40px rows / 13px cells / 12px headers / mono
 * right-aligned), 7 columns, ≥3 right-aligned numeric, sortable headers
 * (aria-sort), search. Numerals law: every digit-bearing cell is mono+tabular
 * on the <td> via `align: 'right'` or the `mono` flag (DESIGN.md).
 */

type SortKey = 'name' | 'leader' | 'tvl' | 'pnl' | 'budget' | 'status';

const STATUS_RANK: Record<MockVault['status'], number> = {
  active: 0,
  expired: 1,
  revoked: 2,
};

function StrategyChip({ kind }: { kind: 'delegate' | 'dca' }) {
  const label = kind === 'delegate' ? 'Delegate' : 'DCA';
  const color =
    kind === 'delegate'
      ? 'text-primary bg-primary/10 border-primary/20'
      : 'text-muted bg-raised border-border';
  return (
    <span
      className={[
        'inline-block px-1.5 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border shrink-0',
        color,
      ].join(' ')}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: MockVault['status'] }) {
  if (status === 'revoked') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-2xs font-semibold uppercase tracking-widest border"
        style={{
          backgroundColor: 'var(--metador-tint-revoke)',
          borderColor: 'var(--metador-revoke)',
          color: 'var(--metador-revoke)',
        }}
      >
        <span className="inline-block w-1 h-1 rounded-full bg-revoke" aria-hidden="true" />
        REVOKED
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border border-warn/30 text-warn bg-warn/10">
        <span className="inline-block w-1 h-1 rounded-full bg-warn" aria-hidden="true" />
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border border-success/30 text-success bg-success/10">
      <span className="inline-block w-1 h-1 rounded-full bg-success" aria-hidden="true" />
      Live
    </span>
  );
}

function PnlCell({
  pnl,
  decimals,
  symbol,
}: {
  pnl: bigint;
  decimals: number;
  symbol: string;
}) {
  const isNeg = pnl < 0n;
  const isZero = pnl === 0n;
  const formatted = formatBaseUnits(isNeg ? -pnl : pnl, decimals, {
    maxFractionDigits: 2,
  });
  const colorClass = isZero ? 'text-muted' : isNeg ? 'text-danger' : 'text-success';
  const sign = isNeg ? '−' : isZero ? '' : '+';
  return (
    <span className={colorClass}>
      {sign}
      {formatted} <span className="text-faint">{symbol}</span>
    </span>
  );
}

function CompactBudgetBar({ spent, budget }: { spent: bigint; budget: bigint }) {
  const pct = computeFillPercent(spent, budget);
  const isWarn = pct >= 80 && pct < 100;
  const isLocked = pct >= 100;
  const barColor = isLocked
    ? 'var(--metador-faint)'
    : isWarn
      ? 'var(--metador-warn)'
      : 'var(--metador-primary)';
  return (
    <div
      className="flex items-center gap-1.5 w-full"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Budget ${Math.round(pct)}% used`}
      title={`${pct.toFixed(1)}% of budget used`}
    >
      <div
        className="relative flex-1 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--metador-raised)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
          aria-hidden="true"
        />
      </div>
      <span
        className="inline-flex items-center gap-0.5 shrink-0 w-[44px] justify-end"
        style={{
          color: isLocked
            ? 'var(--metador-faint)'
            : isWarn
              ? 'var(--metador-warn)'
              : 'var(--metador-muted)',
        }}
      >
        {(isWarn || isLocked) && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M6 1L11 10H1L6 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
        )}
        {isLocked ? 'MAX' : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

const COLUMNS: DataColumn<MockVault>[] = [
  {
    key: 'name',
    header: 'Vault',
    align: 'left',
    sortable: true,
    colClassName: 'w-[24%] min-w-[180px]',
    render: (v) => (
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href={`/vault/${v.id}`}
          className="font-medium text-xs text-text hover:text-primary truncate max-w-[160px] transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
        >
          {v.name}
        </Link>
        <StrategyChip kind={v.strategy} />
      </div>
    ),
  },
  {
    key: 'leader',
    header: 'Leader',
    align: 'left',
    mono: true, // hex carries digits → mono+tabular on the td (numerals law)
    hideBelowSm: true,
    colClassName: 'w-[14%] min-w-[120px] hidden sm:table-cell',
    render: (v) => (
      <AddressPill
        address={v.leader}
        explorerHref={`https://suiscan.xyz/testnet/account/${v.leader}`}
      />
    ),
  },
  {
    key: 'pool',
    header: 'Pool',
    align: 'left',
    mono: true, // pool labels are mono; keeps the column in the mono ratio
    hideBelowSm: true,
    colClassName: 'w-[12%] min-w-[110px] hidden sm:table-cell',
    render: (v) => <span className="text-muted">{v.pool}</span>,
  },
  {
    key: 'tvl',
    header: 'TVL',
    align: 'right',
    sortable: true,
    colClassName: 'w-[15%] min-w-[120px]',
    render: (v) => (
      <>
        {formatBaseUnits(v.tvl, v.quoteDecimals, { maxFractionDigits: 2 })}{' '}
        <span className="text-faint">{v.quoteSymbol}</span>
      </>
    ),
  },
  {
    key: 'pnl',
    header: '30d PnL',
    shortHeader: 'PnL',
    align: 'right',
    sortable: true,
    colClassName: 'w-[15%] min-w-[120px]',
    render: (v) => (
      <PnlCell pnl={v.pnl30d} decimals={v.quoteDecimals} symbol={v.quoteSymbol} />
    ),
  },
  {
    key: 'budget',
    header: 'Budget used',
    shortHeader: 'Budget',
    align: 'right',
    mono: true,
    sortable: true,
    colClassName: 'w-[12%] min-w-[120px]',
    render: (v) => <CompactBudgetBar spent={v.budgetSpent} budget={v.budget} />,
  },
  {
    key: 'status',
    header: 'Status',
    align: 'left',
    sortable: true,
    colClassName: 'w-[8%] min-w-[84px]',
    render: (v) => <StatusBadge status={v.status} />,
  },
];

function sortVaults(rows: MockVault[], sort: DataTableSort): MockVault[] {
  const key = sort.key as SortKey;
  const sorted = [...rows].sort((a, b) => {
    switch (key) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'leader':
        return a.leader.localeCompare(b.leader);
      case 'tvl':
        return a.tvl < b.tvl ? -1 : a.tvl > b.tvl ? 1 : 0;
      case 'pnl':
        return a.pnl30d < b.pnl30d ? -1 : a.pnl30d > b.pnl30d ? 1 : 0;
      case 'budget':
        return (
          computeFillPercent(a.budgetSpent, a.budget) -
          computeFillPercent(b.budgetSpent, b.budget)
        );
      case 'status':
        return STATUS_RANK[a.status] - STATUS_RANK[b.status];
      default:
        return 0;
    }
  });
  return sort.dir === 'asc' ? sorted : sorted.reverse();
}

export function MarketplaceTable({ vaults }: { vaults: MockVault[] }) {
  const [sort, setSort] = React.useState<DataTableSort>({ key: 'tvl', dir: 'desc' });
  const [query, setQuery] = React.useState('');

  const handleSortChange = (key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: key === 'name' || key === 'leader' ? 'asc' : 'desc' },
    );
  };

  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? vaults.filter((v) =>
          `${v.name} ${v.leader}`.toLowerCase().includes(needle),
        )
      : vaults;
    return sortVaults(filtered, sort);
  }, [vaults, sort, query]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search — inline above the table (kept out of the table shell so the
          dense rows start higher; the result count keeps the numerals law). */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          >
            <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vault or leader"
            aria-label="Search vaults by name or leader address"
            className="w-56 sm:w-64 pl-8 pr-3 py-1.5 rounded-xs text-xs bg-raised border border-border text-text placeholder:text-faint font-mono tabular-nums transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/screener"
            className="text-2xs text-muted hover:text-text uppercase tracking-widest transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
          >
            Full leaderboard →
          </Link>
          <span
            className="text-2xs text-muted font-mono"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            <span className="text-text">{rows.length}</span> / {vaults.length}
          </span>
        </div>
      </div>

      <DataTable<MockVault>
        columns={COLUMNS}
        rows={rows}
        rowKey={(v) => v.id}
        loading={false}
        animateRows
        label="Vault marketplace"
        sort={sort}
        onSortChange={handleSortChange}
        empty={
          <span className="text-muted text-sm">
            No vaults match — try clearing the search, or{' '}
            <Link
              href="/create"
              className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
            >
              create one
            </Link>
            .
          </span>
        }
      />
    </div>
  );
}
