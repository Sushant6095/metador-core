# PRODUCT.md — Metador

**One-liner.** Metador is the consumer layer for **DeepBook Margin on Sui**: a
leveraged trading terminal with top-venue UX on a non-custodial, on-chain
margin market. We make DeepBook Margin usable by humans.

**Thesis.** The best margin trading experience doesn't have to be custodial.
DeepBook provides the order book, matching, settlement, and liquidation
on-chain; Metador provides the terminal, the risk presentation, and the flows —
so a trader gets Hyperliquid-grade speed and clarity while custody and
liquidation stay on the protocol, not with an operator.

**Target user (v1).** The on-chain leverage trader who wants a real terminal —
order book, chart, leverage, positions with live liquidation price and PnL —
without trusting a centralised desk or a custodial vault operator.

**Why now.** Centralised perp/margin venues own the UX but hold the funds;
on-chain venues are non-custodial but unusable. DeepBook Margin closes the
infrastructure gap; nobody has built the consumer terminal on top of it yet.

## What we build vs. what DeepBook owns (layer guardrail)
- **DeepBook owns:** custody, matching, settlement, order book, oracles,
  **liquidation**, interest, the margin-manager primitive.
- **Metador builds:** the terminal UI, order/position/risk presentation, the
  margin-manager flows (create/deposit/borrow/repay/withdraw) via the SDK, the
  screener, the home, product polish. Never matching/settlement/oracles/
  liquidation engines — a diff containing those is wrong by definition.

## Surfaces
- **App** (`apps/app`) — the trading terminal. Benchmark: app.hyperliquid.xyz.
- **Screener** (`/screener` + Home teaser) — benchmark: hyperscreener.asxn.xyz.
- **Home** (`apps/web`) — benchmark: hyperfoundation.org.
- **Docs** — external GitBook.

## Non-goals (v1)
- Not an exchange (DeepBook is). No matching/settlement/oracle/liquidation code.
- No token, points, or referrals before product-market fit.
- No earnings promises anywhere. Leverage and liquidation are explained
  plainly; losses are real and can be total — never implied absent.

## Money-safety law
All balance/price/PnL/liquidation/health/interest math in `bigint` base units;
floats never touch money; every such calc ships known-answer tests. Liquidation
price always visible on open positions. Risk disclosure before the first
leveraged action. `dryRun` + exact effects shown before any signature. Testnet
only until the founder writes "go mainnet".

## Roadmap (v4 §14)
- **P0** foundations: product truth + tokens ratified + benchmark capture +
  margin primitives + App shell (markets → terminal) + Home copy refactor +
  **DeepBook Margin spike** (testnet, known-answer liquidation/health tests).
- **P1** core loop: discovery → connect → deposit → leverage → position/PnL/
  liquidation display → withdraw. **Exit:** founder completes the cycle on
  testnet in the UI.
- **P2** differentiation: screener live (margin columns + comparison
  dashboard), Home polished + waitlist, copy-trading (DECIDE-001 follow-on),
  profiles/leaderboard.
- **P3** launch prep: GitBook docs, analytics, perf, `/risk-review` of every
  funds path.

**Decision rule for every feature:** on the core trade→position→risk path AND
it deepens trust in a non-custodial margin terminal — or it's roadmap, not code.

> History: the v3.1 spot-vault thesis (strategy vaults, locked `TradeCap`,
> copy-trading) is superseded by [ADR-007](docs/decisions/007-v4-margin-pivot.md).
> `contracts/keel_core` is shelved, not deleted.
