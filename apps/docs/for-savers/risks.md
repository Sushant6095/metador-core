# Risks

Metador eliminates one category of risk entirely. It does not eliminate all risk. Understanding the difference matters before you deposit.

## What Metador eliminates: custody risk

In most copy-trading products, the operator holds — or can access — your funds. If their key is stolen, your funds can be stolen. If they act maliciously, your funds can be moved. Metador's structure makes this category of risk structurally impossible for the vault operator.

The leader's key controls a `TradeCap`. A TradeCap can place orders through the vault's policy-gated path. It has no withdrawal route. The DeepBook `BalanceManager` that holds vault funds is owned by the vault owner address — not the leader, not any depositor. DeepBook's bytecode gates every withdrawal on that owner address. Depositors' funds leave only through the vault's own redemption flow, which pays share-holders at the current NAV. This is enforced at the bytecode level, not by policy.

**Funds cannot be stolen by a compromised or malicious vault operator. Losses are capped by the vault's budget ceiling.**

## What Metador does not eliminate: market risk

A leader can still trade badly. If the leader places orders that lose money — within the allowed market, under the budget ceiling, before expiry — the vault's NAV declines and your deposit is worth less when you withdraw. The four walls constrain where and how much the leader can trade, not whether those trades are profitable.

Market losses are a normal outcome. Before depositing, review the leader's on-chain track record in the activity feed. Past performance is not a guarantee of future results.

## What Metador does not eliminate: smart contract risk

Metador's `keel_core` package is novel code. It has been written carefully and will be reviewed by external security researchers before mainnet. It has not been audited by a formal auditing firm as of this testnet period. Bugs in `keel_core` could behave unexpectedly. This is why Metador is on testnet, hard deposit caps are planned for mainnet, and the founder must write "go mainnet" before any real funds are involved.

## What Metador does not eliminate: protocol risk

DeepBook is Sui's on-chain order book. Metador depends on it. A bug or exploit in DeepBook could affect vaults. Metador does not build matching, settlement, or oracle logic — but it also cannot protect against problems in the underlying exchange layer.

## Summary

| Risk | Eliminated? | Reason |
|---|---|---|
| Leader withdraws your funds | Yes | TradeCap has no withdrawal path (bytecode) |
| Leader exceeds spending ceiling | Yes | Chain aborts EBudgetExceeded |
| Leader trades a different market | Yes | Chain aborts EWrongPool |
| Leader trades badly and loses | No | Market risk is always present |
| Bug in keel_core | No | Novel code, pre-audit |
| Bug in DeepBook | No | Underlying protocol dependency |

## Next

[Opening a Vault](../for-leaders/opening-a-vault.md) — if you are a trader who wants to lead.
