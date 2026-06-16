# Reading a Vault

The vault detail page has three main information surfaces: the policy card, the budget meter, and the activity feed. Each tells you something different about a vault's current state.

## The policy card

The policy card renders the four on-chain walls in plain English. Every field is read directly from the Vault object on-chain — it cannot be edited by the leader or by Metador after the vault is created.

- **Market** — the single DeepBook pool this vault is allowed to trade. An order to any other pool aborts at the chain level.
- **Budget ceiling** — total spending limit in the vault's quote token. Once reached, no further orders can be placed.
- **Expiry** — countdown to the mandate expiry. After this date, the vault accepts no new orders, but withdrawals remain open.
- **Status** — Active, Expired, or Revoked. Revoked vaults show a prominent indicator; all funds remain withdrawable.

## The budget meter

The budget meter shows how much of the spending ceiling has been consumed. It is updated from on-chain events — a live reading of `spent_quote` on the Vault object divided by the ceiling.

A vault near its ceiling is not necessarily in trouble — it may have traded actively and profitably. A vault that hit its ceiling early with no gains is worth examining in the activity feed.

## The activity feed

The activity feed shows every on-chain event the vault has emitted: placed orders, filled orders, rejected attempts (aborts), deposits, and withdrawals. Rejected attempts appear in the feed — if a leader's order was refused by the budget or scope wall, that rejection is visible.

The feed is not curated. Metador cannot remove events. If you see an order rejected for `EWrongPool`, the leader attempted to trade a market outside their mandate. The chain blocked it, but the attempt is on the record.

## Next

[Risks](risks.md) — what the walls do and do not protect against.
