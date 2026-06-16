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

// ── Hardcoded feed data ───────────────────────────────────────────────────────

interface FeedEntry {
  kind: 'order' | 'rejected' | 'revoked' | 'deposit' | 'withdraw';
  title: string;
  detail?: string;
  timestamp: number;
  txHash?: string;
}

function buildFeed(vault: MockVault): FeedEntry[] {
  const base = Date.now() - 1000 * 60 * 60; // 1 hour ago
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

// ── Status badge — crossfades between Live and REVOKED ─────────────────────────

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
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-revoke" aria-hidden="true" />
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

// ── Meter stat (spent / remaining / ceiling) ───────────────────────────────────

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
      <span className="text-2xs uppercase tracking-widest text-muted truncate">
        {label}
      </span>
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

// ── Loading skeleton (reachable via ?loading=1) ────────────────────────────────

function VaultDetailSkeleton() {
  return (
    <section aria-label="Loading vault" aria-busy="true" data-skeleton="true">
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
      <div className="mb-6">
        <Skeleton variant="rect" width="160px" height="16px" className="mb-3" />
        <Skeleton variant="rect" height="160px" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton variant="rect" height="120px" />
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

  // Reachable loading state — the data surface's skeleton. Mock reads are
  // synchronous; ?loading=1 forces the skeleton so design-review and the
  // screenshot tooling can verify it. G1 flips this on the real chain read.
  const loading = searchParams?.get('loading') === '1';

  // Hidden owner-only outcome toggle (the red-team beat — DESIGN.md). ?revoke=
  // abort|reject forces the failure path so it can be filmed live; default is
  // the success flow. G1 derives the outcome from the real tx result.
  const revokeParam = searchParams?.get('revoke');
  const revokeOutcome =
    revokeParam === 'abort'
      ? 'abort'
      : revokeParam === 'reject'
        ? 'reject'
        : 'success';

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  // Local revoke override — the mock state flip the demo flow drives. The real
  // PTB lands in G1 (see RevokeDialog TODO); here a confirmed commit flips this
  // and the page runs beats 2 (Commit) + 3 (Settle) declaratively.
  const [locallyRevoked, setLocallyRevoked] = useState(false);
  const [heatBloom, setHeatBloom] = useState(false);

  useEffect(() => {
    if (baseVault) track(METADOR_EVENTS.vaultViewed, { vault_id: baseVault.id });
  }, [baseVault]);

  if (loading) return <VaultDetailSkeleton />;

  // 404-style empty state
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
          does not exist in the marketplace.
        </p>
        <Link
          href="/"
          className="text-primary text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
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
  const feed = buildFeed({ ...vault, status: isRevoked ? 'revoked' : vault.status });

  function handleDepositClick() {
    track(METADOR_EVENTS.depositStarted, { vault_id: vault.id });
    setDepositModalOpen(true);
  }

  // Beat 2 (Commit) + 3 (Settle): on confirmed success flip local state, fire
  // the single 520ms heat bloom, and let the declarative render desaturate the
  // meter / disable actions / land the terminal feed row.
  function handleCommitted() {
    setRevokeOpen(false);
    setLocallyRevoked(true);
    setHeatBloom(true);
    track(METADOR_EVENTS.vaultRevoked, { vault_id: vault.id });
    window.setTimeout(() => setHeatBloom(false), DURATIONS_S.hero * 1000);
  }

  return (
    <section aria-labelledby="vault-heading">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="relative flex flex-wrap items-center gap-3">
            {/* Heat bloom — single 520ms warm-red pulse behind the badge */}
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
              className="relative text-2xl font-semibold text-text"
              style={{ fontFamily: 'var(--metador-font-display)' }}
            >
              {vault.name}
            </h1>
            <span className="relative">
              <StatusBadge revoked={isRevoked} />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>Led by</span>
            <AddressPill
              address={vault.leader}
              explorerHref={`https://suiscan.xyz/testnet/account/${vault.leader}`}
            />
            <span className="text-faint">·</span>
            <span>
              <span
                className="font-mono text-text"
                style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
              >
                {vault.followers}
              </span>{' '}
              followers
            </span>
          </div>
        </div>

        {/* Action buttons — owner view exposes Revoke (the demo flow) */}
        <div className="flex items-center gap-2">
          {isRevoked ? (
            <span className="text-sm text-faint italic">
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
              {/* Trigger is muted danger — the arterial revoke red stays
                  reserved for the actual moment (the confirm sweep + the
                  revoked state), per DESIGN.md. */}
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

      {/* PolicyCard — the page hero. Full width, larger presence, sits above
          the fold ahead of the secondary panels (DESIGN.md: safety made
          visible; the policy card is Metador's signature element). */}
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
          pool={vault.pool}
          budgetFormatted={budgetFormatted}
          quoteSymbol={vault.quoteSymbol}
          expiresAtMs={vault.expiresAtMs}
          revocable
          status={isRevoked ? 'revoked' : 'active'}
          className="shadow-raised"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left col: BudgetMeter (prominent, spring fill) + NAV */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                Budget meter
              </h2>
              {isRevoked && (
                <span className="text-2xs text-faint uppercase tracking-widest">
                  Locked
                </span>
              )}
            </div>
            {/* Desaturate + lock the meter once revoked (beat 2). */}
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
              {/* Spent / remaining / ceiling breakdown — gives the meter
                  real presence and reinforces the wall you can watch. */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
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

          {/* NAV — chart shell (lightweight-charts lands G1) */}
          <Card className="p-4">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
              Vault NAV — 30d
            </h2>
            <ChartShell label="NAV" aspect="2/1" />
          </Card>
        </div>

        {/* Right col: Activity feed — staggered entrance */}
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
                <li className="px-4 py-8 text-center text-sm text-muted">
                  No activity yet
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* REVOKE flow (owner view) */}
      <RevokeDialog
        open={revokeOpen}
        vaultName={vault.name}
        onClose={() => setRevokeOpen(false)}
        onCommitted={handleCommitted}
        forceOutcome={revokeOutcome}
      />

      {/* Deposit modal stub */}
      <Modal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Deposit into vault"
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
            This is the shell — deposit flow wires to{' '}
            <span className="font-mono text-xs text-faint">keel_core</span> in
            G1.
          </p>
          {/* Risk disclosure (PRODUCT.md voice) */}
          <div className="rounded-md border border-warn/30 bg-warn/5 px-4 py-3">
            <p className="text-sm text-warn leading-relaxed">
              <strong className="font-semibold">Risk disclosure:</strong> Funds
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
 * Vault detail shell — Suspense boundary required by Next.js App Router for
 * useSearchParams() in a client component (the ?loading=1 skeleton hook).
 */
export default function VaultDetail() {
  return (
    <Suspense fallback={<VaultDetailSkeleton />}>
      <VaultDetailContent />
    </Suspense>
  );
}
