'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { motion } from 'motion/react';
import { Card, ChartShell, DataTable, PolicyCard } from '@metador/ui';
import type { DataColumn } from '@metador/ui';
import { formatBaseUnits } from '@metador/deepbook';
import { DURATIONS_S, EASE_STANDARD } from '@metador/design-system';
import { MOCK_VAULTS } from '../../lib/mock-vaults';
import type { MockVault } from '../../lib/mock-vaults';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OpenOrder {
  id: string;
  pool: string;
  side: 'buy' | 'sell';
  qty: string;
  price: string;
  filledPct: number;
  status: 'open';
}

// Demo leader — lets ?demo=1 render the full cockpit without a connected wallet.
const DEMO_LEADER = MOCK_VAULTS[0]!.leader;

// Deterministic mock open orders — G1 wires live DeepBook data.
const OPEN_ORDERS: OpenOrder[] = [
  { id: 'o1', pool: 'DEEP/SUI', side: 'buy', qty: '12,000.00', price: '3.41', filledPct: 64, status: 'open' },
  { id: 'o2', pool: 'DEEP/SUI', side: 'sell', qty: '8,000.00', price: '3.55', filledPct: 0, status: 'open' },
  { id: 'o3', pool: 'DEEP/SUI', side: 'buy', qty: '4,250.00', price: '3.38', filledPct: 100, status: 'open' },
];

// ── Number flash — color in place on update, 120ms, no layout shift ──────────

interface FlashingNumericProps {
  value: string;
  /** 'success' | 'danger' | 'neutral' — drives the flash direction. */
  direction?: 'success' | 'danger' | 'neutral';
  className?: string;
}

/**
 * Numbers flash to their semantic color for --metador-duration-fast (120ms)
 * then return to text. Transition is color only — no transform, no layout.
 * prefers-reduced-motion: the global media query collapses transitions to ~0ms.
 */
function FlashingNumeric({ value, direction = 'neutral', className }: FlashingNumericProps) {
  const [flashing, setFlashing] = useState(false);
  const prevValue = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setFlashing(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFlashing(false), DURATIONS_S.fast * 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  const flashColor =
    direction === 'success'
      ? 'var(--metador-success)'
      : direction === 'danger'
        ? 'var(--metador-danger)'
        : 'var(--metador-text)';

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums lining-nums',
        color: flashing ? flashColor : 'var(--metador-text)',
        transition: `color ${DURATIONS_S.fast}s ${EASE_STANDARD.join(', ')}`,
      }}
    >
      {value}
    </span>
  );
}

// ── Open orders table columns ─────────────────────────────────────────────────

const ORDER_COLUMNS: DataColumn<OpenOrder>[] = [
  {
    key: 'pool',
    header: 'Pool',
    align: 'left',
    colClassName: 'w-[26%] min-w-[110px]',
    render: (o) => (
      <span
        className="text-xs"
        style={{
          fontFamily: 'var(--metador-font-code)',
          color: 'var(--metador-muted)',
        }}
      >
        {o.pool}
      </span>
    ),
  },
  {
    key: 'side',
    header: 'Side',
    align: 'left',
    colClassName: 'w-[14%] min-w-[64px]',
    render: (o) => (
      <span
        className="text-xs font-medium uppercase tracking-widest"
        style={{
          color:
            o.side === 'buy'
              ? 'var(--metador-success)'
              : 'var(--metador-danger)',
        }}
      >
        {o.side}
      </span>
    ),
  },
  {
    key: 'qty',
    header: 'Qty',
    align: 'right',
    colClassName: 'w-[22%] min-w-[100px]',
    render: (o) => o.qty,
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    colClassName: 'w-[18%] min-w-[90px]',
    render: (o) => o.price,
  },
  {
    key: 'filled',
    header: 'Filled %',
    align: 'right',
    colClassName: 'w-[20%] min-w-[80px]',
    render: (o) => (
      <span
        style={{
          color:
            o.filledPct === 100
              ? 'var(--metador-success)'
              : o.filledPct === 0
                ? 'var(--metador-muted)'
                : 'var(--metador-text)',
        }}
      >
        {o.filledPct}
      </span>
    ),
  },
];

// ── Vault row mini-table ──────────────────────────────────────────────────────

interface VaultRowProps {
  vault: MockVault;
}

function VaultRow({ vault }: VaultRowProps) {
  const tvl = formatBaseUnits(vault.tvl, vault.quoteDecimals, { maxFractionDigits: 2 });
  const pnlAbs = vault.pnl30d < 0n ? -vault.pnl30d : vault.pnl30d;
  const pnlSign = vault.pnl30d >= 0n ? '+' : '−';
  const pnlStr = `${pnlSign}${formatBaseUnits(pnlAbs, vault.quoteDecimals, { maxFractionDigits: 2 })}`;
  const isRevoked = vault.status === 'revoked';

  return (
    <Link
      href={`/vault/${vault.id}`}
      className="flex items-center gap-3 px-3 py-2 rounded-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
      style={{
        transition: `background-color ${DURATIONS_S.fast}s var(--metador-ease-standard)`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
          'var(--metador-raised)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
      }}
    >
      {/* Vault name + strategy chip */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span
          className="text-sm font-medium truncate"
          style={{ color: 'var(--metador-text)' }}
        >
          {vault.name}
        </span>
        <span
          className="text-2xs uppercase tracking-widest"
          style={{ color: 'var(--metador-faint)' }}
        >
          {vault.strategy} · {vault.pool}
        </span>
      </div>
      {/* TVL */}
      <div className="text-right min-w-[80px]">
        <span
          className="text-xs"
          style={{
            fontVariantNumeric: 'tabular-nums lining-nums',
            color: 'var(--metador-text)',
          }}
        >
          {tvl}
        </span>
        <span
          className="ml-1 text-2xs"
          style={{ color: 'var(--metador-faint)' }}
        >
          {vault.quoteSymbol}
        </span>
      </div>
      {/* 30d PnL */}
      <div className="text-right min-w-[80px]">
        <span
          className="text-xs"
          style={{
            fontVariantNumeric: 'tabular-nums lining-nums',
            color:
              vault.pnl30d >= 0n
                ? 'var(--metador-success)'
                : 'var(--metador-danger)',
          }}
        >
          {pnlStr}
        </span>
      </div>
      {/* Status dot */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          backgroundColor: isRevoked
            ? 'var(--metador-faint)'
            : 'var(--metador-success)',
        }}
        aria-label={isRevoked ? 'revoked' : 'live'}
      />
    </Link>
  );
}

// ── KPI strip — unboxed, divider-delimited, ~56px numbers ────────────────────

interface KpiItem {
  label: string;
  value: string;
  accent?: boolean;
  subValue?: string;
}

function CockpitKpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="flex flex-wrap items-stretch" role="group" aria-label="Cockpit key metrics">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 px-4 py-3"
          style={{
            borderLeft: i === 0 ? 'none' : '1px solid var(--metador-border)',
            minWidth: '120px',
          }}
        >
          <span
            className="text-2xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--metador-muted)' }}
          >
            {item.label}
          </span>
          <FlashingNumeric
            value={item.value}
            direction={item.accent ? 'success' : 'neutral'}
            className="text-2xl font-medium leading-none"
          />
          {item.subValue && (
            <span
              className="text-2xs"
              style={{ color: 'var(--metador-faint)' }}
            >
              {item.subValue}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Leader TVL computation (bigint only) ──────────────────────────────────────

/**
 * Sum TVL per quote currency from a vault list using bigint math only.
 * Returns separate totals for SUI (9dp) and DBUSDC (6dp).
 */
export function computeLeaderTvlByCurrency(vaults: readonly MockVault[]): {
  suiTotal: bigint;
  dbusdc6Total: bigint;
} {
  let suiTotal = 0n;
  let dbusdc6Total = 0n;
  for (const v of vaults) {
    if (v.quoteSymbol === 'SUI') {
      suiTotal += v.tvl;
    } else {
      dbusdc6Total += v.tvl;
    }
  }
  return { suiTotal, dbusdc6Total };
}

// ── Leader cockpit section ────────────────────────────────────────────────────

function LeaderCockpit({ leaderAddress }: { leaderAddress: string }) {
  const leaderVaults = MOCK_VAULTS.filter(
    (v) => v.leader.toLowerCase() === leaderAddress.toLowerCase(),
  );

  const { suiTotal, dbusdc6Total } = computeLeaderTvlByCurrency(leaderVaults);

  const tvlParts: string[] = [];
  if (suiTotal > 0n) {
    tvlParts.push(`${formatBaseUnits(suiTotal, 9, { maxFractionDigits: 2 })} SUI`);
  }
  if (dbusdc6Total > 0n) {
    tvlParts.push(`${formatBaseUnits(dbusdc6Total, 6, { maxFractionDigits: 2 })} DBUSDC`);
  }
  const totalTvlStr = tvlParts.length > 0 ? tvlParts.join(' + ') : '—';
  const totalFollowers = leaderVaults.reduce((acc, v) => acc + v.followers, 0);
  const leaderVaultForPolicy = leaderVaults[0];

  if (leaderVaults.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-4 rounded-md"
        style={{
          border: '1px solid var(--metador-border)',
          backgroundColor: 'var(--metador-surface)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--metador-muted)' }}>
          You have no vaults yet.
        </p>
        <Link
          href="/create"
          className="text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
          style={{ color: 'var(--metador-primary)' }}
        >
          Create your first vault
        </Link>
      </div>
    );
  }

  return (
    /*
     * 1440 non-scrolling cockpit layout:
     * Top: KPI strip spanning full width (divider-delimited unboxed numbers)
     * Middle: [NAV chart 2/3] [Vault list 1/3]
     * Bottom: [Open orders 2/3] [Policy walls 1/3]
     *
     * Numbers flash color in place on update — layout never shifts.
     * At ≤1024px the grid collapses to single-column (natural scroll).
     */
    <div className="flex flex-col gap-6">
      {/* KPI strip */}
      <div
        className="rounded-md overflow-hidden"
        style={{
          border: '1px solid var(--metador-border)',
          backgroundColor: 'var(--metador-surface)',
        }}
      >
        <CockpitKpiStrip
          items={[
            {
              label: 'My Vaults',
              value: String(leaderVaults.length),
            },
            {
              label: 'Total TVL',
              value: totalTvlStr,
            },
            {
              label: 'Total Followers',
              value: String(totalFollowers),
              accent: true,
            },
            {
              label: 'Active Orders',
              value: String(OPEN_ORDERS.filter((o) => o.filledPct < 100).length),
            },
          ]}
        />
      </div>

      {/* Mid row: NAV chart + vault list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* NAV chart — 2/3 */}
        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-2xs font-medium uppercase tracking-widest"
                style={{ color: 'var(--metador-muted)' }}
              >
                Vault NAV
              </h2>
              {/* Live indicator */}
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--metador-success)' }}
                  aria-hidden="true"
                />
                <span
                  className="text-2xs uppercase tracking-widest"
                  style={{ color: 'var(--metador-success)' }}
                >
                  Live
                </span>
              </span>
            </div>
            <ChartShell label="NAV" aspect="3/1" />
          </Card>
        </div>

        {/* Vault list — 1/3 */}
        <div>
          <Card className="p-0 overflow-hidden h-full">
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: '1px solid var(--metador-border)' }}
            >
              <h2
                className="text-2xs font-medium uppercase tracking-widest"
                style={{ color: 'var(--metador-muted)' }}
              >
                My Vaults
              </h2>
              <div className="flex items-center gap-4">
                <span
                  className="text-2xs uppercase tracking-widest"
                  style={{ color: 'var(--metador-faint)' }}
                >
                  TVL
                </span>
                <span
                  className="text-2xs uppercase tracking-widest"
                  style={{ color: 'var(--metador-faint)' }}
                >
                  30d PnL
                </span>
                <span className="w-1.5" aria-hidden="true" />
              </div>
            </div>
            <nav aria-label="Leader vaults">
              {leaderVaults.map((vault) => (
                <motion.div
                  key={vault.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: DURATIONS_S.base,
                    ease: EASE_STANDARD,
                  }}
                >
                  <VaultRow vault={vault} />
                </motion.div>
              ))}
            </nav>
          </Card>
        </div>
      </div>

      {/* Bottom row: open orders + policy walls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Open orders table — 2/3 */}
        <div className="lg:col-span-2">
          <div
            className="flex items-center justify-between mb-3"
          >
            <h2
              className="text-2xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--metador-muted)' }}
            >
              Open Orders
            </h2>
            <span
              className="text-2xs uppercase tracking-widest"
              style={{ color: 'var(--metador-faint)' }}
            >
              Units in headers
            </span>
          </div>
          <DataTable<OpenOrder>
            columns={ORDER_COLUMNS}
            rows={OPEN_ORDERS}
            rowKey={(o) => o.id}
            loading={false}
            animateRows
            label="Open orders"
            empty={
              <span className="text-sm" style={{ color: 'var(--metador-muted)' }}>
                No open orders — trading lands in G1
              </span>
            }
          />
        </div>

        {/* Policy walls — 1/3 */}
        {leaderVaultForPolicy && (
          <div className="flex flex-col gap-3">
            <h2
              className="text-2xs font-medium uppercase tracking-widest"
              style={{ color: 'var(--metador-muted)' }}
            >
              Policy walls —{' '}
              <span
                className="normal-case tracking-normal"
                style={{
                  fontFamily: 'var(--metador-font-code)',
                  color: 'var(--metador-primary)',
                  fontSize: 'inherit',
                }}
              >
                {leaderVaultForPolicy.name}
              </span>
            </h2>
            <PolicyCard
              pool={leaderVaultForPolicy.pool}
              budgetFormatted={formatBaseUnits(
                leaderVaultForPolicy.budget,
                leaderVaultForPolicy.quoteDecimals,
                { maxFractionDigits: 2 },
              )}
              quoteSymbol={leaderVaultForPolicy.quoteSymbol}
              expiresAtMs={leaderVaultForPolicy.expiresAtMs}
              revocable
              status={
                leaderVaultForPolicy.status === 'revoked' ? 'revoked' : 'active'
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function CockpitContent() {
  const account = useCurrentAccount();
  const searchParams = useSearchParams();
  const demo = searchParams?.get('demo') === '1';
  const leaderAddress = account?.address ?? (demo ? DEMO_LEADER : null);

  return (
    <section aria-labelledby="cockpit-heading">
      <div className="flex items-center justify-between mb-6">
        <h1
          id="cockpit-heading"
          className="text-2xl font-medium"
          style={{ color: 'var(--metador-text)' }}
        >
          Cockpit
        </h1>
        {leaderAddress && (
          <Link
            href="/create"
            className="text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
            style={{ color: 'var(--metador-primary)' }}
          >
            + New vault
          </Link>
        )}
      </div>

      {leaderAddress ? (
        <LeaderCockpit leaderAddress={leaderAddress} />
      ) : (
        /* Empty state — not connected */
        <div
          className="flex flex-col items-center justify-center py-24 gap-4 rounded-md"
          style={{
            border: '1px solid var(--metador-border)',
            backgroundColor: 'var(--metador-surface)',
          }}
        >
          <p
            className="text-lg font-medium"
            style={{ color: 'var(--metador-muted)' }}
          >
            Connect as a vault leader
          </p>
          <p
            className="text-sm max-w-sm text-center leading-relaxed"
            style={{ color: 'var(--metador-faint)' }}
          >
            Connect your wallet to view your vaults, open orders, and policy
            walls. Only the vault leader can access the cockpit.
          </p>
        </div>
      )}
    </section>
  );
}

export default function Cockpit() {
  return (
    <Suspense fallback={null}>
      <CockpitContent />
    </Suspense>
  );
}
