---
name: deepbook-expert
description: DeepBook v3 integration knowledge for Metador — verified IDs, function signatures, price/quantity scaling, BalanceManager/TradeCap semantics. Use when building or reviewing any code that calls DeepBook, constructs PTBs against it, or reasons about pools, fees, or fills.
---

# DeepBook Expert

Source-verified facts (deepbookv3 @ main, June 10 2026). Re-verify against
the repo before mainnet — never trust this file over current source.

## The objects
- `BalanceManager` (shared, key+store): funds pouch. EVERY withdraw path
  validates `ctx.sender() == owner` or a `WithdrawCap` we never mint.
- `TradeCap` (key+store): mintable only by owner (`mint_trade_cap`). Can
  `generate_proof_as_trader(&mut bm, &cap, ctx) -> TradeProof` (public).
  It cannot withdraw — no such function accepts it. This is Metador's thesis.
- `TradeProof` (drop): per-tx permission, passed by reference into pool calls.
- Owner can `revoke_trade_cap(bm, &cap_id, ctx)` — second kill switch under
  Metador's own revoke flag.

## The call that matters (public, cross-package)
`pool::place_limit_order<Base,Quote>(pool, bm, &proof, client_order_id,
order_type, self_matching_option, price, quantity, is_bid, pay_with_deep,
expire_timestamp, clock, ctx) -> OrderInfo (copy,drop,store)`
- order_type 0 = NO_RESTRICTION, 3 = POST_ONLY. self_matching 0 = allowed.
- Read `order_id()`, `status()`, `executed_quantity()` then let OrderInfo drop.

## Scaling (memorize, then test anyway)
- price_onchain = human_price × 1e9 × quote_scalar / base_scalar
- quote_owed (bids) = quantity × price / 1e9  (FLOAT_SCALING)
- SUI(9dp)/DBUSDC(6dp): price = human × 1e6. DEEP(6dp)/SUI(9dp): × 1e12.
- Always check pool's tick_size / lot_size / min_size before sizing orders.

## Fees
pay_with_deep=true → fees in DEEP from the BM. Whitelisted pools (DEEP
pairs) are fee-free — use DEEP/SUI for fee-free testing. Keep a DEEP buffer
in the BM for SUI/DBUSDC.

## Verified testnet anchors
pkg `0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c` ·
registry `0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1` ·
SUI/DBUSDC `0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5` ·
DEEP/SUI `0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f` ·
clock `0x6`. Authoritative source: ts-sdks/packages/deepbook-v3 constants.ts.

## Anti-patterns
- Building any matching/settlement/oracle logic ourselves (layer guardrail).
- Trusting indexer state for money decisions — read chain objects for truth,
  indexer for display.
- Hardcoding pool params (tick/lot/min) instead of reading them.
- Sizing from floats. Quantities are bigint base units, always.
