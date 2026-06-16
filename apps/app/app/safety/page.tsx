import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Metador — Safety',
  description:
    'Safety is structural, not promised. The four policy walls that protect every depositor.',
};

// ── Wall data ─────────────────────────────────────────────────────────────────

interface Wall {
  number: string;
  title: string;
  tagline: string;
  body: string;
  icon: React.ReactNode;
}

const WALLS: Wall[] = [
  {
    number: '01',
    title: 'Scope',
    tagline: 'The leader can only trade one pool.',
    body: 'When a vault is created it is locked to a single DeepBook pool. The leader cannot route trades to any other market, acquire arbitrary tokens, or cross pools. The scope is recorded in the vault object and re-checked on every trade by the on-chain policy.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Budget ceiling',
    tagline: 'Your ceiling caps every trade.',
    body: 'The depositor sets a maximum spend amount at vault creation. The policy tracks cumulative spend in base units and rejects any trade that would exceed the ceiling — before the order is sent to DeepBook, not after. The ceiling is immutable; it cannot be raised without revoking the vault.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v3.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Expiry',
    tagline: 'The vault automatically goes inoperable at expiry.',
    body: "Every vault carries an expiry timestamp set at creation. After that moment, the leader's TradeCap becomes permanently unexercisable — no transactions can be submitted. The expiry cannot be extended. If you want to continue after expiry, you create a new vault with a fresh set of walls you control.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="3.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 2v2M11 2v2M1.5 7.5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Revocability',
    tagline: 'One click. Instant. Irreversible.',
    body: "The depositor can revoke the leader's TradeCap at any moment — no conditions, no timelock, no multi-sig. The revoke transaction is a single on-chain call. Once confirmed, the capability is destroyed and cannot be recreated. The leader loses all trading authority immediately.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 8s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    ),
  },
];

// ── Red-team scenario items ───────────────────────────────────────────────────

const RED_TEAM_ITEMS: { body: React.ReactNode }[] = [
  {
    body: (
      <>
        <strong className="text-text font-medium">Scope is locked.</strong>{' '}
        They can only trade the pool the depositor chose. They cannot move funds to
        an arbitrary token or drain to a different pool.
      </>
    ),
  },
  {
    body: (
      <>
        <strong className="text-text font-medium">Budget caps losses.</strong>{' '}
        Even with continuous bad trades, the attacker can cause at most the budget
        ceiling in losses — the chain blocks every trade that would exceed it.{' '}
        <em className="text-muted not-italic">
          Funds cannot be stolen; losses are capped by your ceiling.
        </em>
      </>
    ),
  },
  {
    body: (
      <>
        <strong className="text-text font-medium">Revoke ends it.</strong>{' '}
        The depositor can revoke in one click as soon as they notice. The
        leader&apos;s TradeCap is destroyed on-chain — no further trades are possible,
        ever.
      </>
    ),
  },
  {
    body: (
      <>
        <strong className="text-text font-medium">Expiry is the final backstop.</strong>{' '}
        If the depositor is away, the vault expires automatically. No action required.
      </>
    ),
  },
];

// ── Wall card ─────────────────────────────────────────────────────────────────

function WallCard({ wall }: { wall: Wall }) {
  return (
    <article
      aria-labelledby={`wall-${wall.number}-title`}
      className="flex flex-col gap-3 border-b border-border pb-6 last:border-0 last:pb-0 sm:border-b-0 sm:pb-0 sm:border-r sm:pr-6 sm:last:border-r-0 sm:last:pr-0"
    >
      {/* Number + icon */}
      <div className="flex items-center gap-2">
        <span
          className="text-2xs font-medium uppercase tracking-widest text-faint"
          style={{
            fontFamily: 'var(--metador-font-mono)',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {wall.number}
        </span>
        <span className="text-primary">{wall.icon}</span>
      </div>

      {/* Title */}
      <h2
        id={`wall-${wall.number}-title`}
        className="text-base font-medium text-text"
      >
        {wall.title}
      </h2>

      {/* Tagline */}
      <p className="text-sm text-primary">{wall.tagline}</p>

      {/* Body */}
      <p className="text-sm text-muted leading-relaxed">{wall.body}</p>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Safety() {
  return (
    <section aria-labelledby="safety-heading" className="max-w-3xl">
      {/* Header */}
      <h1
        id="safety-heading"
        className="text-2xl font-semibold text-text mb-3"
      >
        Safety is structural, not promised.
      </h1>
      <p className="text-base text-muted leading-relaxed mb-8 max-w-2xl">
        Every Metador vault is governed by four on-chain policy walls enforced by
        Move smart contracts. The leader cannot trade outside those walls.
        No trust required — the chain enforces it.
      </p>

      {/* The four walls — horizontal strip on desktop */}
      <div className="mb-10 border border-border rounded-md bg-surface p-6">
        <h2 className="text-2xs font-medium uppercase tracking-widest text-muted mb-6">
          The four walls
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {WALLS.map((wall) => (
            <WallCard key={wall.number} wall={wall} />
          ))}
        </div>
      </div>

      {/* Red-team scenario */}
      <div className="border border-border rounded-md bg-surface p-6 mb-8">
        <h2 className="text-base font-medium text-text mb-1">
          What happens when a key leaks?
        </h2>
        <p className="text-sm text-muted leading-relaxed mb-6">
          Imagine a leader&apos;s private key is compromised. An attacker gains full
          control of the leader&apos;s wallet. What can they do?
        </p>

        <ul className="flex flex-col gap-4" role="list">
          {RED_TEAM_ITEMS.map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span
                className="shrink-0 mt-px text-success"
                aria-hidden="true"
                style={{ lineHeight: '1.25rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M4 7l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="text-sm text-muted leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ul>

        <p className="text-xs text-faint mt-6 leading-relaxed border-t border-border pt-4">
          This is the scenario that took down Drift Protocol in 2023 (
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--metador-font-mono)',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            $285M
          </span>{' '}
          under privileged access) and that continues to plague copy-trading
          systems with no ceiling enforcement. Metador&apos;s walls make that class
          of attack structurally impossible within the vault.
        </p>
      </div>

      {/* Claim discipline note */}
      <div
        className="flex gap-3 p-4 rounded-md bg-raised border border-border mb-8"
        role="note"
        aria-label="Risk disclosure"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          className="text-warn shrink-0 mt-0.5"
        >
          <path
            d="M7 2L1.5 12h11L7 2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 5.5v3M7 9.5v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-xs text-muted leading-relaxed">
          <strong className="text-text font-medium">Risk disclosure.</strong>{' '}
          The policy walls limit and structure risk — they do not eliminate it.
          Losses within the budget ceiling are real. Past performance of any
          vault does not predict future results. Only deposit what you can
          afford to lose up to your chosen ceiling.
        </p>
      </div>

      {/* Docs link */}
      <p className="text-sm text-muted">
        Want the full technical spec?{' '}
        <Link
          href="https://docs.metador.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 underline hover:text-primary-bright transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
        >
          Read the docs
        </Link>{' '}
        <span className="text-faint">(available G3)</span>
      </p>
    </section>
  );
}
