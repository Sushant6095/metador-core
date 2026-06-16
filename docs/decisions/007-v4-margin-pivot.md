# ADR-007 — v4 pivot: Keel is the consumer layer for DeepBook Margin

- **Status:** ACCEPTED (founder go, 2026-06-15) — supersedes the v3.1 spot-vault thesis.
- **Tier:** L (architecture + money-movement change). Audit: `docs/research/v4-rebuild-audit-2026-06-15.md`.
- **Rebrand note (2026-06-15):** the project later rebranded **Keel → Metador**
  (identity only — product, architecture, and this decision are unchanged). The
  historical "Keel" references in this ADR are preserved intentionally. See ADR-008.

## Context
KAIOS v4 repositions Keel from a non-custodial **spot vault layer** (strategy
vaults, locked `TradeCap`, four-walls policy, copy-trading) to **the consumer
layer for DeepBook Margin on Sui** — a leveraged trading **terminal** (order
book, chart, order entry with leverage, open positions, health factor,
liquidation price, PnL). Phase A audit found the margin product is fully
greenfield (zero margin/leverage/liquidation/order-book code) and the existing
build is a complete *spot-vault* product that the pivot makes obsolete.

## Decisions
1. **Adopt the margin pivot.** Three built surfaces — Home (`apps/web`),
   Screener, App (`apps/app`, the terminal) — rebuilt to benchmark grade
   (hyperfoundation / hyperscreener / app.hyperliquid). Docs on GitBook.
2. **DECIDE-001 → COMPOSE, do not own contracts.** Integrate DeepBook's
   margin manager (create/deposit/borrow/repay/withdraw); DeepBook owns
   custody, matching, settlement, and **liquidation**. Owning a Move package no
   longer buys a custody moat under margin — it only adds audit burden. We
   never build matching/settlement/oracles/liquidation engines (layer guardrail).
3. **`contracts/keel_core` is SHELVED, not deleted.** The spot-vault Move
   package + its 73 passing tests are preserved in-repo (reversible) in case a
   future own-rails decision revisits DECIDE-001. No new work flows into it.
4. **Screener placement → dedicated app route** (`/screener`), with a teaser
   section on Home. Hyperscreener is its own surface.

## Consequences
- The App is a from-scratch rebuild (salvage: tokens, `DataTable` grammar,
  wallet connect, chart/skeleton/toast primitives, shells).
- Home is a copy/positioning refactor (structure + effects salvaged).
- **New money-safety surface:** leverage ⇒ liquidation. Every margin calc
  (liquidation price, health factor, interest, leveraged PnL) ships with
  known-answer **bigint** tests; liquidation price is always visible on open
  positions; risk disclosure before the first leveraged action (CLAUDE.md §2).
- Exact DeepBook Margin SDK entry points are **verified in the P0 protocol
  spike before any abstraction** — UI shells use a clearly-marked mock margin
  model until then.

## Still open (downstream)
- **DECIDE-002** mainnet timing — further out; testnet-only until liquidation/
  health display passes `/risk-review`.
- **DECIDE-003** compliance — leverage raises stakes (geo-blocking, leverage
  caps); counsel before any non-testnet. Fees OFF.
- **DECIDE-004** onboarding — dapp-kit v1; evaluate Enoki/session keys (margin
  signs often) for P2.

## Verification
- `keel-product` skill + `PRODUCT.md` rewritten to the margin thesis.
- P0 exit: a script reads the book, creates a margin manager, deposits, opens
  and closes a leveraged position on testnet; known-answer tests for
  liquidation price + health factor pass.
- P1 exit: founder completes deposit → leverage → position → withdraw in the UI.
