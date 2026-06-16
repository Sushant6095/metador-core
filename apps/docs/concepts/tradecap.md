# TradeCap: The Key That Can't Open the House

The `TradeCap` is a Move capability object defined by DeepBook. It grants its holder the ability to generate trade permissions for one specific `BalanceManager` account. It has no withdrawal path anywhere in DeepBook's bytecode.

## What a TradeCap can do

A TradeCap calls `generate_proof_as_trader`, which produces a short-lived `TradeProof`. That proof is consumed by `place_limit_order` or `place_market_order`. That is the full extent of its power: place orders, and only orders.

## What a TradeCap cannot do

DeepBook's `withdraw` and `withdraw_all` functions require either the `BalanceManager`'s owner address or a `WithdrawCap`. A TradeCap is neither. There is no coercion path, no upgrade path, no delegated-approval path. The bytecode does not contain one. This is not a policy promise — it is a type-system constraint.

## Locked at birth

When a leader creates a Metador Vault, the following sequence happens inside a single Sui Programmable Transaction Block (PTB):

1. `mint_trade_cap` creates the TradeCap inside the transaction.
2. `create_mandate` immediately wraps it inside the Vault object, stored under a private field.
3. The transaction commits.

The TradeCap never exists as a free-standing, transferable object outside that atomic sequence. There is no window where an attacker could intercept it. Once the Vault is created, the TradeCap is inside it permanently until the Vault is destroyed.

## The leaked-key scenario

Suppose an attacker obtains the leader's full private key. Here is what they can do:

- Call `execute_order` through the Vault — subject to all four walls.
- Nothing else. The only fund-relevant capability (the `BalanceManager` withdrawal) requires the vault owner's key.

Depositor funds are unreachable. The attacker can trade within the ceiling on the allowed market until the expiry or until the owner calls revoke. Revocation immediately bricks all further execution. This scenario is replayed live in the [Red-Team Narrative](../risk-and-safety/red-team.md).

## Next

[NAV and Shares](nav-and-shares.md) — how depositor ownership is tracked.
