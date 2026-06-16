# The Four Walls

Every Vault operates inside four hard constraints. They are not terms of service — they are assertions in Move code that run before every DeepBook call. If any assertion fails, the entire transaction is aborted by Sui validators. Nothing is partially executed.

## Budget ceiling

The Vault records a total-spend ceiling set at creation. Every order debits the running total. When a proposed order's notional value would push the running total above the ceiling, the chain aborts with `EBudgetExceeded` (code 6) and the order is never submitted to DeepBook.

A leader cannot raise their own ceiling. The ceiling is set once at vault creation and cannot be changed.

## Scope (one market only)

The Vault records exactly one allowed DeepBook pool at creation. If the leader attempts to route an order through any other pool, the chain aborts with `EWrongPool` (code 4). There is no override path.

This is the direct answer to Hyperliquid's documented strategy-drift flaw: a vault described as conservative spot trading cannot silently become a leveraged memecoin position, because the allowed pool is encoded in the object at birth. The chain physically prevents it.

## Expiry

The Vault carries a mandate expiry timestamp. After that time, any execution attempt aborts with `EExpired` (code 3). Depositors can always withdraw after expiry. The leader cannot extend their own expiry.

## Kill switch (revoke)

The vault owner can call `revoke` at any time. After revocation, every subsequent execution attempt aborts with `ERevoked` (code 2) regardless of budget, scope, or expiry status. Revocation is immediate and irreversible. Funds remain in the `BalanceManager` and are fully withdrawable by depositors.

## What the walls do not prevent

The walls do not prevent market losses. A leader can still place bad trades within the allowed market and under the budget ceiling. Depositor funds can decrease in value through normal market activity. The walls prevent theft and scope violation — not poor trading judgment.

## Next

[TradeCap: The Key That Can't Open the House](tradecap.md) — the object these walls govern.
