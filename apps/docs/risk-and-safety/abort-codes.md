# Abort Codes

When a transaction violates a Vault rule, Sui validators reject it with an abort code. The app surfaces these as human-readable messages. This page lists every code, its source, and what it means.

## keel_core abort codes

These are emitted by Metador's `keel_core` Move package. Any transaction that triggers one is rejected in full — no partial state change.

### vault module (codes 1–11)

| Code | Move Constant | Human Message | What triggered it |
|---|---|---|---|
| 1 | `ENotExecutor` | Only the vault's executor can do this. | Someone other than the designated leader tried to call `execute_order`. |
| 2 | `ERevoked` | This vault was revoked by its owner. Funds are safe and withdrawable. | The vault owner called `revoke`. All further execution is permanently blocked. |
| 3 | `EExpired` | This vault's mandate has expired. Withdraw anytime. | The current timestamp is past the vault's expiry. The mandate is dead. |
| 4 | `EWrongPool` | The chain refused: this vault may only trade its allowed market. | The order targeted a DeepBook pool other than the one encoded in the vault's scope wall. |
| 5 | `EWrongBalanceManager` | Vault/account mismatch — refusing to touch other funds. | The BalanceManager object passed to the call does not match the one the vault was created with. |
| 6 | `EBudgetExceeded` | The chain refused: this order would exceed the vault's budget ceiling. | The order's notional value would push `spent_quote` above the ceiling. |
| 7 | `ENotOwner` | Only the vault owner can revoke or reclaim. | An address other than the vault owner tried to call `revoke` or a reclaim function. |
| 8 | `ENotRevoked` | Reclaim requires the vault to be revoked first. | A reclaim was attempted on an active vault. Revoke first. |
| 9 | `EVaultNotEmpty` | Cannot reclaim: depositors still hold shares. Ask them to withdraw first. | Reclaim attempted while depositors hold outstanding shares. |
| 10 | `EZeroAmount` | Deposit or withdrawal amount must be greater than zero. | A deposit or withdrawal was attempted with a zero amount. |
| 11 | `EInsufficientShares` | You do not hold enough shares to withdraw that amount. | Withdrawal requested more shares than the caller holds. |
| 35 | `EZeroExpiry` | Vault expiry must be a real timestamp greater than zero. Perpetual vaults are not supported. | A vault creation was attempted with an expiry of zero. |

### shares module (codes 20–24)

| Code | Move Constant | Human Message | What triggered it |
|---|---|---|---|
| 20 | `EZeroAssets` | Internal error: vault has shares outstanding but no assets. Contact support. | Share/asset invariant violated — should not occur in normal operation. |
| 21 | `EZeroShares` | Internal error: withdrawal attempted against empty share supply. | Withdrawal attempted against empty share supply. |
| 22 | `EZeroDeposit` | Deposit amount must be greater than zero. | Deposit of zero was attempted. |
| 23 | `EZeroSharesBurn` | Shares to burn must be greater than zero. | Zero shares passed to the burn path. |
| 24 | `ESharesExceedSupply` | Cannot burn more shares than the total supply. | Requested burn exceeds the outstanding supply. |

### dca module (codes 30–34)

| Code | Move Constant | Human Message | What triggered it |
|---|---|---|---|
| 30 | `ETooEarly` | DCA tick interval has not elapsed yet. Try again later. | A crank call arrived before the configured tick interval elapsed. |
| 31 | `EZeroQuotePerTick` | DCA quote per tick must be greater than zero. | DCA was configured with a zero quote-per-tick value. |
| 32 | `EZeroInterval` | DCA interval must be greater than zero. | DCA was configured with a zero interval. |
| 33 | `EVaultMismatch` | This DCA config was created for a different vault. Use the correct config for this vault. | The DCA config object does not match the vault being cranked. |
| 34 | `EZeroBidPrice` | DCA bid price must be greater than zero. | A DCA tick was attempted with a zero bid price. |

### vault module (additional — codes 35)

| Code | Move Constant | Human Message | What triggered it |
|---|---|---|---|
| 35 | `EZeroExpiry` | Vault expiry must be a real timestamp greater than zero. Perpetual vaults are not supported. | A vault creation was attempted with an expiry of zero. |

## DeepBook abort codes surfaced by Metador

These originate in DeepBook's own Move code. Metador decodes them and shows the message below.

| DeepBook Code | Constant | Human Message | What triggered it |
|---|---|---|---|
| 0 | `EInvalidOwner` | Withdrawals answer only to the owner's key. | An address that is not the BalanceManager's owner tried to withdraw. This is the code shown in the red-team demo when an attacker with the TradeCap attempts to drain funds. |
| — | `EOrderInvalidPrice` | Order size or price doesn't fit this market's rules — adjusted values shown. | The price is not a multiple of the pool's tick size. |
| — | `EOrderInvalidLotSize` | Order size or price doesn't fit this market's rules — adjusted values shown. | The quantity is not a multiple of the pool's lot size. |
| — | `EOrderBelowMinimumSize` | Order size or price doesn't fit this market's rules — adjusted values shown. | The quantity is below the pool's minimum order size. |

When `EOrderInvalidPrice`, `EOrderInvalidLotSize`, or `EOrderBelowMinimumSize` appear, the app reads the pool's current tick, lot, and minimum size from on-chain and displays the adjusted values alongside the message so the leader can correct and resubmit.

## Next

[Red-Team Narrative](red-team.md) — a walk through the stolen-key scenario.
