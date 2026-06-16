import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@metador/ui';

export const metadata: Metadata = {
  title: 'Metador — Safety',
  description:
    'Safety is structural, not promised. The four policy walls that protect every depositor.',
};

const WALLS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: 'Wall 1 — Scope',
    tagline: 'The leader can only trade one pool.',
    body: 'When a vault is created, it is locked to a single DeepBook pool. The leader cannot route trades to any other market, acquire arbitrary tokens, or cross pools. The scope is recorded in the vault object and re-checked on every trade by the on-chain policy.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Wall 2 — Budget ceiling',
    tagline: 'Your ceiling caps every trade.',
    body: 'The depositor sets a maximum spend amount at vault creation. The policy tracks cumulative spend in base units and rejects any trade that would exceed the ceiling — before the order is sent to DeepBook, not after. The ceiling is immutable; it cannot be raised without revoking the vault.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 3v3M14 3v3M2 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: 'Wall 3 — Expiry',
    tagline: 'The vault automatically goes inoperable at expiry.',
    body: "Every vault carries an expiry timestamp set at creation. After that moment, the leader's TradeCap becomes permanently unexercisable — no transactions can be submitted. The expiry cannot be extended. If you want to continue after expiry, you create a new vault with a fresh set of walls you control.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 10s2-5.5 7-5.5 7 5.5 7 5.5-2 5.5-7 5.5-7-5.5-7-5.5z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.5" fill="currentColor" />
      </svg>
    ),
    title: 'Wall 4 — Revocability',
    tagline: 'One click. Instant. Irreversible.',
    body: "The depositor can revoke the leader's TradeCap at any moment — no conditions, no timelock, no multi-sig. The revoke transaction is a single on-chain call. Once confirmed, the capability is destroyed and cannot be recreated. The leader loses all trading authority immediately.",
  },
];

export default function Safety() {
  return (
    <section aria-labelledby="safety-heading">
      {/* H1 — the thesis */}
      <h1
        id="safety-heading"
        className="text-2xl font-semibold text-text mb-3"
        style={{ fontFamily: 'var(--metador-font-display)' }}
      >
        Safety is structural, not promised.
      </h1>
      <p className="text-base text-muted leading-relaxed mb-10 max-w-2xl">
        Every Metador vault is governed by four on-chain policy walls enforced by
        Move smart contracts. The leader cannot trade outside those walls.
        No trust required — the chain enforces it.
      </p>

      {/* The four walls */}
      <div className="grid grid-cols-1 gap-4 mb-12 sm:grid-cols-2">
        {WALLS.map((wall) => (
          <Card key={wall.title} className="p-6 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-primary">
              {wall.icon}
              <h2 className="text-sm font-semibold text-text">{wall.title}</h2>
            </div>
            <p className="text-sm font-medium text-primary">{wall.tagline}</p>
            <p className="text-sm text-muted leading-relaxed">{wall.body}</p>
          </Card>
        ))}
      </div>

      {/* Red-team scenario */}
      <div className="rounded-md border border-border bg-surface p-6 mb-10 max-w-2xl">
        <h2
          className="text-lg font-semibold text-text mb-4"
          style={{ fontFamily: 'var(--metador-font-display)' }}
        >
          What happens when a key leaks?
        </h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Imagine a leader&apos;s private key is compromised. An attacker gains
          full control of the leader&apos;s wallet. What can they do?
        </p>
        <ul className="flex flex-col gap-3">
          <li className="flex gap-3 items-start">
            <span className="text-success text-sm font-medium shrink-0 mt-px">✓</span>
            <p className="text-sm text-muted leading-relaxed">
              <strong className="text-text font-semibold">Scope is locked.</strong>{' '}
              They can only trade the pool the depositor chose. They cannot move funds
              to an arbitrary token or drain to a different pool.
            </p>
          </li>
          <li className="flex gap-3 items-start">
            <span className="text-success text-sm font-medium shrink-0 mt-px">✓</span>
            <p className="text-sm text-muted leading-relaxed">
              <strong className="text-text font-semibold">Budget caps losses.</strong>{' '}
              Even with continuous bad trades, the attacker can cause at most the
              budget ceiling in losses — the chain blocks every trade that would
              exceed it.{' '}
              <em className="text-text">
                Funds cannot be stolen; losses are capped by your ceiling.
              </em>
            </p>
          </li>
          <li className="flex gap-3 items-start">
            <span className="text-success text-sm font-medium shrink-0 mt-px">✓</span>
            <p className="text-sm text-muted leading-relaxed">
              <strong className="text-text font-semibold">Revoke ends it.</strong>{' '}
              The depositor can revoke in one click as soon as they notice. The
              leader&apos;s TradeCap is destroyed on-chain — no further trades are
              possible, ever.
            </p>
          </li>
          <li className="flex gap-3 items-start">
            <span className="text-success text-sm font-medium shrink-0 mt-px">✓</span>
            <p className="text-sm text-muted leading-relaxed">
              <strong className="text-text font-semibold">Expiry is the final backstop.</strong>{' '}
              If the depositor is away, the vault expires automatically. No action
              required.
            </p>
          </li>
        </ul>
        <p className="text-xs text-faint mt-6 leading-relaxed">
          This is the scenario that took down Drift Protocol in 2023 (
          <span className="font-mono">$285M</span> under privileged access) and
          that continues to plague copy-trading systems with no ceiling enforcement.
          Metador&apos;s walls make that class of attack structurally impossible within
          the vault.
        </p>
      </div>

      {/* Link to docs placeholder */}
      <p className="text-sm text-muted">
        Want the full technical spec?{' '}
        <Link
          href="https://docs.metador.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
        >
          Read the docs (G3)
        </Link>
        .
      </p>
    </section>
  );
}
