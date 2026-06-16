'use client';

import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { AddressPill } from '@metador/ui';
import { MOCK_POSITIONS, computePortfolioKpis } from './mock-positions';
import type { PortfolioPosition } from './mock-positions';
import { formatBaseUnits } from '@metador/deepbook';

// ── Formatters ────────────────────────────────────────────────────────────────
// All money in bigint base units; these produce display strings only.

function fmt(amount: bigint, decimals: number, digits = 2): string {
  return formatBaseUnits(amount < 0n ? -amount : amount, decimals, {
    maxFractionDigits: digits,
  });
}

function fmtSigned(amount: bigint, decimals: number, digits = 2): string {
  const sign = amount >= 0n ? '+' : '-';
  return `${sign}${fmt(amount, decimals, digits)}`;
}

/** Compact K/M/B at 2dp — display only, no money math. */
function fmtCompact(amount: bigint, decimals: number): string {
  // Safe: only used for display KPIs, never for math
  const whole = Number(amount / 10n ** BigInt(decimals));
  if (whole >= 1_000_000_000) return `$${(whole / 1_000_000_000).toFixed(2)}B`;
  if (whole >= 1_000_000) return `$${(whole / 1_000_000).toFixed(2)}M`;
  if (whole >= 1_000) return `$${(whole / 1_000).toFixed(2)}K`;
  return `$${whole.toFixed(2)}`;
}

function pnlPct(pnl: bigint, deposited: bigint): string {
  if (deposited === 0n) return '—';
  // Integer arithmetic: pct × 100 in basis points, then shift 2dp
  const bp = (pnl * 10_000n) / deposited;
  const sign = bp >= 0n ? '+' : '-';
  const absBp = bp < 0n ? -bp : bp;
  const integer = absBp / 100n;
  const frac = absBp % 100n;
  return `${sign}${integer}.${String(frac).padStart(2, '0')}%`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── KPI strip ─────────────────────────────────────────────────────────────────

interface KpiItem {
  label: string;
  value: string;
  deltaStr?: string;
  deltaKind?: 'success' | 'danger' | 'neutral';
}

function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div
      role="list"
      className="flex flex-wrap border-b border-border"
      aria-label="Portfolio summary"
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          role="listitem"
          className={[
            'flex flex-col gap-1 py-4 pr-8',
            i > 0 ? 'pl-8 border-l border-border' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span
            className="text-2xs font-medium uppercase tracking-widest text-muted"
            aria-label={item.label}
          >
            {item.label}
          </span>
          <span
            className="text-text"
            style={{
              fontFamily: 'var(--metador-font-mono)',
              fontVariantNumeric: 'tabular-nums lining-nums',
              fontSize: 'var(--metador-text-4xl)',
              lineHeight: '1',
              fontWeight: 'var(--metador-weight-medium)',
            }}
          >
            {item.value}
          </span>
          {item.deltaStr !== undefined && (
            <span
              className={[
                'text-sm',
                item.deltaKind === 'success'
                  ? 'text-success'
                  : item.deltaKind === 'danger'
                    ? 'text-danger'
                    : 'text-muted',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                fontFamily: 'var(--metador-font-mono)',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {item.deltaStr}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PortfolioPosition['status'] }) {
  const styles: Record<PortfolioPosition['status'], string> = {
    active: 'text-success bg-tint-success',
    revoked: 'text-revoke bg-tint-revoke',
    expired: 'text-muted bg-raised',
  };
  return (
    <span
      className={[
        'inline-flex items-center rounded-xs px-1.5 py-0.5',
        'text-2xs font-medium uppercase tracking-widest',
        styles[status],
      ].join(' ')}
    >
      {status}
    </span>
  );
}

// ── Holdings table row ────────────────────────────────────────────────────────

function PositionRow({ p }: { p: PortfolioPosition }) {
  const pnlColor = p.pnl > 0n ? 'text-success' : p.pnl < 0n ? 'text-danger' : 'text-muted';

  return (
    <tr
      className="border-b border-border last:border-0 transition-colors duration-(--metador-duration-fast) hover:bg-raised"
      style={{ height: '40px' }}
    >
      {/* Vault name + pool — left-aligned identifier */}
      <td className="pl-4 pr-3 py-2">
        <Link
          href={`/vault/${p.vaultId}`}
          className="text-sm text-text font-medium hover:text-primary transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg rounded-xs"
        >
          {p.vaultName}
        </Link>
        <p className="text-2xs text-muted mt-0.5 uppercase tracking-wide">
          {p.pool} · {p.strategy}
        </p>
      </td>
      {/* Status */}
      <td className="px-3 py-2">
        <StatusBadge status={p.status} />
      </td>
      {/* Deposited — right-aligned numeric */}
      <td
        className="px-3 py-2 text-sm text-muted text-right"
        style={{
          fontFamily: 'var(--metador-font-mono)',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {fmt(p.deposited, p.quoteDecimals)}
        <span className="text-2xs text-faint ml-1">{p.quoteSymbol}</span>
      </td>
      {/* Current value — right-aligned numeric */}
      <td
        className="px-3 py-2 text-sm text-text text-right"
        style={{
          fontFamily: 'var(--metador-font-mono)',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {fmt(p.currentValue, p.quoteDecimals)}
        <span className="text-2xs text-faint ml-1">{p.quoteSymbol}</span>
      </td>
      {/* PnL — right-aligned, semantic color */}
      <td
        className={['px-3 py-2 text-sm text-right', pnlColor].join(' ')}
        style={{
          fontFamily: 'var(--metador-font-mono)',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {fmtSigned(p.pnl, p.quoteDecimals)}
        <span
          className="text-2xs ml-1 opacity-70"
          style={{ fontFamily: 'var(--metador-font-mono)' }}
        >
          {pnlPct(p.pnl, p.deposited)}
        </span>
      </td>
      {/* Entered date — right-aligned */}
      <td
        className="px-3 py-2 text-sm text-muted text-right"
        style={{
          fontFamily: 'var(--metador-font-mono)',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {formatDate(p.enteredAtMs)}
      </td>
      {/* Action */}
      <td className="pl-3 pr-4 py-2 text-right">
        <Link
          href={`/vault/${p.vaultId}`}
          className="text-2xs font-medium text-primary hover:text-primary-bright transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg rounded-xs uppercase tracking-widest"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ connected }: { connected: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      {/* Icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="text-faint"
      >
        <rect
          x="4"
          y="4"
          width="24"
          height="24"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 16h12M16 10v12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm font-medium text-muted">
        {connected ? 'No positions yet' : 'Wallet not connected'}
      </p>
      <p className="text-sm text-faint max-w-xs text-center leading-relaxed">
        {connected
          ? 'Your on-chain vault positions appear here once you deposit.'
          : 'Connect your wallet to view vault positions, PnL, and history.'}
      </p>
      <Link
        href="/"
        className="mt-2 text-sm text-primary underline-offset-2 underline hover:text-primary-bright transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
      >
        Browse the marketplace
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const account = useCurrentAccount();

  // In G1 this is replaced by a keel_core chain read.
  // For the G1 shell: show mock positions when connected, empty state otherwise.
  const positions = account ? MOCK_POSITIONS : [];
  const kpis = computePortfolioKpis(positions);

  const hasPositions = positions.length > 0;

  const totalPnlKind =
    kpis.totalPnl > 0n ? 'success' : kpis.totalPnl < 0n ? 'danger' : 'neutral';

  const kpiItems: KpiItem[] = [
    {
      label: 'Total value',
      value: fmtCompact(kpis.totalCurrentValue, 6),
    },
    {
      label: 'Deposited',
      value: fmtCompact(kpis.totalDeposited, 6),
    },
    {
      label: 'Unrealised PnL',
      value: fmtCompact(
        kpis.totalPnl < 0n ? -kpis.totalPnl : kpis.totalPnl,
        6,
      ),
      deltaStr:
        kpis.totalDeposited > 0n
          ? pnlPct(kpis.totalPnl, kpis.totalDeposited)
          : undefined,
      deltaKind: totalPnlKind,
    },
    {
      label: 'Active vaults',
      value: String(kpis.activeCount),
    },
  ];

  return (
    <section aria-labelledby="portfolio-heading">
      {/* Page header */}
      <div className="flex items-baseline justify-between mb-6">
        <h1
          id="portfolio-heading"
          className="text-2xl font-semibold text-text"
        >
          Portfolio
        </h1>
        {account && (
          <div className="flex items-center gap-2 text-2xs text-muted">
            <span className="uppercase tracking-widest">Wallet</span>
            <AddressPill
              address={account.address}
              explorerHref={`https://suiscan.xyz/testnet/account/${account.address}`}
            />
          </div>
        )}
      </div>

      {/* KPI strip — unboxed, divider-delimited, ~49px numbers */}
      {hasPositions && <KpiStrip items={kpiItems} />}

      {/* Holdings */}
      {hasPositions ? (
        <div className="mt-6">
          <h2 className="text-2xs font-medium uppercase tracking-widest text-muted mb-3">
            Holdings
          </h2>

          {/* Table — ~40px rows */}
          <div className="rounded-md border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" aria-label="Vault positions">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th
                      scope="col"
                      className="pl-4 pr-3 py-2 text-left text-2xs font-medium uppercase tracking-widest text-muted"
                    >
                      Vault
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left text-2xs font-medium uppercase tracking-widest text-muted"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right text-2xs font-medium uppercase tracking-widest text-muted"
                    >
                      Deposited
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right text-2xs font-medium uppercase tracking-widest text-muted"
                    >
                      Current value
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right text-2xs font-medium uppercase tracking-widest text-muted"
                    >
                      PnL
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right text-2xs font-medium uppercase tracking-widest text-muted"
                    >
                      Entered
                    </th>
                    <th scope="col" className="pl-3 pr-4 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <PositionRow key={p.vaultId} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk note */}
          <p className="text-xs text-faint mt-4 leading-relaxed max-w-2xl">
            Values shown are mock estimates for the G1 shell. On-chain portfolio
            reads from{' '}
            <span className="font-code text-xs">keel_core</span> in G1.
            Funds cannot be stolen; losses are capped by your ceiling per vault.
          </p>
        </div>
      ) : (
        <EmptyState connected={!!account} />
      )}
    </section>
  );
}
