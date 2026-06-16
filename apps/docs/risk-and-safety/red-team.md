# Red-Team Narrative

The stolen-key attack scenario that Metador rehearses live in its demo. It is the clearest way to show what the structural guarantees mean in practice.

## The setup

A vault has been created. The vault's `BalanceManager` was created as part of vault setup — the BalanceManager's owner is the vault owner address. The vault's TradeCap is locked inside the Vault object. Leo, the designated leader, holds only the leader/mandate key: the address stored in the vault for trade execution. Maya and other depositors have deposited funds and hold shares.

Leo's private key is then leaked — handed directly to an attacker.

## What the attacker tries first: withdraw funds

The attacker has Leo's full private key. They construct a DeepBook withdrawal transaction:

```
balance_manager::withdraw<SUI>(balance_manager_object, amount)
```

DeepBook's `withdraw` function checks that the transaction sender is the `BalanceManager`'s owner. The BalanceManager's owner is the vault owner address — set at vault creation, never transferred. Leo was never the BalanceManager owner. His key is the leader/mandate key, which exists only to route trades through the vault.

DeepBook aborts: `EInvalidOwner (code 0)`. The transaction is rejected. No funds move.

This is not Metador catching the attempt. DeepBook's own bytecode refuses it. Metador's code is not involved in this rejection at all.

## What the attacker can do: trade within the walls

The attacker can call `execute_order` through the vault. They can place orders on the allowed market (the scope wall prevents anything else) up to the remaining budget (the budget wall stops any overage). These are real trades and could lose value for depositors if the attacker places deliberately bad orders.

This is the honest boundary of the guarantee. The four walls constrain the attacker to the same operational envelope as the legitimate leader.

## What the owner does: revoke

As soon as Leo suspects his key is compromised, he calls `revoke` from the vault owner address (which is separate from the leader/execution address). One transaction. The vault's `revoked` flag is set to true on-chain.

The attacker then tries to place another order:

```
execute_order(...)
```

keel_core's first check: is the vault revoked? Yes. Abort: `ERevoked (code 2)`. The transaction is rejected. No further orders are possible from any address.

Depositors can withdraw their current balance freely. The attacker cannot place another trade, and never could withdraw.

## What this proves

The threat model for most custody-based products: if the operator's key is stolen, all funds are at risk. In April 2026, Drift Protocol on Solana lost approximately $285M via a stolen privileged admin key.

The threat model for a Metador vault: if the leader's key is stolen, the attacker can trade within the ceiling on the allowed market until revocation. They cannot touch the principal. Revocation is available to the vault owner at any time.

These are different guarantees. The first is a contractual promise. The second is a consequence of the type system.

## Next

[Gates and Timeline](../roadmap.md) — what Metador ships and when.
