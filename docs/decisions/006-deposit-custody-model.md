# ADR-006 — Deposit custody model (G2 third-party deposits) — PROPOSED

Status: PROPOSED (2026-06-12) · Owner: founder · Gate: must be DECIDED and
implemented + /risk-review-clean BEFORE any third-party deposit ever opens.
Source: /risk-review of keel_core (pass 1 + pass 2, CLEAN_WITH_ESCALATION);
full records in docs/research/risk-review-keel-core-2026-06-12.json and the
pass-2 output.

## Context (the escalation, verbatim finding)
G1 `vault::deposit()` is accounting-only: it cannot move coins into the
BalanceManager on behalf of a depositor because DeepBook's
`balance_manager::deposit` is owner-only (source-verified:
generate_proof_as_owner → validate_owner). The current design documents a
mandatory PTB invariant (caller must call `balance_manager::deposit` before
`vault::deposit` in one atomic PTB) enforced only by the SDK — not by the
chain.

- **At G1 launch shape (DECIDE-002 condition 4: self-vaults only, leader ==
  owner, no third-party deposits):** safe. A self-depositor who violates the
  invariant harms only themselves. No theft path exists — the TradeCap
  cannot withdraw; withdrawals require the BM owner's signature.
- **At G2 (third-party depositors):** exploitable. A malicious depositor can
  phantom-mint shares by calling `vault::deposit` without depositing coins,
  diluting every real depositor's redemption value.

## Options
A. **DepositCap-in-vault (RECOMMENDED by review).** DeepBook already ships
   the primitive (`balance_manager::mint_deposit_cap`, `deposit_with_cap`).
   Mint a DepositCap at vault creation and lock it inside the Vault struct
   (same born-and-locked pattern as the TradeCap). `vault::deposit` takes
   `Coin<QuoteAsset>` and calls `deposit_with_cap` internally — coin flow
   chain-enforced, no ordering invariant, shares minted == coins moved.
B. **Vault-internal escrow.** `vault::deposit` takes `Coin<QuoteAsset>` and
   escrows in an internal `Balance<QuoteAsset>`; funds feed the BM only via
   the trade path. Avoids DepositCap but forks custody across two places.
C. **Keep SDK invariant.** Rejected: off-chain checks are never security
   (CLAUDE.md §1).

## Consequences of A (expected choice)
- New fund-moving call path ⇒ **L task**: implement → full /risk-review pass
  (no cap) → known-answer tests for the coin-flow path.
- Put on the OtterSec/OpenZeppelin office-hours agenda (along with: the
  spike module's remaining u64 budget-add at agent_mandate.move:244 — G1
  vault is fixed via u128; spike noted as historical artifact).

## Verification plan
- expected_failure test: vault::deposit with mismatched coin/BM cannot mint.
- Invariant test: total_assets delta == coin value on every deposit path.
- Re-run the full red-team scenario set from risk-review pass 1.
