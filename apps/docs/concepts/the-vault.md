# The Vault

A Vault is the core object in Metador. It holds a trader's DeepBook trading key, the rules that constrain how that key is used, and the share accounting for every depositor.

## What a Vault is

A Vault is a Sui Move object. When a leader creates one, three things happen in a single atomic transaction: a DeepBook `BalanceManager` account is linked, a `TradeCap` capability is minted and locked permanently inside the Vault object, and the policy rules (budget, allowed market, expiry date) are written on-chain. After that transaction, no party — including the leader, the Metador team, or an attacker with the leader's full private key — can remove the TradeCap from the Vault, change the policy, or withdraw depositor funds directly.

## What a Vault contains

- **Locked TradeCap.** The trading key. It generates trade permissions for DeepBook but has no withdrawal path. It cannot leave the Vault object.
- **Policy walls.** Four on-chain rules that every action must pass before touching DeepBook. A violation aborts the entire transaction with no partial effect. See [The Four Walls](the-four-walls.md).
- **Share ledger.** When you deposit, you receive shares proportional to the current net asset value. When you withdraw, shares are redeemed at the current NAV. See [NAV and Shares](nav-and-shares.md).
- **Event log.** Every executed order, every rejected attempt, every deposit and withdrawal is recorded on-chain. Nothing is hidden, including failed attempts.

## What a Vault is not

A Vault is not a smart contract wallet or a multi-sig. The leader never holds depositor funds. Depositor funds sit in a DeepBook `BalanceManager` owned by the vault owner address — not the leader, not any depositor. DeepBook's bytecode gates every withdrawal on that owner address. The leader's TradeCap has no withdrawal path — it can only route orders through the vault's policy-gated `execute_order` function. Funds leave the BalanceManager only through the vault's own redemption flow, which pays out share-holders at current NAV.

## Next

[The Four Walls](the-four-walls.md) — what the chain enforces on every trade.
