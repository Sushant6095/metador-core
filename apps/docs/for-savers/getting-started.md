# Getting Started

How to deposit into a Metador Vault for the first time. Metador is on testnet — no real funds are at risk during this period.

## Before you deposit

You need a Sui-compatible wallet (Sui Wallet, Suiet, or any wallet supported by `@mysten/dapp-kit`) connected to Sui testnet. You need testnet SUI for gas — use the faucet at `https://faucet.sui.io`. You need the vault's quote token (DBUSDC on testnet) in your wallet.

## Connect your wallet

Open the Metador app and connect your wallet using the "Connect" button in the top right. Metador never requests your seed phrase or private key. It reads your address and asks you to sign transactions you initiate.

## Browse the marketplace

The marketplace shows all active vaults. Each card displays the vault's allowed market, budget ceiling, time remaining on the mandate, the leader's track record, and the current NAV. Read the policy card before depositing — the policy is what the chain enforces.

## Read the policy card

Before depositing, open the vault detail page and review the policy card. It shows:

- **Allowed market** — the only pool this vault can trade. The leader cannot deviate from this.
- **Budget ceiling** — the maximum total the leader can spend, shown as a token amount.
- **Expiry** — the date after which the mandate is dead and no further trades can be placed.
- **Leader address** — the address authorized to execute trades.

If anything in the policy does not match what you were told about this vault, do not deposit.

## Deposit

Enter the amount you want to deposit. The app shows the current NAV per share and the number of shares you will receive before you sign. Review the transaction preview — it shows exact token amounts, gas cost, and the resulting share balance. Confirm and sign.

Your deposit lands on-chain in the next Sui consensus round (typically under 500ms). Your share balance appears in your portfolio immediately after.

## Withdraw

You can withdraw at any time. Go to your portfolio, select the vault, and click Withdraw. The app calculates your current token value (shares × current NAV per share) and shows any leader fee due on profit before you sign.

## Next

[Reading a Vault](reading-a-vault.md) — understanding the policy card, budget meter, and activity feed.
