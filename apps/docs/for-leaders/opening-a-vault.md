# Opening a Vault

A leader creates a vault through the Create Vault wizard in the Metador app. The wizard collects the policy parameters, previews the exact on-chain transaction, and asks for one signature. The resulting Vault object is immutable in its core policy — the allowed market, the ceiling, and the expiry cannot be changed after creation.

## Prerequisites

You need a Sui wallet on testnet with enough SUI for gas (approximately 0.2 SUI). The wizard creates a DeepBook `BalanceManager` if you do not already have one; you will deposit trading funds into it as part of the flow.

## The wizard steps

**Step 1: Choose a market.** Select the DeepBook pool your vault will trade. This becomes the scope wall — every order must use this pool, and no other. It cannot be changed after creation.

**Step 2: Set the budget ceiling.** The ceiling is the maximum total the vault's TradeCap can spend across all orders during the mandate's lifetime. It is not a per-trade limit. State it in the pool's quote token. Once the vault's running total hits the ceiling, trading stops.

**Step 3: Set the expiry.** The mandate expires at this timestamp. After expiry, no orders can be placed and depositors withdraw freely. Choose a duration that matches your strategy horizon. It cannot be extended.

**Step 4: Review the policy card.** The wizard renders the policy card exactly as depositors will see it. Confirm every field before signing.

**Step 5: Sign and publish.** One transaction creates the BalanceManager (if needed), mints the TradeCap, locks it inside the new Vault object, and shares the Vault on-chain. The wizard shows the dryRun output — exact gas cost and the objects that will be created — before you sign.

## After creation

Your vault appears in the marketplace immediately. The cockpit is your trading interface: it routes orders through the policy-gated `execute_order` function. Every order is checked against the four walls before reaching DeepBook.

## Next

[Earning as a Leader](earning.md) — how the 10% profit fee works.
