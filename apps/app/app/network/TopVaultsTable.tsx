'use client';

/**
 * TopVaultsTable — composes @metador/ui DataTable with a toolbar (search +
 * sort) and pagination footer. Reuses DataTable's skeleton + empty states.
 * AddressPill: copyable address chip in font-code. Budget bar inline.
 */

import * as React from 'react';
import { DataTable, type DataColumn } from '@metador/ui';
import type { TopVault } from './fixtures';
import { formatDbusdc, shortenAddress } from './fixtures';

interface TopVaultsTableProps {
  vaults: TopVault[];
  loading?: boolean;
}

// ── Address pill ──────────────────────────────────────────────────────────────

function AddressPill({ address }: { address: string }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy ${address}`}
      className="inline-flex items-center gap-1 border border-border rounded-sm px-1.5 py-0.5 text-muted hover:text-text hover:border-primary-deep transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      style={{
        fontSize: 'var(--metador-text-2xs)',
        fontFamily: 'var(--metador-font-code)',
        transitionDuration: 'var(--metador-duration-fast)',
        backgroundColor: 'var(--metador-bg)',
      }}
      aria-label={copied ? 'Address copied' : `Copy address ${address}`}
    >
      {shortenAddress(address)}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        {copied ? (
          <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="3.5" y="1" width="5.5" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
            <rect x="1" y="3.5" width="5.5" height="6" rx="1" fill="var(--metador-surface)" stroke="currentColor" strokeWidth="1" />
          </>
        )}
      </svg>
    </button>
  );
}

// ── Budget bar ────────────────────────────────────────────────────────────────

function BudgetBar({ bps }: { bps: number }) {
  const pct = Math.min(bps / 100, 100);
  const isAtCeiling = pct >= 100;
  const isNearCeiling = pct >= 80;
  const barColor = isAtCeiling
    ? 'var(--metador-primary-bright)'
    : isNearCeiling
    ? 'var(--metador-warn)'
    : 'var(--metador-primary)';

  return (
    <span className="inline-flex items-center gap-2 justify-end">
      <span
        className="rounded-sm overflow-hidden"
        style={{ width: 90, height: 5, backgroundColor: 'var(--metador-border)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Budget used ${pct.toFixed(0)}%`}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </span>
      <span
        className="tabular-nums text-2xs"
        style={{
          fontFamily: 'var(--metador-font-code)',
          fontVariantNumeric: 'tabular-nums lining-nums',
          color: isNearCeiling ? 'var(--metador-warn)' : 'var(--metador-muted)',
          minWidth: '3ch',
        }}
      >
        {isAtCeiling ? '⚠ ' : ''}{pct.toFixed(0)}%
      </span>
    </span>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TopVault['status'] }) {
  if (status === 'REVOKED') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-2xs font-medium tabular-nums"
        style={{
          fontFamily: 'var(--metador-font-code)',
          color: 'var(--metador-revoke)',
          backgroundColor: 'var(--metador-tint-revoke)',
        }}
        aria-label="Vault revoked"
      >
        ● REVOKED
      </span>
    );
  }
  if (status === 'PAUSED') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-2xs font-medium"
        style={{
          fontFamily: 'var(--metador-font-code)',
          color: 'var(--metador-muted)',
          backgroundColor: 'var(--metador-raised)',
        }}
        aria-label="Vault paused"
      >
        ● PAUSED
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-2xs font-medium"
      style={{
        fontFamily: 'var(--metador-font-code)',
        color: 'var(--metador-success)',
        backgroundColor: 'var(--metador-tint-success)',
      }}
      aria-label="Vault live"
    >
      ● LIVE
    </span>
  );
}

// ── Strategy tag ──────────────────────────────────────────────────────────────

function StrategyTag({ strategy }: { strategy: TopVault['strategy'] }) {
  const isDelegate = strategy === 'DELEGATE';
  return (
    <span
      className="text-2xs rounded-xs border px-1.5 py-0.5 ml-1.5"
      style={{
        fontFamily: 'var(--metador-font-code)',
        letterSpacing: '0.05em',
        color: isDelegate ? 'var(--metador-primary)' : 'var(--metador-muted)',
        borderColor: isDelegate ? 'var(--metador-primary-deep)' : 'var(--metador-border)',
      }}
    >
      {strategy}
    </span>
  );
}

// ── PnL cell ──────────────────────────────────────────────────────────────────

function PnlCell({ pnl }: { pnl: bigint }) {
  const isZero = pnl === 0n;
  const isPos = pnl > 0n;
  const color = isZero
    ? 'var(--metador-faint)'
    : isPos
    ? 'var(--metador-success)'
    : 'var(--metador-danger)';
  const prefix = isZero ? '' : isPos ? '+' : '';
  return (
    <span
      className="tabular-nums"
      style={{
        fontFamily: 'var(--metador-font-code)',
        fontVariantNumeric: 'tabular-nums lining-nums',
        color,
      }}
    >
      {isZero ? '0' : `${prefix}${formatDbusdc(isPos ? pnl : -pnl).replace('−', '')}`}
      {!isPos && pnl !== 0n && <span style={{ color }}>{''}</span>}
    </span>
  );
}

// ── Columns ───────────────────────────────────────────────────────────────────

const COLUMNS: DataColumn<TopVault>[] = [
  {
    key: 'vault',
    header: 'Vault',
    align: 'left',
    colClassName: 'w-[28%]',
    render: (row) => (
      <span className="inline-flex items-center">
        <span className="font-medium text-text" style={{ fontSize: 'var(--metador-text-xs)' }}>
          {row.name}
        </span>
        <StrategyTag strategy={row.strategy} />
      </span>
    ),
  },
  {
    key: 'leader',
    header: 'Leader',
    align: 'left',
    colClassName: 'w-[18%]',
    hideBelowSm: true,
    render: (row) => <AddressPill address={row.leaderAddress} />,
  },
  {
    key: 'pool',
    header: 'Pool',
    align: 'left',
    colClassName: 'w-[10%]',
    hideBelowSm: true,
    render: (row) => (
      <span className="text-muted" style={{ fontSize: 'var(--metador-text-xs)' }}>
        {row.pool}
      </span>
    ),
  },
  {
    key: 'tvl',
    header: 'TVL (DBUSDC)',
    shortHeader: 'TVL',
    align: 'right',
    sortable: true,
    colClassName: 'w-[13%]',
    render: (row) => formatDbusdc(row.tvlDbusdc),
  },
  {
    key: 'pnl30d',
    header: '30d PnL (DBUSDC)',
    shortHeader: '30d PnL',
    align: 'right',
    sortable: true,
    colClassName: 'w-[14%]',
    hideBelowSm: true,
    render: (row) => <PnlCell pnl={row.pnl30dDbusdc} />,
  },
  {
    key: 'budget',
    header: 'Budget used',
    shortHeader: 'Budget',
    align: 'right',
    colClassName: 'w-[11%]',
    hideBelowSm: true,
    render: (row) => <BudgetBar bps={row.budgetUsedBps} />,
  },
  {
    key: 'status',
    header: 'Status',
    align: 'right',
    colClassName: 'w-[10%]',
    render: (row) => <StatusPill status={row.status} />,
  },
];

// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}

function Pagination({ page, pageSize, total, onPage }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className="flex items-center justify-between px-3 py-2 border-t border-border text-muted"
      style={{ fontSize: 'var(--metador-text-2xs)' }}
    >
      <span>
        Showing{' '}
        <span className="text-text tabular-nums" style={{ fontFamily: 'var(--metador-font-code)' }}>
          {start}–{end}
        </span>{' '}
        of{' '}
        <span className="text-text tabular-nums" style={{ fontFamily: 'var(--metador-font-code)' }}>
          {total}
        </span>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-2 py-1 rounded-xs border border-border disabled:opacity-30 hover:text-text hover:border-primary-deep transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          style={{ transitionDuration: 'var(--metador-duration-fast)' }}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span
          className="px-2 tabular-nums"
          style={{ fontFamily: 'var(--metador-font-code)' }}
          aria-current="page"
        >
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded-xs border border-border disabled:opacity-30 hover:text-text hover:border-primary-deep transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          style={{ transitionDuration: 'var(--metador-duration-fast)' }}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

export function TopVaultsTable({ vaults, loading = false }: TopVaultsTableProps) {
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<string>('tvl');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return vaults.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.leaderAddress.toLowerCase().includes(q) ||
        v.pool.toLowerCase().includes(q),
    );
  }, [vaults, search]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'tvl') diff = Number(a.tvlDbusdc - b.tvlDbusdc);
      else if (sortKey === 'pnl30d') diff = Number(a.pnl30dDbusdc - b.pnl30dDbusdc);
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <div className="relative">
        <input
          type="search"
          placeholder="Search vault or leader…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-raised border border-border rounded-sm pl-7 pr-3 py-1.5 text-xs text-text placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-ring"
          style={{ width: 220 }}
          aria-label="Search vaults"
        />
        <svg
          className="absolute left-2 top-1/2 -translate-y-1/2 text-faint"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7.5 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-faint text-2xs ml-auto tabular-nums" style={{ fontFamily: 'var(--metador-font-code)' }}>
        {filtered.length} vault{filtered.length !== 1 ? 's' : ''}
      </span>
    </div>
  );

  return (
    <div
      className="bg-surface border border-border rounded-lg overflow-hidden"
      style={{ marginBottom: 0 }}
    >
      {/* Section header */}
      <div
        className="flex items-center px-4 py-4 border-b border-border"
      >
        <h2 className="font-medium text-text" style={{ fontSize: 'var(--metador-text-lg)' }}>
          Top Vaults
        </h2>
      </div>

      {/* DataTable with toolbar */}
      <DataTable
        columns={COLUMNS}
        rows={paginated}
        rowKey={(r) => r.id}
        loading={loading}
        skeletonRows={PAGE_SIZE}
        animateRows
        label="Top vaults leaderboard"
        sort={{ key: sortKey, dir: sortDir }}
        onSortChange={handleSort}
        toolbar={toolbar}
        empty={
          <span className="text-muted text-sm">
            No vaults match &ldquo;{search}&rdquo;
          </span>
        }
        // Remove outer border/bg since we wrap it ourselves
        className="rounded-none border-0 bg-transparent"
      />

      {/* Pagination footer */}
      {!loading && filtered.length > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          onPage={setPage}
        />
      )}
    </div>
  );
}
