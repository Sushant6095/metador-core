import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@metador/ui';
import { formatDusdc, formatBps, plpUtilizationBps } from '@metador/deepbook';
import { PREDICT_VAULTS, MOCK_PLP_STATE } from '../../lib/mock-predict';
import type { PredictVaultSummary } from '@metador/deepbook';

export const metadata: Metadata = {
  title: 'Metador — Predict Vaults',
  description:
    'Non-custodial vault layer for DeepBook Predict. Deposit into a strategy vault — PLP supply or leveraged range hedge — under four-walls on-chain policy.',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function strategyLabel(strategy: PredictVaultSummary['strategy']): string {
  return strategy === 'plp_hedge' ? 'PLP + Hedge' : 'Range Ladder';
}

function strategyDescription(strategy: PredictVaultSummary['strategy']): string {
  return strategy === 'plp_hedge'
    ? 'Supplies capital to the PLP counterparty pool and hedges with OTM ranges.'
    : 'Deploys a ladder of OTM range positions across consecutive expiries.';
}

function sharesNav(vault: PredictVaultSummary): string {
  if (vault.shareSupply === 0n) return '—';
  // NAV per share = nav / shareSupply (both 6dp dUSDC / 6dp shares → raw ratio)
  const navPerShare = (vault.nav * 1_000_000n) / vault.shareSupply;
  return `$${formatDusdc(navPerShare, 4)}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function VaultStatusBadge({ revoked }: { revoked: boolean }) {
  if (revoked) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-2xs font-semibold uppercase tracking-widest border"
        style={{
          backgroundColor: 'var(--metador-tint-revoke)',
          borderColor: 'var(--metador-revoke)',
          color: 'var(--metador-revoke)',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--metador-revoke)' }}
          aria-hidden="true"
        />
        REVOKED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border border-success/30 text-success bg-success/10">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
      Live
    </span>
  );
}

// ── Vault card ────────────────────────────────────────────────────────────────

function PredictVaultCard({ vault }: { vault: PredictVaultSummary }) {
  const label = strategyLabel(vault.strategy);
  const desc = strategyDescription(vault.strategy);
  const utilBps = plpUtilizationBps({
    idleBalance: MOCK_PLP_STATE.idleBalance,
    allocatedCapital: MOCK_PLP_STATE.allocatedCapital,
  });

  return (
    <Link
      href={`/predict/${vault.vaultId}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-md"
      aria-label={`View ${label} vault details`}
    >
      <Card
        className="p-0 overflow-hidden transition-shadow duration-(--metador-duration-fast) group-hover:shadow-raised"
      >
        {/* Card header — strategy label + status */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
          <div className="flex flex-col gap-1 min-w-0">
            <span
              className="text-base font-semibold text-text truncate"
              style={{ fontFamily: 'var(--metador-font-display)' }}
            >
              {label}
            </span>
            <p className="text-xs text-muted leading-snug line-clamp-2">{desc}</p>
          </div>
          <VaultStatusBadge revoked={vault.policy.revoked} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <StatCell
            label="TVL (NAV)"
            value={`$${formatDusdc(vault.nav, 0)}`}
          />
          <StatCell
            label="NAV / Share"
            value={sharesNav(vault)}
          />
          <StatCell
            label="Roll Budget"
            value={`$${formatDusdc(vault.policy.perRollBudget, 0)}`}
          />
          <StatCell
            label="PLP Utilization"
            value={formatBps(utilBps)}
          />
        </div>

        {/* Footer — vault id + CTA hint */}
        <div className="flex items-center justify-between px-4 py-3">
          <span
            className="font-mono text-2xs text-faint truncate max-w-[180px]"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {vault.vaultId.slice(0, 20)}…
          </span>
          <span className="text-xs text-primary font-medium group-hover:text-primary-bright transition-colors duration-(--metador-duration-fast)">
            View vault →
          </span>
        </div>
      </Card>
    </Link>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 bg-surface">
      <span className="text-2xs uppercase tracking-widest text-muted">{label}</span>
      <span
        className="font-mono text-sm text-text"
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {value}
      </span>
    </div>
  );
}

// ── PLP summary strip ──────────────────────────────────────────────────────────

function PlpSummaryStrip() {
  const util = plpUtilizationBps({
    idleBalance: MOCK_PLP_STATE.idleBalance,
    allocatedCapital: MOCK_PLP_STATE.allocatedCapital,
  });
  const totalAum = MOCK_PLP_STATE.idleBalance + MOCK_PLP_STATE.allocatedCapital;

  return (
    <div
      className="rounded-md border border-border bg-surface px-4 py-3 flex flex-wrap gap-6"
      aria-label="PLP pool overview"
    >
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-widest text-muted">PLP Pool AUM</span>
        <span className="font-mono text-sm text-text" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
          ${formatDusdc(totalAum, 0)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-widest text-muted">Utilization</span>
        <span className="font-mono text-sm text-text" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
          {formatBps(util)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-widest text-muted">Payout Liability</span>
        <span className="font-mono text-sm text-warn" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
          ${formatDusdc(MOCK_PLP_STATE.payoutLiability, 0)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xs uppercase tracking-widest text-muted">Idle Balance</span>
        <span className="font-mono text-sm text-success" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
          ${formatDusdc(MOCK_PLP_STATE.idleBalance, 0)}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PredictVaultsPage() {
  return (
    <section aria-labelledby="predict-heading">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <h1
            id="predict-heading"
            className="text-2xl font-semibold text-text"
            style={{ fontFamily: 'var(--metador-font-display)' }}
          >
            Predict Vaults
          </h1>
          <span
            className="px-2 py-0.5 text-2xs font-medium uppercase tracking-widest rounded-xs border border-primary/30 text-primary bg-primary/10"
          >
            DeepBook Predict · Testnet
          </span>
        </div>
        <p className="text-sm text-muted max-w-prose leading-relaxed">
          Non-custodial strategy vaults for{' '}
          <span className="text-text font-medium">DeepBook Predict</span>. Each
          vault holds a locked{' '}
          <span className="font-mono text-xs text-faint">PredictTradeCap</span>{' '}
          under four-walls on-chain policy — budget, scope, expiry, revocability.
          Losses are real and capped by the vault&apos;s premium ceiling.
          <em> Funds cannot be stolen; losses are capped by your ceiling.</em>
        </p>
      </div>

      {/* PLP pool summary strip */}
      <div className="mb-6">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
          Counterparty pool (PLP)
        </h2>
        <PlpSummaryStrip />
      </div>

      {/* Vault grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
          Strategy vaults
        </h2>
        <Link
          href="/create"
          className="text-xs text-primary hover:text-primary-bright transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
        >
          + Create vault
        </Link>
      </div>

      {PREDICT_VAULTS.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-sm text-muted">No Predict vaults yet.</p>
          <Link href="/create" className="text-sm text-primary underline">
            Create the first vault
          </Link>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Predict strategy vaults"
        >
          {PREDICT_VAULTS.map((vault) => (
            <li key={vault.vaultId}>
              <PredictVaultCard vault={vault} />
            </li>
          ))}
        </ul>
      )}

      {/* Risk disclosure */}
      <div className="mt-8 rounded-md border border-warn/30 bg-warn/5 px-4 py-3">
        <p className="text-xs text-muted leading-relaxed">
          <span className="font-semibold text-warn">Risk disclosure:</span> Predict
          vaults deploy premium into leveraged range positions on DeepBook Predict.
          Premium paid is the maximum loss per position — you cannot lose more than
          the vault&apos;s per-roll budget ceiling. The on-chain policy walls
          enforce this cap. No earnings are promised or implied.
        </p>
      </div>
    </section>
  );
}
