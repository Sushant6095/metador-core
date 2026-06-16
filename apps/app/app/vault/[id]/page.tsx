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
} from '@metador/ui';
import { formatBaseUnits } from '@metador/deepbook';
import { track, METADOR_EVENTS } from '@metador/analytics';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import { getMockVault } from '../../../lib/mock-vaults';
import type { MockVault } from '../../../lib/mock-vaults';
import { RevokeDialog } from './RevokeDialog';

// ── Feed data ─────────────────────────────────────────────────────────────────

interface FeedEntry {
  kind: 'order' | 'rejected' | 'revoked' | 'deposit' | 'withdraw';
  title: string;
  detail?: string;
  timestamp: number;
  txHash?: string;
}

function buildFeed(vault: MockVault): FeedEntry[] {
  const base = Date.now() - 1000 * 60 * 60;
  const isRevoked = vault.status === 'revoked';

  const entries: FeedEntry[] = [
    ...(isRevoked
      ? [
          {
            kind: 'revoked' as const,
            title: 'Capability revoked · irreversible',
            timestamp: base + 1000 * 60 * 55,
            txHash:
              '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666000011112222333a',
          },
        ]
      : []),
    {
      kind: 'rejected' as const,
      title: 'Trade rejected by policy: budget exceeded',
      detail: `Attempted to spend ${formatBaseUnits(vault.budgetSpent + 50_000_000n * BigInt(10 ** (vault.quoteDecimals - 6)), vault.quoteDecimals, { maxFractionDigits: 2 })} ${vault.quoteSymbol} — exceeds ceiling`,
      timestamp: base + 1000 * 60 * 40,
    },
    {
      kind: 'order' as const,
      title: `Placed ${vault.pool} order`,
      detail: `Side: buy · Qty: ${formatBaseUnits(12_000_000_000n, 9, { maxFractionDigits: 2 })} SUI`,
      timestamp: base + 1000 * 60 * 38,
      txHash:
        '0xbbbb2222cccc3333dddd4444eeee5555ffff6666000011112222333344445556',
    },
    {
      kind: 'deposit' as const,
      title: 'Depositor joined',
      detail: `+${formatBaseUnits(500_000_000_000n, vault.quoteDecimals, { maxFractionDigits: 2 })} ${vault.quoteSymbol}`,
      timestamp: base + 1000 * 60 * 25,
    },
    {
      kind: 'order' as const,
      title: `Placed ${vault.pool} order`,
      detail: `Side: sell · Qty: ${formatBaseUnits(8_000_000_000n, 9, { maxFractionDigits: 2 })} SUI`,
      timestamp: base + 1000 * 60 * 15,
      txHash:
        '0xcccc3333dddd4444eeee5555ffff6666000011112222333344445555666677778',
    },
    {
      kind: 'order' as const,
      title: `Filled ${vault.pool} order`,
      detail: `Side: buy · Avg price 3.41 DBUSDC`,
      timestamp: base + 1000 * 60 * 12,
    },
    {
      kind: 'deposit' as const,
      title: 'Vault created',
      detail: 'Policy walls enforced on-chain',
      timestamp: base,
    },
  ];

  return entries.slice(0, 8);
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
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border"
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
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest"
            style={{
              border: '1px solid rgba(31,166,125,0.3)',
              color: 'var(--metador-success)',
              backgroundColor: 'var(--metador-tint-success)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--metador-success)' }}
              aria-hidden="true"
            />
            Live
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── KPI strip — unboxed divider-delimited numbers (~56px) ────────────────────

interface KpiItem {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}

function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div
      className="flex flex-wrap items-stretch"
      role="group"
      aria-label="Vault key metrics"
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 px-4 py-3 min-w-[120px]"
          style={{
            borderLeft: i === 0 ? 'none' : '1px solid var(--metador-border)',
          }}
        >
          <span
            className="text-2xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--metador-muted)' }}
          >
            {item.label}
          </span>
          <span
            className="text-2xl font-medium leading-none"
            style={{
              fontVariantNumeric: 'tabular-nums lining-nums',
              color: item.danger
                ? 'var(--metador-danger)'
                : item.accent
                  ? 'var(--metador-primary)'
                  : 'var(--metador-text)',
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Meter stat (spent / remaining / ceiling) ──────────────────────────────────

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
      <span
        className="text-2xs uppercase tracking-widest truncate"
        style={{ color: 'var(--metador-muted)' }}
      >
        {label}
      </span>
      <span
        className="text-xs truncate"
        style={{
          fontVariantNumeric: 'tabular-nums lining-nums',
          color: accent
            ? 'var(--metador-primary)'
            : 'var(--metador-text)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function VaultDetailSkeleton() {
  return (
    <section aria-label="Loading vault" aria-busy="true" data-skeleton="true">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Skeleton variant="rect" width="240px" height="32px" />
          <Skeleton variant="rect" width="320px" height="20px" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rect" width="84px" height="32px" />
          <Skeleton variant="rect" width="84px" height="32px" />
        </div>
      </div>
      {/* KPI strip */}
      <div className="mb-6 flex gap-4">
        <Skeleton variant="rect" width="120px" height="56px" />
        <Skeleton variant="rect" width="120px" height="56px" />
        <Skeleton variant="rect" width="120px" height="56px" />
      </div>
      {/* Policy card */}
      <div className="mb-6">
        <Skeleton variant="rect" width="160px" height="16px" className="mb-3" />
        <Skeleton variant="rect" height="120px" />
      </div>
      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Skeleton variant="rect" height="120px" />
          <Skeleton variant="rect" height="200px" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton variant="rect" width="120px" height="16px" />
          <Skeleton variant="rect" height="320px" />
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function VaultDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const vaultId = params?.id ?? '';
  const baseVault = getMockVault(vaultId);

  // ?loading=1 forces the skeleton for design-review and screenshot tooling.
  const loading = searchParams?.get('loading') === '1';

  // ?revoke=abort|reject forces failure paths for red-team filming.
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

  useEffect(() => {
    if (baseVault) track(METADOR_EVENTS.vaultViewed, { vault_id: baseVault.id });
  }, [baseVault]);

  if (loading) return <VaultDetailSkeleton />;

  // 404 empty state
  if (!baseVault) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-2xl font-medium" style={{ color: 'var(--metador-muted)' }}>
          Vault not found
        </p>
        <p className="text-sm" style={{ color: 'var(--metador-faint)' }}>
          The vault ID{' '}
          <span
            className="text-xs px-1.5 py-0.5 rounded-xs"
            style={{
              fontFamily: 'var(--metador-font-code)',
              backgroundColor: 'var(--metador-raised)',
              border: '1px solid var(--metador-border)',
              color: 'var(--metador-muted)',
            }}
          >
            {vaultId.slice(0, 20)}…
          </span>{' '}
          does not exist in the marketplace.
        </p>
        <Link
          href="/"
          className="text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
          style={{ color: 'var(--metador-primary)' }}
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const vault = baseVault;
  const isRevoked = vault.status === 'revoked' || locallyRevoked;
  const budgetFormatted = formatBaseUnits(vault.budget, vault.quoteDecimals, {
    maxFractionDigits: 2,
  });
  const tvlFormatted = formatBaseUnits(vault.tvl, vault.quoteDecimals, {
    maxFractionDigits: 2,
  });
  const pnlFormatted = formatBaseUnits(
    vault.pnl30d < 0n ? -vault.pnl30d : vault.pnl30d,
    vault.quoteDecimals,
    { maxFractionDigits: 2 },
  );
  const pnlSign = vault.pnl30d >= 0n ? '+' : '−';
  const feed = buildFeed({ ...vault, status: isRevoked ? 'revoked' : vault.status });

  function handleDepositClick() {
    track(METADOR_EVENTS.depositStarted, { vault_id: vault.id });
    setDepositModalOpen(true);
  }

  // Beat 2 (Commit) + 3 (Settle): flip local state, fire 520ms heat bloom.
  function handleCommitted() {
    setRevokeOpen(false);
    setLocallyRevoked(true);
    setHeatBloom(true);
    track(METADOR_EVENTS.vaultRevoked, { vault_id: vault.id });
    window.setTimeout(() => setHeatBloom(false), DURATIONS_S.hero * 1000);
  }

  return (
    <section aria-labelledby="vault-heading">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="relative flex flex-wrap items-center gap-3">
            {/* Heat bloom — single 520ms warm-red pulse behind the badge (beat 2) */}
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
              id="vault-heading"
              className="relative text-2xl font-medium"
              style={{ color: 'var(--metador-text)' }}
            >
              {vault.name}
            </h1>
            <span className="relative">
              <StatusBadge revoked={isRevoked} />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--metador-muted)' }}>
            <span>Led by</span>
            <AddressPill
              address={vault.leader}
              explorerHref={`https://suiscan.xyz/testnet/account/${vault.leader}`}
            />
            <span style={{ color: 'var(--metador-faint)' }}>·</span>
            <span>
              <span
                className="text-sm"
                style={{
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  color: 'var(--metador-text)',
                }}
              >
                {vault.followers}
              </span>{' '}
              followers
            </span>
            <span style={{ color: 'var(--metador-faint)' }}>·</span>
            <span
              className="text-2xs uppercase tracking-widest px-2 py-0.5 rounded-xs"
              style={{
                border: '1px solid var(--metador-border)',
                color: 'var(--metador-muted)',
              }}
            >
              {vault.strategy}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isRevoked ? (
            <span className="text-sm italic" style={{ color: 'var(--metador-faint)' }}>
              Actions disabled — vault revoked
            </span>
          ) : (
            <>
              <Button variant="primary" size="sm" onClick={handleDepositClick}>
                Deposit
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Withdraw
              </Button>
              {/* Revoke trigger: muted danger, not the arterial revoke red.
                  The full revoke red is reserved for the confirmed REVOKE moment. */}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setRevokeOpen(true)}
              >
                Revoke
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── KPI strip — unboxed, divider-delimited ────────────────────────── */}
      <div
        className="mb-6 rounded-md overflow-hidden"
        style={{
          border: '1px solid var(--metador-border)',
          backgroundColor: 'var(--metador-surface)',
        }}
      >
        <KpiStrip
          items={[
            {
              label: `TVL (${vault.quoteSymbol})`,
              value: tvlFormatted,
            },
            {
              label: `30d PnL (${vault.quoteSymbol})`,
              value: `${pnlSign}${pnlFormatted}`,
              accent: vault.pnl30d >= 0n,
              danger: vault.pnl30d < 0n,
            },
            {
              label: `Budget ceiling (${vault.quoteSymbol})`,
              value: budgetFormatted,
            },
            {
              label: 'Followers',
              value: String(vault.followers),
            },
          ]}
        />
      </div>

      {/* ── PolicyCard — the page hero (DESIGN.md: safety made visible) ────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-2xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--metador-muted)' }}
          >
            Policy walls
          </h2>
          <span
            className="text-2xs uppercase tracking-widest"
            style={{ color: 'var(--metador-faint)' }}
          >
            Enforced on-chain
          </span>
        </div>
        <PolicyCard
          pool={vault.pool}
          budgetFormatted={budgetFormatted}
          quoteSymbol={vault.quoteSymbol}
          expiresAtMs={vault.expiresAtMs}
          revocable
          status={isRevoked ? 'revoked' : 'active'}
          className="shadow-raised"
        />
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────────
          Left col (2/3): BudgetMeter hero + NAV chart
          Right col (1/3): Activity feed                                     */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* BudgetMeter — prominent hero with stat breakdown */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-2xs font-medium uppercase tracking-widest"
                style={{ color: 'var(--metador-muted)' }}
              >
                Budget meter
              </h2>
              {isRevoked && (
                <span
                  className="text-2xs uppercase tracking-widest"
                  style={{ color: 'var(--metador-faint)' }}
                >
                  Locked
                </span>
              )}
            </div>
            {/* Desaturate + lock once revoked (beat 2 settle) */}
            <div
              style={{
                filter: isRevoked ? 'grayscale(1)' : undefined,
                opacity: isRevoked ? 0.6 : 1,
                transition: `opacity ${DURATIONS_S.slow}s var(--metador-ease-standard), filter ${DURATIONS_S.slow}s var(--metador-ease-standard)`,
              }}
            >
              <BudgetMeter
                spent={vault.budgetSpent}
                budget={vault.budget}
                quoteDecimals={vault.quoteDecimals}
                quoteSymbol={vault.quoteSymbol}
              />
              {/* Spent / remaining / ceiling breakdown */}
              <div
                className="grid grid-cols-3 gap-4 mt-4 pt-4"
                style={{ borderTop: '1px solid var(--metador-border)' }}
              >
                <MeterStat
                  label="Spent"
                  value={`${formatBaseUnits(vault.budgetSpent, vault.quoteDecimals, { maxFractionDigits: 2 })} ${vault.quoteSymbol}`}
                />
                <MeterStat
                  label="Remaining"
                  value={`${formatBaseUnits(vault.budget > vault.budgetSpent ? vault.budget - vault.budgetSpent : 0n, vault.quoteDecimals, { maxFractionDigits: 2 })} ${vault.quoteSymbol}`}
                  accent
                />
                <MeterStat
                  label="Ceiling"
                  value={`${budgetFormatted} ${vault.quoteSymbol}`}
                />
              </div>
            </div>
          </Card>

          {/* NAV chart shell */}
          <Card className="p-4">
            <h2
              className="text-2xs font-medium uppercase tracking-widest mb-3"
              style={{ color: 'var(--metador-muted)' }}
            >
              Vault NAV — 30d
            </h2>
            <ChartShell label="NAV" aspect="2/1" />
          </Card>
        </div>

        {/* Right: Activity feed — the rejections are the proof */}
        <div className="flex flex-col gap-3">
          <h2
            className="text-2xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--metador-muted)' }}
          >
            Live activity
          </h2>
          <Card className="overflow-hidden">
            <ul aria-label="Vault activity feed" className="divide-y" style={{ borderColor: 'var(--metador-border)' }}>
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
                      kind={entry.kind}
                      title={entry.title}
                      detail={entry.detail}
                      timestamp={entry.timestamp}
                      txHash={entry.txHash}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {feed.length === 0 && (
                <li
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--metador-muted)' }}
                >
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
        vaultName={vault.name}
        onClose={() => setRevokeOpen(false)}
        onCommitted={handleCommitted}
        forceOutcome={revokeOutcome}
      />

      {/* ── Deposit modal stub ────────────────────────────────────────────── */}
      <Modal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Deposit into vault"
        description="Deposits are available in G1 — this is the shell."
      >
        <div className="p-6 flex flex-col gap-4">
          <h2 className="text-lg font-medium" style={{ color: 'var(--metador-text)' }}>
            Deposits land in G1
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--metador-muted)' }}>
            This is the shell — deposit flow wires to{' '}
            <span
              className="text-xs px-1.5 py-0.5 rounded-xs"
              style={{
                fontFamily: 'var(--metador-font-code)',
                backgroundColor: 'var(--metador-raised)',
                border: '1px solid var(--metador-border)',
                color: 'var(--metador-faint)',
              }}
            >
              keel_core
            </span>{' '}
            in G1.
          </p>
          {/* Risk disclosure — always visible (CLAUDE.md §1 money safety) */}
          <div
            className="rounded-md px-4 py-3"
            style={{
              border: '1px solid rgba(255, 140, 0, 0.3)',
              backgroundColor: 'var(--metador-tint-warn)',
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'var(--metador-warn)' }}>
              <strong className="font-medium">Risk disclosure:</strong> Funds
              deposited into a vault are subject to trading losses up to the
              vault&apos;s configured budget ceiling. The on-chain policy walls
              cap your maximum exposure —{' '}
              <em>funds cannot be stolen; losses are capped by your ceiling.</em>
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

/**
 * Vault detail — Suspense boundary required by Next.js App Router for
 * useSearchParams() in a client component.
 */
export default function VaultDetail() {
  return (
    <Suspense fallback={<VaultDetailSkeleton />}>
      <VaultDetailContent />
    </Suspense>
  );
}
