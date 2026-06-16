# Security Model

Metador's security rests on one principle: every guarantee that matters is enforced by Sui validators, not by Metador's servers, not by legal agreements, and not by the leader's honesty.

## Chain-enforced vs. trust-enforced

| Guarantee | Enforced by | Mechanism |
|---|---|---|
| Leader cannot withdraw depositor funds | Chain (DeepBook bytecode) | TradeCap has no withdrawal path; `withdraw` requires owner address |
| Leader cannot exceed budget ceiling | Chain (keel_core Move code) | `EBudgetExceeded` abort before any DeepBook call |
| Leader cannot trade a different market | Chain (keel_core Move code) | `EWrongPool` abort before any DeepBook call |
| Leader cannot trade after revocation | Chain (keel_core Move code) | `ERevoked` abort; revocation is instant and irreversible |
| Leader cannot trade after expiry | Chain (keel_core Move code) | `EExpired` abort |
| Only designated leader can execute | Chain (keel_core Move code) | `ENotExecutor` abort on wrong caller |
| Only vault owner can revoke | Chain (keel_core Move code) | `ENotOwner` abort on wrong caller |
| TradeCap cannot be extracted from Vault | Chain (Move type system) | Stored in private field; Move's ownership model prevents extraction |
| Metador cannot steal depositor funds | Chain (DeepBook bytecode) | Same as leader: Metador holds no withdrawal-capable key |
| Leader trades profitably | Not enforced | Market outcomes; no structural guarantee exists |
| Leader communicates strategy honestly | Not enforced | Reputation; off-chain responsibility |
| keel_core has no bugs | Not fully verified | Pre-audit; testnet hard caps until external review clears |

## What "chain-enforced" means in practice

When a transaction fails a Metador assertion, Sui validators reject the entire transaction. No partial state change occurs. The failure is recorded on-chain (visible in the activity feed), the gas is consumed, and no funds move. This is not a software exception that Metador catches and handles — it is consensus-level rejection.

Metador's servers are not involved in enforcement. If Metador's servers go offline, existing vaults continue to operate: leaders can still trade, depositors can still withdraw, and the policy walls remain enforced. Metador's backend provides the UI and the event index — it is not the security layer.

## The key that cannot open the house

A car key and a house key are both metal, both held by the same person. But a car key cannot open a house — not because of a rule, but because it is the wrong shape. A TradeCap is the wrong shape for withdrawals. DeepBook's `withdraw` function accepts an owner address or a `WithdrawCap`. A TradeCap is neither. This is type-system physics, not a promise.

## Next

[Abort Codes](abort-codes.md) — every chain rejection code and what it means.
