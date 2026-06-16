# ARCHITECTURE.md — Metador

Current system map. Diagrams in `docs/diagrams/` are the visual source of
truth and update in the same PR as any architecture change.

## The four layers
Consensus (Sui/Mysticeti, inherited) → Smart contracts (Move) — where
DeepBook (trading, inherited) and `contracts/keel_core` (ours, ~900 LoC
target) live on the SAME floor, same atomic transactions → Products
(`apps/app`, `apps/web`).

## What we build
- `contracts/keel_core` — Vault (locks TradeCap at birth), Policy (four
  walls: budget/scope/expiry/revoke + leader gate + order cap), Delegate +
  DCA strategies, shares/NAV, events. Seeded from the proven `agent_mandate`
  spike (currently still named agent_mandate — rename during port).
- `apps/app` — marketplace, vault detail, cockpit (leader-only), wizard,
  portfolio, safety. Visual contract: docs/research/keel-ui-prototype.html.
- `apps/web` — landing (shell G1, polish G2).
- `services/cranker` — ~300 LoC Node worker + public CLI; DCA ticks; chain
  re-verifies everything.
- `packages/` — ui, design-system, deepbook (SDK glue + abort decoding),
  analytics, reference-lab.

## What we call, never build
DeepBook v3 (BalanceManager custody, TradeCap/TradeProof, place_limit_order),
DeepBook Margin (G4), DeepBook Predict (G4), Sui RPC + DeepBook indexer
(read layer, client polling 2–5s in v1).

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
