# ADR-004 — Delegate-first vault execution — ACCEPTED

Status: ACCEPTED (2026-06-10)

Context: two execution models — (A) mirror engine copies a leader's
personal-account fills into the vault; (B) leader trades the vault directly
through a policy-gated entry (Hyperliquid's model + our walls).

Decision: B for G1. The leader is the vault's executor; execute_order
asserts sender == leader + the four walls, then places the real DeepBook
order atomically. Mirror-copy (follow ANY account without cooperation)
becomes the G2 differentiator.

Consequences: ~2 days of Gate-1 risk deleted (no fill-detection, no ratio
sizing); new UI surface (leader cockpit); adopted leader_min_stake (HL-style
skin-in-the-game) as a policy param; red-team demo unchanged and stronger
(leaked LEADER key still can't withdraw).
