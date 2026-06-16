'use client';

import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { AddressPill } from '@metador/ui';

export default function Portfolio() {
  const account = useCurrentAccount();

  return (
    <section aria-labelledby="portfolio-heading">
      <h1
        id="portfolio-heading"
        className="text-2xl font-semibold text-text mb-6"
        style={{ fontFamily: 'var(--metador-font-display)' }}
      >
        Portfolio
      </h1>

      {account ? (
        /* Connected — placeholder with acknowledged address */
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>Showing deposits for</span>
            <AddressPill
              address={account.address}
              explorerHref={`https://suiscan.xyz/testnet/account/${account.address}`}
            />
          </div>
          {/* Empty state — no deposits yet */}
          <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-md border border-border bg-surface">
            <p
              className="text-lg font-semibold text-muted"
              style={{ fontFamily: 'var(--metador-font-display)' }}
            >
              No deposits yet
            </p>
            <p className="text-sm text-faint max-w-sm text-center leading-relaxed">
              Your on-chain vault positions will appear here once you deposit.
              Portfolio reads live from{' '}
              <span className="font-mono text-xs text-faint">keel_core</span> in
              G1.
            </p>
            <Link
              href="/"
              className="text-primary text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
            >
              Browse the marketplace
            </Link>
          </div>
        </div>
      ) : (
        /* No wallet — empty state with CTA */
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-md border border-border bg-surface">
          <p
            className="text-lg font-semibold text-muted"
            style={{ fontFamily: 'var(--metador-font-display)' }}
          >
            No deposits yet
          </p>
          <p className="text-sm text-faint max-w-sm text-center leading-relaxed">
            Connect your wallet to view your vault positions, PnL, and
            withdrawal history.
          </p>
          <Link
            href="/"
            className="text-primary text-sm underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
          >
            Browse the marketplace
          </Link>
        </div>
      )}
    </section>
  );
}
