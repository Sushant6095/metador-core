# ARCHITECTURE.md — Metador

Current system map. Diagrams in `docs/diagrams/` are the visual source of
truth and update in the same PR as any architecture change.

## The four layers
Consensus (Sui/Mysticeti, inherited) → Smart contracts (Move) — where
DeepBook (trading, inherited) and `contracts/keel_core` (ours, ~900 LoC
target) live on the SAME floor, same atomic transactions → Products
(`apps/app`, `apps/web`).

## What we build (G1 = DeepBook Predict vault — ADR-009)
- `contracts/keel_core` — `predict_vault` (wraps a `PredictManager`, locks a
  `PredictTradeCap` at birth, issues a tokenized share via `shares.move`), Policy
  (four walls: budget/scope/expiry/revoke + leader gate), the PLP+hedge `roll`,
  events. Reuses the proven `vault`/`shares`/`dca` modules (spot-vault thesis,
  shelved per ADR-007 but the math + tests port directly).
- `apps/app` — vault list + detail (deposit/withdraw, tokenized share, policy card,
  REVOKE), live SVI vol-surface viewer, PLP risk panel. (The margin terminal at
  `/trade` is retained as a composability demo.)
- `apps/web` — landing: the PLP-safety story → the hedged vault.
- `services/cranker` — Node worker + public CLI; **settled-redeem keeper**
  (`redeem_settled`) + auto-roll on settlement; chain re-verifies everything.
- `packages/` — ui, design-system, deepbook (Predict domain types + bigint money
  format + abort decoding + the PLP+hedge **simulation** in `src/sim`), analytics,
  reference-lab.

## What we call, never build
DeepBook **Predict** (`PredictManager` custody + caps/proof/revoke, PLP pool
`supply`/`withdraw`, `expiry_market::mint`/`redeem_settled`, the SVI oracle +
pricing, settlement, liquidation), DeepBook v3 spot (BalanceManager), DeepBook
Margin (composability surface), Sui RPC + `predict-server` indexer (read layer,
client polling 2–5s in v1).

## Verified testnet anchors (re-verify before mainnet)
DeepBook pkg 0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c ·
Registry 0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1 ·
SUI/DBUSDC pool 0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5 ·
DEEP/SUI pool 0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f ·
Clock 0x6. Source: ts-sdks deepbook-v3 constants.ts.

## Invariants (enforced by /risk-review)
Money is bigint base units end-to-end · four walls assert on-chain before any
DeepBook call · every fund-moving entry has abort-path tests · dryRun shown
before every signature · testnet only until "go mainnet" is in the decision log.
