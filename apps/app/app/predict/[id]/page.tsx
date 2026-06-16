'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ActivityRow,
  AddressPill,
  BudgetMeter,
  Button,
  Card,
  ChartShell,
  Modal,
  PolicyCard,
  Skeleton,
  Tabs,
} from '@metador/ui';
import type { TabItem } from '@metador/ui';
import { formatDusdc, formatBps } from '@metador/deepbook';
import { track, METADOR_EVENTS } from '@metador/analytics';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import {
  getPredictVault,
  getPredictVaultPositions,
  buildPredictFeed,
  MOCK_PLP_STATE,
  PREDICT_MARKETS,
} from '../../../lib/mock-predict';
import type { PredictFeedEntry } from '../../../lib/mock-predict';
import type { PredictVaultSummary, PredictPosition } from '@metador/deepbook';
import { SviSurface } from './SviSurface';
import { PlpRiskPanel } from './PlpRiskPanel';
// Reuse the existing RevokeDialog — no forking (CLAUDE.md §11 sync contracts)
import { RevokeDialog } from '../../vault/[id]/RevokeDialog';

// ── Strategy display helpers ──────────────────────────────────────────────────

function strategyLabel(strategy: PredictVaultSummary['strategy']): string {
  return strategy === 'plp_hedge' ? 'PLP + Hedge' : 'Range Ladder';
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ revoked }: { revoked: boolean }) {
  return (
    <span className="relative inline-flex items-center" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {revoked ? (
          <motion.span
            key="revoked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-xs font-semibold uppercase tracking-widest border"
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
          </motion.span>
        ) : (
          <motion.span
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATIONS_S.fast, ease: EASE_ENTER }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-xs font-medium uppercase tracking-widest border border-success/30 text-success bg-success/10"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
            Live
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── MeterStat ──────────────────────────────────────────────────────────────────

function MeterStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-2xs uppercase tracking-widest text-muted truncate">{label}</span>
      <span
        className="font-mono text-xs truncate"
        style={{
          fontVariantNumeric: 'tabular-nums lining-nums',
          color: accent ? 'var(--metador-primary)' : 'var(--metador-text)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Positions table ───────────────────────────────────────────────────────────

function PositionsTable({ positions }: { positions: readonly PredictPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        No open positions
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table
        className="w-full min-w-[560px] text-xs"
        aria-label="Open Predict positions"
      >
        <thead>
          <tr className="border-b border-border">
            {(['Range', 'Leverage', 'Qty', 'Entry Prob', 'Premium', 'Opened'] as const).map(
              (h) => (
                <th
                  key={h}
                  className="pb-2 text-2xs font-medium uppercase tracking-widest text-muted text-left first:pl-0 last:pr-0 px-2"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, i) => {
            const minsAgo = Math.round(
              (1_750_000_000_000 - pos.openedAtMs) / 60_000,
            );
            return (
              <motion.tr
                key={pos.orderId}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: DURATIONS_S.base,
                  ease: EASE_ENTER,
                  delay: i * 0.05,
                }}
                className="border-b border-border/50 hover:bg-raised/50 transition-colors duration-(--metador-duration-fast)"
              >
                <td className="py-2 px-2 first:pl-0">
                  <span
                    className="font-mono text-xs text-text"
                    style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                  >
                    ${formatDusdc(pos.lowerStrike, 0)}–${formatDusdc(pos.higherStrike, 0)}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span
                    className="inline-flex px-1.5 py-px rounded-xs text-2xs font-mono font-medium border"
                    style={{
                      color: 'var(--metador-primary)',
                      borderColor: 'var(--metador-primary)',
                      backgroundColor: 'rgba(242,165,22,0.08)',
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {pos.leverage}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span
                    className="font-mono text-xs text-text"
                    style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                  >
                    {formatDusdc(pos.quantity, 0)}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span
                    className="font-mono text-xs text-text"
                    style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                  >
                    {formatBps(pos.entryProbabilityBps)}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span
                    className="font-mono text-xs text-text"
                    style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                  >
                    ${formatDusdc(pos.premiumPaid, 2)}
                  </span>
                </td>
                <td className="py-2 px-2 last:pr-0">
                  <span
                    className="font-mono text-2xs text-faint"
                    style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                  >
                    {minsAgo}m ago
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── ActivityRow adapter — Predict feed kinds → ActivityRow's ActivityKind ────

function feedKindToActivityKind(
  kind: PredictFeedEntry['kind'],
): 'order' | 'rejected' | 'revoked' | 'deposit' | 'withdraw' {
  switch (kind) {
    case 'mint':
    case 'redeem':
      return 'order';
    case 'supply':
      return 'order';
    case 'rejected':
      return 'rejected';
    case 'revoked':
      return 'revoked';
    case 'withdraw':
      return 'withdraw';
    case 'deposit':
    default:
      return 'deposit';
  }
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function PredictVaultSkeleton() {
  return (
    <section aria-label="Loading predict vault" aria-busy="true">
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Skeleton variant="rect" width="280px" height="32px" />
          <Skeleton variant="rect" width="360px" height="20px" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rect" width="84px" height="32px" />
          <Skeleton variant="rect" width="84px" height="32px" />
        </div>
      </div>
      <div className="mb-6">
        <Skeleton variant="rect" width="160px" height="16px" className="mb-3" />
        <Skeleton variant="rect" height="160px" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Skeleton variant="rect" height="140px" />
          <Skeleton variant="rect" height="200px" />
          <Skeleton variant="rect" height="180px" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton variant="rect" width="120px" height="16px" />
          <Skeleton variant="rect" height="380px" />
        </div>
      </div>
    </section>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

const DETAIL_TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'surface', label: 'Vol Surface' },
  { value: 'plp', label: 'PLP Risk' },
];

function PredictVaultDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const vaultId = params?.id ?? '';
  const baseVault = getPredictVault(vaultId);

  const loading = searchParams?.get('loading') === '1';
  const revokeParam = searchParams?.get('revoke');
  const revokeOutcome =
    revokeParam === 'abort'
      ? 'abort'
      : revokeParam === 'reject'
        ? 'reject'
        : 'success';

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [locallyRevoked, setLocallyRevoked] = useState(false);
  const [heatBloom, setHeatBloom] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (baseVault) track(METADOR_EVENTS.vaultViewed, { vault_id: baseVault.vaultId });
  }, [baseVault]);

  if (loading) return <PredictVaultSkeleton />;

  if (!baseVault) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p
          className="text-2xl font-semibold text-muted"
          style={{ fontFamily: 'var(--metador-font-display)' }}
        >
          Vault not found
        </p>
        <p className="text-sm text-faint">
          The vault ID{' '}
          <span
            className="font-mono text-xs bg-raised border border-border px-1.5 py-0.5 rounded-xs"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {vaultId.slice(0, 20)}…
          </span>{' '}
          does not exist.
        </p>
        <Link
          href="/predict"
          className="text-primary text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
        >
          Back to Predict Vaults
        </Link>
      </div>
    );
  }

  const vault = baseVault;
  const isRevoked = vault.policy.revoked || locallyRevoked;
  const positions = getPredictVaultPositions(vaultId);
  const feed = buildPredictFeed(vault, isRevoked);
  const label = strategyLabel(vault.strategy);

  // Use the first available market for the vol surface (same pyth feed)
  const surfaceMarket = PREDICT_MARKETS[0];

  const budgetFormatted = `$${formatDusdc(vault.policy.perRollBudget, 0)}`;

  function handleDepositClick() {
    track(METADOR_EVENTS.depositStarted, { vault_id: vault.vaultId });
    setDepositModalOpen(true);
  }

  function handleCommitted() {
    setRevokeOpen(false);
    setLocallyRevoked(true);
    setHeatBloom(true);
    track(METADOR_EVENTS.vaultRevoked, { vault_id: vault.vaultId });
    window.setTimeout(() => setHeatBloom(false), DURATIONS_S.hero * 1000);
  }

  return (
    <section aria-labelledby="predict-vault-heading">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="relative flex flex-wrap items-center gap-3">
            {/* Heat bloom (REVOKE beat 2) */}
            <AnimatePresence>
              {heatBloom && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-4 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DURATIONS_S.hero, ease: EASE_ENTER }}
                  style={{ boxShadow: 'var(--metador-glow-revoke)' }}
                />
              )}
            </AnimatePresence>
            <h1
              id="predict-vault-heading"
              className="relative text-2xl font-semibold text-text"
              style={{ fontFamily: 'var(--metador-font-display)' }}
            >
              {label}
            </h1>
            <span className="relative">
              <StatusBadge revoked={isRevoked} />
            </span>
            <span
              className="px-2 py-0.5 text-2xs font-medium uppercase tracking-widest rounded-xs border border-primary/30 text-primary bg-primary/10"
            >
              DeepBook Predict
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>Leader</span>
            <AddressPill
              address={vault.leader}
              explorerHref={`https://suiscan.xyz/testnet/account/${vault.leader}`}
            />
            <span className="text-faint">·</span>
            <span>Owner</span>
            <AddressPill
              address={vault.owner}
              explorerHref={`https://suiscan.xyz/testnet/account/${vault.owner}`}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isRevoked ? (
            <span className="text-sm text-faint italic">Actions disabled — vault revoked</span>
          ) : (
            <>
              <Button variant="primary" size="sm" onClick={handleDepositClick}>
                Deposit
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Withdraw
              </Button>
              <Button variant="danger" size="sm" onClick={() => setRevokeOpen(true)}>
                Revoke
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Policy card (full width, the page hero) ─────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
            Policy walls
          </h2>
          <span className="text-2xs text-faint uppercase tracking-widest">
            Enforced on-chain
          </span>
        </div>
        <PolicyCard
          pool={`BTC/dUSDC (feed ${vault.policy.allowedPythFeedId})`}
          budgetFormatted={budgetFormatted}
          quoteSymbol="dUSDC"
          expiresAtMs={vault.policy.mandateExpiryMs}
          revocable
          status={isRevoked ? 'revoked' : 'active'}
          className="shadow-raised"
        />
      </div>

      {/* ── NAV + shares summary strip ─────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-md overflow-hidden border border-border">
        <NavStatCell
          label="NAV"
          value={`$${formatDusdc(vault.nav, 0)}`}
        />
        <NavStatCell
          label="Shares outstanding"
          value={formatDusdc(vault.shareSupply, 0)}
        />
        <NavStatCell
          label="In PLP"
          value={`$${formatDusdc(vault.plpSupplied, 0)}`}
        />
        <NavStatCell
          label="Hedge premium"
          value={`$${formatDusdc(vault.hedgePremium, 2)}`}
        />
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left 2/3: tabs — overview | vol surface | PLP risk */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Tabs
            items={DETAIL_TABS}
            value={activeTab}
            onChange={setActiveTab}
            layoutId="predict-vault-tabs"
          />

          {/* ── Overview tab ─────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* Budget meter — per-roll premium ceiling */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                    Per-roll budget meter
                  </h2>
                  {isRevoked && (
                    <span className="text-2xs text-faint uppercase tracking-widest">Locked</span>
                  )}
                </div>
                <div
                  style={{
                    filter: isRevoked ? 'grayscale(1)' : undefined,
                    opacity: isRevoked ? 0.6 : 1,
                    transition: `opacity ${DURATIONS_S.slow}s var(--metador-ease-standard), filter ${DURATIONS_S.slow}s var(--metador-ease-standard)`,
                  }}
                >
                  <BudgetMeter
                    spent={vault.hedgePremium}
                    budget={vault.policy.perRollBudget}
                    quoteDecimals={6}
                    quoteSymbol="dUSDC"
                  />
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                    <MeterStat
                      label="Used (hedge)"
                      value={`$${formatDusdc(vault.hedgePremium, 2)}`}
                    />
                    <MeterStat
                      label="Remaining"
                      value={`$${formatDusdc(
                        vault.policy.perRollBudget > vault.hedgePremium
                          ? vault.policy.perRollBudget - vault.hedgePremium
                          : 0n,
                        0,
                      )}`}
                      accent
                    />
                    <MeterStat
                      label="Ceiling / roll"
                      value={budgetFormatted}
                    />
                  </div>
                </div>
              </Card>

              {/* Positions table */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                    Open positions
                  </h2>
                  <span className="text-2xs text-faint uppercase tracking-widest">
                    {positions.length} range{positions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <PositionsTable positions={positions} />
              </Card>

              {/* NAV chart shell */}
              <Card className="p-4">
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
                  Vault NAV — 30d
                </h2>
                <ChartShell label="NAV" aspect="2/1" />
              </Card>
            </>
          )}

          {/* ── Vol surface tab ───────────────────────────────────────────── */}
          {activeTab === 'surface' && surfaceMarket && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                  SVI implied vol surface
                </h2>
                <span className="text-2xs text-faint uppercase tracking-widest">
                  BTC/dUSDC · live
                </span>
              </div>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                Strike range across the next-expiry BTC market. Bar height =
                implied volatility. Hover to inspect a specific strike.
                Powered by the SVI surface parameters from{' '}
                <span className="font-mono text-faint">predict-server</span>.
              </p>
              <SviSurface market={surfaceMarket} />
            </Card>
          )}

          {/* ── PLP risk tab ──────────────────────────────────────────────── */}
          {activeTab === 'plp' && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                  PLP risk
                </h2>
                <span className="text-2xs text-faint uppercase tracking-widest">
                  Pool health
                </span>
              </div>
              <PlpRiskPanel plp={MOCK_PLP_STATE} />
            </Card>
          )}
        </div>

        {/* Right 1/3: activity feed */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
            Live activity
          </h2>
          <Card className="overflow-hidden">
            <ul aria-label="Vault activity feed" className="divide-y divide-border/50">
              <AnimatePresence initial>
                {feed.map((entry, i) => (
                  <motion.div
                    key={`${entry.kind}-${entry.timestamp}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: DURATIONS_S.base,
                      ease: EASE_ENTER,
                      delay: i < 8 ? i * 0.05 : 0,
                    }}
                  >
                    <ActivityRow
                      kind={feedKindToActivityKind(entry.kind)}
                      title={entry.title}
                      detail={entry.detail}
                      timestamp={entry.timestamp}
                      txHash={entry.txHash}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {feed.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-muted">
                  No activity yet
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* ── REVOKE flow ───────────────────────────────────────────────────── */}
      <RevokeDialog
        open={revokeOpen}
        vaultName={`${label} Vault`}
        onClose={() => setRevokeOpen(false)}
        onCommitted={handleCommitted}
        forceOutcome={revokeOutcome}
      />

      {/* ── Deposit modal ─────────────────────────────────────────────────── */}
      <Modal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Deposit into Predict vault"
        description="Deposits are available in G1 — this is the shell."
      >
        <div className="p-6 flex flex-col gap-4">
          <h2
            className="text-lg font-semibold text-text"
            style={{ fontFamily: 'var(--metador-font-display)' }}
          >
            Deposits land in G1
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            The deposit flow wires to{' '}
            <span className="font-mono text-xs text-faint">keel_core::predict_vault</span>{' '}
            in G1. Shares are minted at NAV; pro-rata withdraw is always open.
          </p>
          {/* Risk disclosure per CLAUDE.md §1 claim discipline */}
          <div className="rounded-md border border-warn/30 bg-warn/5 px-4 py-3">
            <p className="text-sm text-warn leading-relaxed">
              <strong className="font-semibold">Risk disclosure:</strong> This vault
              deploys premium into leveraged BTC range positions on DeepBook Predict.
              Your maximum loss equals the vault&apos;s per-roll premium ceiling —{' '}
              <em>funds cannot be stolen; losses are capped by your ceiling.</em>{' '}
              No returns are promised or implied.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDepositModalOpen(false)}
            className="self-end"
          >
            Close
          </Button>
        </div>
      </Modal>
    </section>
  );
}

function NavStatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 bg-surface">
      <span className="text-2xs uppercase tracking-widest text-muted">{label}</span>
      <span
        className="font-mono text-sm text-text font-medium"
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {value}
      </span>
    </div>
  );
}

export default function PredictVaultDetailPage() {
  return (
    <Suspense fallback={<PredictVaultSkeleton />}>
      <PredictVaultDetailContent />
    </Suspense>
  );
}
