# Predict Spike Runbook — testnet `mint → settle → redeem` round-trip

> ADR-009 verification step 1. Goal: prove Metador can drive DeepBook Predict on
> testnet end-to-end, and record the deployed object IDs into
> `packages/deepbook/src/constants.ts`. **Founder-gated** — needs a funded wallet
> and dUSDC (captcha/form), which an agent cannot obtain.

## 0 · Founder actions (do these first — everything blocks on them)

1. **Fund the OWNER key** (testnet SUI, captcha):
   `https://faucet.sui.io/?address=0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7`
2. **Request dUSDC** (this is NOT the official testnet USDC — Predict's own quote):
   `https://tally.so/r/Xx102L`
3. **Join the DeepBook Builder TG** for unblock speed: `https://go.sui.io/ofw-deepbook-tg`
4. **Re-pin the Predict source to the deploy branch.** The vendored clone is on
   `main@e276939`; the testnet deployment is branch `predict-testnet-4-16`:
   ```bash
   cd contracts/deepbookv3 && git fetch origin predict-testnet-4-16 \
     && git checkout predict-testnet-4-16
   ```
   Then re-run `sui move build` in `contracts/keel_core` and reconcile any signature
   drift against `packages/deepbook/src/predict.ts` and `predict_vault.move`.

## 1 · Discover deployed object IDs

The public indexer/API publishes the live registry, expiry markets, pool vault,
market oracles, pyth sources, protocol config, and the dUSDC type:

- `https://predict-server.testnet.mystenlabs.com` — query active markets + their
  `expiry_market_id`, `market_oracle_id`, `pyth_source_id`, `pool_vault_id`.
- Record them into `packages/deepbook/src/constants.ts` as `PREDICT_TESTNET = { … }`
  next to the existing `DEEPBOOK_TESTNET` block (single source of truth).

## 2 · The round-trip (exact Move call targets)

All confirmed against the Predict Move source. dUSDC + lots in base units.

| Step | Call | Notes |
|---|---|---|
| Create account | `registry::create_and_share_manager(registry, ctx)` | one-time per user; emits the `PredictManager` ID |
| Fund | `predict_manager::deposit(manager, coin: Coin<DUSDC>, ctx)` | owner-only |
| Open | `expiry_market::mint(market, manager, &proof, config, market_oracle, pyth, lower_strike, higher_strike, quantity, leverage, clock, ctx) → order_id` | `proof = manager.generate_proof_as_owner(ctx)`; `leverage` from `order::leverage_*` |
| Settle | _wait for the rolling expiry to settle (sub-hour)_ | watch `oracle::OracleSVIUpdated` / settlement on the indexer |
| Redeem | `expiry_market::redeem_settled(market, manager, config, market_oracle, pyth, order_id, close_quantity, clock, ctx)` | **permissionless** — this is the keeper hook |
| Cash out | `predict_manager::withdraw(manager, amount, ctx) → Coin<DUSDC>` | owner-only |

PTB construction uses `@mysten/sui` (`Transaction`) + the deployed package IDs. Mint
fees route through the manager's trade proof, so the proof is required even for an
owner-initiated mint.

## 3 · Exit criteria

- [ ] One full `create → deposit → mint → settle → redeem_settled → withdraw` on testnet.
- [ ] Deployed IDs recorded in `packages/deepbook/src/constants.ts`.
- [ ] Any signature drift vs `predict.ts` / `predict_vault.move` reconciled.
- [ ] The three demo aborts reproduced (revoked cap, out-of-scope feed, budget exceeded)
      to film the four-walls beat (CLAUDE.md §4).

Once green, the vault `roll`/keeper flows are wired against the same IDs and the
PLP+Hedge simulation (`packages/deepbook/src/sim/plp-hedge.ts`) is re-run on real
`predict-server` SVI history for the submission's simulation result.
