---
name: metador-product
description: Metador's product truth — load before reasoning about scope, surfaces, or what to build. Metador is the consumer layer for DeepBook Margin on Sui (a leveraged trading terminal). Defines the three surfaces, the margin domain model, money-safety law, and what we build vs. what DeepBook owns.
---

# Metador — Product Truth (v4)

Metador is **the consumer layer for DeepBook Margin on Sui**: a leveraged trading
**terminal** with the UX of a top centralised venue, on a non-custodial,
on-chain margin venue. We make DeepBook Margin usable by humans. Authoritative
decision: [ADR-007](../../../docs/decisions/007-v4-margin-pivot.md).

One human founder reviews everything. Testnet only until he writes "go mainnet".

## What we build vs. what DeepBook owns (layer guardrail — never cross it)
- **DeepBook owns:** custody, matching, settlement, the order book, oracles,
  **liquidation**, interest mechanics, the margin manager primitive.
- **Metador builds:** the terminal UI, order/position/risk presentation, the
  margin-manager *flows* (create/deposit/borrow/repay/withdraw) wired through
  the DeepBook SDK, the screener, the marketing home, and product polish.
- A diff that implements matching, settlement, an oracle, or a liquidation
  engine is wrong by definition.

## The three surfaces (+ benchmark + what we extract)
| Surface | Path | Benchmark | Bar |
|---|---|---|---|
| **App** (the product) | `apps/app` | app.hyperliquid.xyz | trading layout, order/position flow, hierarchy, latency feel, trust |
| **Screener** | `apps/app` → `/screener` (+ Home teaser) | hyperscreener.asxn.xyz (+ ASXN "Comparison" dashboard) | data density, stat presentation, table legibility |
| **Home** | `apps/web` | hyperfoundation.org | storytelling rhythm, scroll choreography, 3D-hero treatment, trust |
| Docs | external GitBook | hyperliquid GitBook | IA, progressive disclosure (content only) |

Extraction Protocol (CLAUDE.md §9): ship measurements/patterns/principles;
never their fonts, palette, copy, logos, or assets. Metador reads as its own brand
(brass `#F2A516` on slate, Fraunces display + Geist) at a glance.

## The App — trade terminal anatomy (hyperliquid-grade, Metador brand)
Three-column terminal over a market header:
1. **Market header:** market selector, **mark** + **index/oracle** price, 24h
   change, 24h volume, **open interest**, **funding**, countdown.
2. **Left/center:** candle chart (lightweight-charts, lazy) + a sub-tab for
   depth.
3. **Center-right:** **order book** (bids/asks, cumulative size, spread row)
   and recent trades tab.
4. **Right:** **order entry** — market/limit, **cross/isolated**, **leverage
   selector**, long/short, size (in base or quote), reduce-only, TP/SL,
   **estimated liquidation price** + margin required shown before signing.
5. **Below:** tabbed **Balances / Positions / Open Orders / Order History** —
   positions show entry, mark, size, leverage, **liquidation price**,
   **health/margin ratio**, **unrealized PnL** (green/red), funding paid.

## Margin domain model (shape mock data to this; bigint-ready)
A user has a **margin manager** (per-account or per-market) holding
**collateral**; they **borrow** against it to take **leveraged positions**.
Core fields, all integer base units (`bigint`), decimals from coin metadata:
`collateral`, `borrowed`, `equity`, `leverage`, `position{ market, side,
size, entryPrice, markPrice, liquidationPrice, marginRatio, unrealizedPnl,
funding }`. Flows: **create manager → deposit → borrow → open/adjust position
→ repay → withdraw**. Exact DeepBook Margin SDK entry points are verified in
the P0 protocol spike before abstraction — until then, UI uses a clearly-marked
mock model (`@metador/deepbook` mock layer), never invented on-chain signatures.

## Money-safety law (this product touches funds + leverage)
- All balance/price/PnL/liquidation/health/interest math in `bigint` base
  units; floats never touch money. Every such calc ships **known-answer unit
  tests** (use the `risk-math` skill).
- **Liquidation price is always visible on open positions.** Risk disclosure
  before the user's first leveraged action. No earnings promises, ever.
- Simulate every tx (`dryRun`) and show exact effects before requesting a
  signature; account for indexer lag — read chain objects for money truth,
  indexer for display.
- Claim discipline: explain leverage and liquidation plainly; never imply
  safety from loss.

## Roadmap (v4 §14)
- **P0** foundations: product truth (this) → tokens ratified → benchmark
  capture → margin primitives in `packages/ui` → App shell (markets → terminal)
  + Home copy refactor → **DeepBook Margin spike** (testnet, known-answer
  liquidation/health tests).
- **P1** core loop: discovery → connect → deposit → leverage → position/PnL/
  liquidation display → withdraw. **Exit:** founder does the full cycle on
  testnet in the UI.
- **P2** differentiation: screener live (margin columns + comparison
  dashboard), Home to hyperfoundation grade + waitlist, copy-trading (pending
  DECIDE-001 follow-on), profiles/leaderboard.
- **P3** launch prep: GitBook docs, analytics, perf, `/risk-review` of every
  funds path.

## Open decisions
DECIDE-001 **resolved → compose** (ADR-007). Still open: DECIDE-002 mainnet
timing · DECIDE-003 compliance/leverage caps · DECIDE-004 onboarding/auth.
`contracts/keel_core` is **shelved, not deleted**.
