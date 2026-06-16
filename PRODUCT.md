# PRODUCT.md — Metador

**One-liner.** Metador is the **non-custodial vault layer for DeepBook Predict on
Sui**: a tokenized-share vault that runs a PLP + crash-hedge strategy on Predict's
vol-surface-priced markets, under chain-enforced four-walls policy — "PLP yield
minus crash insurance" that an outside LP can actually audit and compose against.

**Thesis.** Predict gives Sui a programmable, vol-surface-priced prediction/options
market with an on-chain pool (PLP) that takes the other side. What it lacks is a
*product*: a safe, legible way for non-experts to allocate into it. Metador is that
product — DeepBook owns pricing, matching, settlement, and liquidation; Metador owns
the vault, the policy walls, the tokenized share, the keeper, and the risk
presentation. Capital stays non-custodial; the leader can only trade within the
walls; the owner can revoke instantly.

**Target user (v1).** (a) The LP who wants Predict PLP yield without the naked
left-tail — a vault that hedges the crash. (b) The allocator who wants a portable,
composable share token representing a Predict strategy, not a position locked inside
one app.

**Why now.** Predict is live on Sui testnet (rolling sub-hour BTC oracles, dUSDC
quote, public indexer) with mainnet planned. The pool exists; the consumer vault on
top of it does not. Metador's tested vault/shares/four-walls infrastructure
(`keel_core`) maps almost 1:1 onto Predict's `PredictManager` cap/proof/revoke model
— see [ADR-009](docs/decisions/009-predict-vault-pivot.md).

> The DeepBook **Margin** terminal (ADR-007) is retained as a composability
> flourish — the tokenized vault share as margin collateral — not the G1 headline.

## What we build vs. what DeepBook owns (layer guardrail)
- **DeepBook Predict owns:** custody (`PredictManager`/BalanceManager), the SVI
  vol surface + oracle, pricing, matching, settlement, **liquidation**, the PLP
  pool accounting, the `mint`/`redeem` primitives.
- **Metador builds:** `keel_core::predict_vault` (wraps a `PredictManager`, locks a
  `PredictTradeCap`, issues a tokenized share), the four-walls policy, the PLP+hedge
  strategy + `roll`, the settled-redeem keeper, the simulation, and the product
  surfaces (vault UI, vol-surface viewer, PLP risk panel). Never pricing/matching/
  settlement/oracles/liquidation — a diff containing those is wrong by definition.

## Surfaces
- **Vault app** (`apps/app`) — vault list + detail (deposit/withdraw, tokenized
  share, policy card, REVOKE), live **SVI vol-surface viewer**, **PLP risk panel**.
- **Home** (`apps/web`) — the story: the PLP-safety problem → the hedged vault.
- **Keeper** (`services/cranker`) — settled-redeem sweeps + auto-roll on settlement.
- **Docs** — external GitBook.
- *Composability flourish:* the existing margin terminal (`/trade`) — the vault
  share as `deepbook_margin` collateral (idea #4), demoed, not the headline.

## Non-goals (v1)
- Not an exchange (DeepBook is). No matching/settlement/oracle/liquidation code.
- No token, points, or referrals before product-market fit.
- No earnings promises anywhere. Leverage and liquidation are explained
  plainly; losses are real and can be total — never implied absent.

## Money-safety law
All balance/premium/payout/NAV/PLP/share math in `bigint` base units; floats never
touch money; every such calc ships known-answer tests (incl. the PLP+hedge
simulation, `packages/deepbook/src/sim`). Max loss (premium at risk) and payoff
range always visible on open positions. Risk disclosure before the first deposit.
`dryRun` + exact effects shown before any signature. Testnet only until the founder
writes "go mainnet".

## Roadmap (G1 Predict — ADR-009)
- **P0** spike: founder funds OWNER + dUSDC; `create → deposit → mint → settle →
  redeem_settled` on testnet; record deployed IDs (`PREDICT-SPIKE.md`).
- **P1** core: `predict_vault` (deposit/withdraw + tokenized share + four walls +
  `roll`) green under `sui move test`; PLP+hedge simulation with known-answer tests.
  **Exit:** founder completes deposit → roll → withdraw on testnet in the UI.
- **P2** product: vault list/detail UI, live SVI vol-surface viewer, PLP risk panel,
  settled-redeem keeper auto-rolling on settlement; Home reframed + waitlist.
- **P3** launch prep: GitBook docs, analytics, perf, `/risk-review` of every funds
  path; composability demo (vault share as `deepbook_margin` collateral).

**Decision rule for every feature:** on the deposit→roll→redeem→withdraw path AND it
deepens trust in a non-custodial, auditable Predict vault — or it's roadmap, not code.

> History: v3.1 spot vaults → [ADR-007](docs/decisions/007-v4-margin-pivot.md) margin
> terminal → [ADR-009](docs/decisions/009-predict-vault-pivot.md) Predict vault (G1).
> Earlier surfaces are retained as composability, not deleted.
