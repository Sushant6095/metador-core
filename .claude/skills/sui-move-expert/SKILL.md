---
name: sui-move-expert
description: Sui Move 2024 patterns for keel_core — object/capability design, shared-object rules, PTB composition, abort-code conventions, test patterns. Use when writing or reviewing any Move code, designing entry functions, or debugging publish/test failures.
---

# Sui Move Expert (keel_core)

## House patterns
- Capability-locking: caps (TradeCap) are moved INTO objects at creation in
  one atomic PTB — never held by wallets. Born locked or not born.
- Shared `Vault has key` (no store — nobody can wrap/transfer it).
  Owner/leader gating via address fields + asserts, not ownership.
- The four walls as the first lines of every fund-moving entry:
  sender gate -> revoked -> expiry (clock) -> scope -> size -> budget debit.
- Events for every state change — the activity feed is events, nothing else.
- Error consts numbered and mirrored in docs/abort-codes.md (UI source of
  truth): 1 ENotExecutor 2 ERevoked 3 EExpired 4 EWrongPool 5 EWrongBM
  6 EBudgetExceeded 7 ENotOwner.

## Test patterns (proven in mandate/tests)
- `test_scenario` with real DeepBook objects: `balance_manager::new(ctx)` +
  `bm.mint_trade_cap(ctx)` work WITHOUT a Pool — test every wall this way.
- One `#[expected_failure(abort_code = am::EConst)]` test per wall.
- Trailing `abort 0` pattern to satisfy non-drop values in failure tests.
- Extract assert logic into an internal `check_and_debit()` so walls are
  testable without pool infra; `#[test_only]` constructors for fixtures.

## PTB conventions
- create flows are ONE PTB: new BM -> mint cap -> create+share vault.
- `sui client ptb` for runbooks; SDK `Transaction` for the app — same shape.
- Shared-object mutability: vault + bm + pool all `&mut` in one tx is fine
  (consensus path); don't fight it with owned-object cleverness.

## Build/publish gotchas
- deepbook dep via git (subdir packages/deepbook); if publish hits
  unpublished-dependency: local clone + published-at + original-id route
  (SPIKE-RUNBOOK §3B decision tree).
- Edition 2024; method syntax resolves in the type's defining module.
- OrderInfo has copy+drop — read fields, let it fall.

## Anti-patterns
- `store` on Vault (enables wrapping/theft of the whole box).
- Public getters that return `&mut` anything.
- Asserts after external calls — walls run BEFORE the DeepBook call.
- Re-implementing anything DeepBook exports (layer guardrail).
