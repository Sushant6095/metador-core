# Abort-code dictionary (single source of truth for error UX)

Frontend renders ONLY from this table. Move constants in contracts/keel_core
must stay in sync — /risk-review checks both directions.

## agent_mandate::agent_mandate (spike — testnet runnable)

| Code | Move const | Human message (UI) |
|---|---|---|
| 1 | ENotAgent | Only the vault's executor can do this. |
| 2 | ERevoked | This vault was revoked by its owner. Funds are safe and withdrawable. |
| 3 | EExpired | This vault's mandate has expired. Withdraw anytime. |
| 4 | EWrongPool | The chain refused: this vault may only trade its allowed market. |
| 5 | EWrongBalanceManager | Vault/account mismatch — refusing to touch other funds. |
| 6 | EBudgetExceeded | The chain refused: this order would exceed the vault's budget ceiling. |
| 7 | ENotOwner | Only the vault owner can revoke or reclaim. |
| 8 | ENotRevoked | Reclaim requires the vault to be revoked first. |

## agent_mandate::vault (G1 — Vault, shares, Delegate, DCA)

| Code | Move const | Module | Human message (UI) |
|---|---|---|---|
| 1 | ENotExecutor | vault | Only the vault's leader can execute orders. |
| 2 | ERevoked | vault | This vault was revoked by its owner. Funds are safe and withdrawable. |
| 3 | EExpired | vault | This vault's mandate has expired. Withdraw anytime. |
| 4 | EWrongPool | vault | The chain refused: this vault may only trade its allowed market. |
| 5 | EWrongBalanceManager | vault | Vault/account mismatch — refusing to touch other funds. |
| 6 | EBudgetExceeded | vault | The chain refused: this order would exceed the vault's budget ceiling. |
| 7 | ENotOwner | vault | Only the vault owner can revoke or reclaim. |
| 8 | ENotRevoked | vault | Reclaim requires the vault to be revoked first. |
| 9 | EVaultNotEmpty | vault | Cannot reclaim: depositors still hold shares. Ask them to withdraw first. |
| 10 | EZeroAmount | vault | Deposit or withdrawal amount must be greater than zero. |
| 11 | EInsufficientShares | vault | You do not hold enough shares to withdraw that amount. |

## agent_mandate::shares (G1 — pure math guards)

| Code | Move const | Module | Human message (UI) |
|---|---|---|---|
| 20 | EZeroAssets | shares | Internal error: vault has shares outstanding but no assets. Contact support. |
| 21 | EZeroShares | shares | Internal error: withdrawal attempted against empty share supply. |
| 22 | EZeroDeposit | shares | Deposit amount must be greater than zero. |
| 23 | EZeroSharesBurn | shares | Shares to burn must be greater than zero. |
| 24 | ESharesExceedSupply | shares | Cannot burn more shares than the total supply. |

## agent_mandate::dca (G1 — DCA strategy)

| Code | Move const | Module | Human message (UI) |
|---|---|---|---|
| 30 | ETooEarly | dca | DCA tick interval has not elapsed yet. Try again later. |
| 31 | EZeroQuotePerTick | dca | DCA quote per tick must be greater than zero. |
| 32 | EZeroInterval | dca | DCA interval must be greater than zero. |
| 33 | EVaultMismatch | dca | This DCA config was created for a different vault. Use the correct config for this vault. |
| 34 | EZeroBidPrice | dca | DCA bid price must be greater than zero. |

## agent_mandate::vault (G1 — additional, added post risk-review)

| Code | Move const | Module | Human message (UI) |
|---|---|---|---|
| 35 | EZeroExpiry | vault | Vault expiry must be a real timestamp greater than zero. Perpetual vaults are not supported. |

## DeepBook-side aborts (their codes, our copy)

| Code | Source | Human message (UI) |
|---|---|---|
| 0 | EInvalidOwner (deepbook::balance_manager) | Withdrawals answer only to the owner's key. |
| — | EOrderInvalidPrice / EOrderInvalidLotSize / EOrderBelowMinimumSize | Order size or price doesn't fit this market's rules — adjusted values shown. |
