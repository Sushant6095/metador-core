# DECIDE-001 — Own Move contracts vs compose primitives only — CLOSED

Status: CLOSED (2026-06-10) · Owner: founder + protocol

Context: copy-trading vaults need custody-proof delegation; composing
DeepBook primitives alone provides no per-vault walls and no moat.

Decision: Keel owns ONE small Move package (contracts/keel_core, ~900 LoC
target): Vault with TradeCap locked at creation + four-walls policy +
shares/NAV + events. Nothing else on-chain.

Evidence at closure: agent_mandate package written; 8 unit tests green
against real deepbook BalanceManager/TradeCap; cross-package
generate_proof_as_trader → place_limit_order verified public in deepbookv3
source; audit deferred behind G3 caps.

Consequences: we carry an audited surface (small by design); the layer
guardrail (no matching/settlement/oracles) becomes law; mainnet gated by
DECIDE-002.
