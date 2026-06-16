# NAV and Shares

Metador uses mutual-fund-style accounting to track each depositor's ownership of a Vault. All arithmetic is integer-only — no floating-point values touch money at any layer.

## Net Asset Value

NAV is the total value of assets in the Vault's `BalanceManager` account at a given moment, expressed in the vault's quote token base units. It rises when trades are profitable and falls when trades lose.

## Share mechanics

When you deposit, you receive shares. The number of shares minted is proportional to the NAV at the time of your deposit. When you withdraw, your shares are redeemed at the current NAV per share and the corresponding token amount is returned to you.

## The canonical example

Maya deposits 1,000 tokens. The Vault has a NAV of 1,000 and zero existing shares, so she receives 1,000 shares at 1 token per share.

The leader trades. The Vault's NAV grows to 1,120 — a 12% gain. Maya's 1,000 shares are now worth 1,120 tokens.

Maya withdraws. Her profit is 120 tokens. Leo (the leader) earns 10% of that profit: 12 tokens. Maya receives 1,120 minus 12 = **1,108 tokens**.

The fee applies to realized profit only — not to principal, not to the total balance. If the Vault loses value, the leader earns no fee on that deposit.

## Integer math

All values are stored and computed in base units (the smallest indivisible unit of the token, as defined by its on-chain metadata). Decimal places are applied only at the display layer, after the chain computation is complete. There are no rounding modes that could silently transfer value between parties.

Share prices and NAV are stored as integers. Division that would produce a fractional share rounds down, so the Vault retains any dust rather than crediting it to a depositor.

## Next

[Getting Started](../for-savers/getting-started.md) — depositing into a Vault as a saver.
