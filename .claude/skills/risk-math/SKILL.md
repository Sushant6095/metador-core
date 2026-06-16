---
name: risk-math
description: Money-math discipline for Metador. Use whenever writing or reviewing any calculation involving balances, prices, NAV, shares, fees, budgets, or PnL — in TypeScript or Move. Fires on float usage near money, missing known-answer tests, or unit confusion.
---

# Risk Math

## Hard rules
1. Money is `bigint` (TS) / `u64`-`u128` (Move) in BASE UNITS, end to end.
   Floats appear only at the final formatting edge, never in computation.
2. Decimals come from on-chain coin metadata — never assumed. SUI=9,
   DBUSDC=6, DEEP=6 on testnet, but READ them.
3. Multiply before divide. Order: `(a * b) / SCALE`, with u128/bigint
   intermediate to avoid overflow. Document rounding direction at every
   division — and round AGAINST the user-favorable direction for mints,
   FOR the vault on fees (conservative).
4. Every formula ships a known-answer test computed by hand first.

## Canonical Metador formulas (with the canonical test case)
- quote_committed = qty_base * price_onchain / 1_000_000_000
- NAV(quote units) = bm_quote + bm_base * mid / FLOAT_SCALING
- shares_minted = deposit * share_supply / NAV   (first deposit: 1:1)
- payout = shares * NAV / share_supply
- perf_fee = max(0, payout - cost_basis) * perf_bps / 10_000
- Known answer: Maya deposits 1,000 (supply 10,000, NAV/share 1.000) ->
  1,000 shares. NAV/share -> 1.120. Withdraw all: gross 1,120, profit 120,
  fee 10% = 12, net 1,108. If a test doesn't reproduce 1,108, the math is
  wrong — not the test.

## Procedure when touching money math
1. Write the formula in a comment with units annotated per term.
2. Hand-compute one example; commit it as the known-answer test FIRST.
3. Implement. 4. Add edge tests: zero supply, 1-unit dust, max-u64
   adjacency, rounding boundary. 5. Run /risk-review before ship.

## Anti-patterns (object loudly)
- `Number(balance)`, `parseFloat(amount)`, `.toFixed()` mid-computation.
- `qty * price` without scale division, or divide-then-multiply.
- "It's testnet, rounding doesn't matter" — it compounds in share supply.
- Display values fed back into calculations.
- A budget check in the UI that isn't mirrored by a Move assert.
