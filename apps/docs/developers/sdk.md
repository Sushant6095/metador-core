# SDK

The Metador TypeScript SDK is a thin wrapper over `@mysten/sui` and the DeepBook v3 SDK. It exposes typed functions for every vault operation so app code never constructs raw PTBs by hand.

## Status

The SDK ships with `keel_core` at G1. Until then, `packages/deepbook` holds chain constants and pure helpers only. See [Testnet IDs](testnet-ids.md) for the current constants.

## Vault operations

The following surface is planned for the G1 release. Exact function signatures are finalized when `keel_core` is published and the PTB patterns are locked.

- `createVault(params)` — constructs and simulates the create-vault PTB (BalanceManager creation, TradeCap mint, Vault publish) and returns the dryRun result for UI preview before the user signs.
- `executeOrder(vaultId, orderParams)` — constructs the `execute_order` PTB and simulates it.
- `revoke(vaultId)` — constructs the revoke PTB.
- `deposit(vaultId, amount)` — constructs the deposit PTB and returns the projected share count.
- `withdraw(vaultId, shares)` — constructs the withdraw PTB and returns the projected token amount and leader fee.

## Read functions

- `getVault(vaultId)` — fetches the Vault object and decodes all fields, including the policy walls and current `spent_quote`.
- `getVaultEvents(vaultId, cursor?)` — returns the paginated on-chain event log, decoded into typed event objects.
- `getNAV(vaultId)` — returns current NAV per share in base units.

## Error decoding

- `decodeAbort(error)` — maps a Move abort code to the human message from `docs/abort-codes.md`.

## Design constraints

All money values in SDK inputs and outputs are `bigint` base units. The SDK never converts to floats internally. Decimal formatting is the caller's responsibility, using the coin metadata decimals fetched from on-chain.

Every mutating function returns a `TransactionBlock` for inspection before signing, plus a `simulate()` method that calls `dryRun` and returns the exact effects. The UI shows these effects to the user before requesting a signature.

## Next

[Running the Spike](running-the-spike.md) — manual PTB commands the SDK wraps.
