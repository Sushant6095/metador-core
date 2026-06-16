# ADR-009 — Metador targets DeepBook Predict: the non-custodial Predict vault layer

- **Status:** ACCEPTED (founder go, 2026-06-16) — refines the v4 thesis (ADR-007) onto the hackathon's DeepBook **Predict** track.
- **Tier:** L (architecture + money movement). Supersedes the margin-terminal framing for G1 submission; margin work (ADR-007) is retained as composability surface (idea #4), not the headline.
- **Layer guardrail (unchanged, CLAUDE.md §1):** we never write matching, settlement, oracles, pricing, or liquidation. Predict owns all of that. We build the **vault, policy, tokenized shares, keeper, and product**.

## Context

The hackathon track is **DeepBook Predict** — a programmable, vol-surface-priced
prediction/options protocol live on Sui testnet (`predict-server.testnet.mystenlabs.com`,
`dUSDC` quote, rolling sub-hour BTC oracles). The minimum qualifying bar is explicit:
**integrate the Predict contract on testnet, work end-to-end, and (for a vault)
ship a proper simulation.** Metador as built (a DeepBook *Margin* terminal) has
**zero Predict integration** and would not qualify.

But the real Predict Move package (`contracts/deepbookv3/packages/predict`, commit
e276939) reveals an exceptional fit with Metador's existing, tested infrastructure:

- `PredictManager` exposes `mint_trade_cap` / `mint_deposit_cap` / `mint_withdraw_cap`,
  `generate_proof_as_trader(cap)`, `validate_proof`, and `revoke_cap` — the **exact
  locked-cap + proof + revoke model** `keel_core`'s four-walls vault was built around.
- `pool/plp::supply/withdraw` is the counterparty pool ("a vault that takes the other
  side") — programmatic LP yield we can allocate into.
- `expiry_market::mint(lower_strike, higher_strike, quantity, leverage, …) -> order_id`
  opens a leveraged strike **range**; `redeem` / `redeem_settled` close it.
- `redeem_settled` is **permissionless** — a keeper hook our cranker already matches.

## Decision

Ship **Metador — the non-custodial vault layer for DeepBook Predict**: a
`keel_core::predict_vault` that wraps a `PredictManager`, issues a tokenized share,
runs a **PLP + Hedge** strategy (idea #2), is auto-rolled by a settled-redeem keeper
(idea #8), and is fronted by a vol-surface + PLP-risk UI (ideas #9/#10) — all under
the four-walls policy and money-safety law that are Metador's brand.

### The four walls, re-pointed at Predict

| Wall | Predict enforcement |
|---|---|
| **Budget** | `perRollBudget` caps dUSDC premium + PLP supply deployable per roll; asserted before `mint`/`supply`. |
| **Scope** | Vault binds one `pythLazerFeedId` / expiry-market lineage; a mint/supply on any other market aborts. |
| **Expiry** | `mandateExpiryMs` — the vault's own mandate, distinct from each rolling expiry. |
| **Revoke** | Owner calls `revoke_cap` on the locked `PredictTradeCap`; leader loses trade authority instantly, depositors keep withdraw rights. The theatrical REVOKE moment (DESIGN.md #motion) carries over 1:1. |

### Vault architecture (`contracts/keel_core/sources/predict_vault.move`)

- `PredictVault` (shared) holds: `manager_id`, the **locked** `PredictTradeCap`,
  `Balance<PLP>`, a shares ledger (reuse `shares.move` NAV math, known-answer tested),
  `VaultPolicy`, `owner`, `leader`.
- `deposit(vault, manager, coin: Coin<DUSDC>)` → routes into the manager via the held
  deposit cap, mints shares against NAV.
- `withdraw(vault, manager, shares)` → burns shares, returns pro-rata dUSDC.
- `roll(vault, manager, market, oracle, pyth, plp_pool, config, clock)` → leader-only
  via `generate_proof_as_trader`; re-checks all four walls; `plp::supply` the core +
  `expiry_market::mint` an OTM hedge range.
- `revoke(vault)` / `reclaim(...)` → owner-only; mirrors `vault.move`.
- **NAV** = `manager.balance()` + PLP coin value + live position value (priced via the
  market, never recomputed by us).

### Integration contract

- Move dep: `deepbook_predict = { local = "../deepbookv3/packages/predict" }` + `dusdc`,
  matching the transitive `token`/`pyth_lazer` git sources (see Predict `Move.toml`).
- TS domain truth: `packages/deepbook/src/predict.ts` (types, bigint money format,
  abort decoding). Deployed object IDs from the `predict-testnet-4-16` deployment land
  in `packages/deepbook/src/constants.ts` after the spike.
- Indexer: SVI surface from `oracle::OracleSVIUpdated` via the public `predict-server`.

## Consequences

- **Qualifies**: real Predict integration (`mint`/`supply`/`redeem_settled`), e2e flow,
  and a scored simulation.
- **Reuses** the largest pre-built, tested assets (Vault, shares, four walls, cranker,
  design system) — the head start that separates a winner from a prototype.
- **Margin terminal** (ADR-007) is demoted to a composability flourish: the tokenized
  vault share as `deepbook_margin` collateral (idea #4 stretch).
- **Risk**: the Predict economics (leveraged option ranges, SVI pricing, withdrawal
  limiter) are a new domain on a 5-day clock; the vendored package is on `main@e276939`,
  not the `predict-testnet-4-16` deploy branch — re-pin before the live round-trip.

## Verification plan

1. Spike: `create_manager → deposit → mint → settle → redeem_settled` on testnet
   (founder funds OWNER + requests dUSDC). Records deployed IDs.
2. `sui move test` green on `predict_vault` with abort-path coverage (four walls).
3. Simulation: PLP+hedge backtest on SVI/oracle history → APY net of hedge cost + max
   drawdown under ±5σ, with known-answer tests, reproducible.
4. `/risk-review` clean on every funds path before any mainnet talk (testnet only).
