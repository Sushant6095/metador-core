'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, ChartShell, DataTable, PolicyCard, Stat } from '@metador/ui';
import type { DataColumn } from '@metador/ui';
import { formatBaseUnits } from '@metador/deepbook';
import { MOCK_VAULTS } from '../../lib/mock-vaults';
import type { MockVault } from '../../lib/mock-vaults';

// Demo leader (first curated vault's leader) — lets ?demo=1 render the full
// leader cockpit without a connected wallet so the density grammar is
// screenshot- and design-review-reachable. G1 uses the connected account only.
const DEMO_LEADER = MOCK_VAULTS[0]!.leader;

// Cockpit shows the leader's vaults for the connected address.
// If no wallet, show the "Connect as vault leader" empty state.

interface OpenOrder {
  id: string;
  pool: string;
  side: 'buy' | 'sell';
  qty: string;
  price: string;
  filledPct: number;
  status: 'open';
}

// Mock open orders so the cockpit shows the screener density grammar rather
// than only an empty state (G1 wires live DeepBook orders). Deterministic.
const OPEN_ORDERS: OpenOrder[] = [
  { id: 'o1', pool: 'DEEP/SUI', side: 'buy', qty: '12,000.00', price: '3.41', filledPct: 64, status: 'open' },
  { id: 'o2', pool: 'DEEP/SUI', side: 'sell', qty: '8,000.00', price: '3.55', filledPct: 0, status: 'open' },
  { id: 'o3', pool: 'DEEP/SUI', side: 'buy', qty: '4,250.00', price: '3.38', filledPct: 100, status: 'open' },
];

// Screener density grammar (40px rows / 13px cells / 12px headers / mono right).
const ORDER_COLUMNS: DataColumn<OpenOrder>[] = [
  {
    key: 'pool',
    header: 'Pool',
    align: 'left',
    colClassName: 'w-[26%] min-w-[110px]',
    render: (o) => <span className="font-mono text-xs text-muted">{o.pool}</span>,
  },
  {
    key: 'side',
    header: 'Side',
    align: 'left',
    colClassName: 'w-[14%] min-w-[64px]',
    render: (o) => (
      <span
        className={
          o.side === 'buy'
            ? 'text-success text-xs font-medium uppercase tracking-widest'
            : 'text-danger text-xs font-medium uppercase tracking-widest'
        }
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
    header: 'Filled',
    align: 'right',
    colClassName: 'w-[20%] min-w-[80px]',
    render: (o) => (
      <span className={o.filledPct === 100 ? 'text-success' : o.filledPct === 0 ? 'text-muted' : 'text-text'}>
        {o.filledPct}%
      </span>
    ),
  },
];

/**
 * Sum TVL per quote currency from a vault list using bigint math only.
 * Returns separate totals for SUI (9dp) and DBUSDC (6dp) so neither is
 * silently dropped when a leader holds both.
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
      // DBUSDC (6 dp)
      dbusdc6Total += v.tvl;
    }
  }
  return { suiTotal, dbusdc6Total };
}

function LeaderVaultSection({ leaderAddress }: { leaderAddress: string }) {
  const leaderVaults = MOCK_VAULTS.filter(
    (v) => v.leader.toLowerCase() === leaderAddress.toLowerCase(),
  );

  const { suiTotal, dbusdc6Total } = computeLeaderTvlByCurrency(leaderVaults);

  const totalFollowers = leaderVaults.reduce((acc, v) => acc + v.followers, 0);

  // Build a human-readable TVL string covering both currencies.
  // Shows "—" only when truly zero across every vault.
  const tvlParts: string[] = [];
  if (suiTotal > 0n) {
    tvlParts.push(`${formatBaseUnits(suiTotal, 9, { maxFractionDigits: 2 })} SUI`);
  }
  if (dbusdc6Total > 0n) {
    tvlParts.push(`${formatBaseUnits(dbusdc6Total, 6, { maxFractionDigits: 2 })} DBUSDC`);
  }
  const totalTvlStr = tvlParts.length > 0 ? tvlParts.join(' + ') : '—';

  const leaderVaultForPolicy = leaderVaults[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat row */}
      <div
        className="grid grid-cols-2 gap-4 p-4 bg-surface rounded-md border border-border sm:grid-cols-3"
        role="group"
        aria-label="Cockpit stats"
      >
        <Stat label="My Vaults" value={String(leaderVaults.length)} />
        <Stat label="Total TVL" value={totalTvlStr} />
        <Stat label="Total Followers" value={String(totalFollowers)} />
      </div>

      {/* NAV chart shell */}
      <Card className="p-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
          Vault NAV
        </h2>
        <ChartShell label="NAV" aspect="3/1" />
      </Card>

      {/* Open orders table */}
      <Card className="p-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
          Open Orders
        </h2>
        <DataTable<OpenOrder>
          columns={ORDER_COLUMNS}
          rows={OPEN_ORDERS}
          rowKey={(o) => o.id}
          loading={false}
          animateRows
          label="Open orders"
          empty={
            <span className="text-muted text-sm">
              No open orders — trading lands in G1
            </span>
          }
        />
      </Card>

      {/* PolicyCard — leader sees their own walls */}
      {leaderVaultForPolicy && (
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
            Your policy walls (
            <span
              className="font-mono text-primary"
              style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
            >
              {leaderVaultForPolicy.name}
            </span>
            )
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
            status={leaderVaultForPolicy.status === 'revoked' ? 'revoked' : 'active'}
          />
        </div>
      )}

      {leaderVaults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-md border border-border bg-surface">
          <p className="text-muted text-sm">You have no vaults yet.</p>
          <Link
            href="/create"
            className="text-primary text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
          >
            Create your first vault
          </Link>
        </div>
      )}
    </div>
  );
}

function CockpitContent() {
  const account = useCurrentAccount();
  const searchParams = useSearchParams();
  const demo = searchParams?.get('demo') === '1';
  const leaderAddress = account?.address ?? (demo ? DEMO_LEADER : null);

  return (
    <section aria-labelledby="cockpit-heading">
      <h1
        id="cockpit-heading"
        className="text-2xl font-semibold text-text mb-6"
        style={{ fontFamily: 'var(--metador-font-display)' }}
      >
        Cockpit
      </h1>

      {leaderAddress ? (
        <LeaderVaultSection leaderAddress={leaderAddress} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-md border border-border bg-surface">
          <p
            className="text-lg font-semibold text-muted"
            style={{ fontFamily: 'var(--metador-font-display)' }}
          >
            Connect as a vault leader
          </p>
          <p className="text-sm text-faint max-w-sm text-center leading-relaxed">
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
