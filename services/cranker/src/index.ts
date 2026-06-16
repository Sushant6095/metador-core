/**
 * metador-crank — the public `npx metador-crank` keeper CLI. Untrusted by design:
 * the chain re-verifies every call (CLAUDE.md §10). Runs the settled-redeem +
 * auto-roll keeper (ADR-009 step 4) once the spike records deployed Predict IDs
 * and wires a real `@mysten/sui` `PredictChainClient` (see keeper.ts).
 */
export { startKeeper, runKeeperOnce, selectRedeemable } from './keeper.js';
export type {
  KeeperConfig,
  PredictChainClient,
  SettledOrder,
  RollableVault,
  KeeperRunSummary,
} from './keeper.js';

function main(): void {
  console.log(
    'metador-crank: settled-redeem keeper ready. Inject a PredictChainClient with ' +
      'deployed testnet IDs (PREDICT-SPIKE.md) and call startKeeper().',
  );
}

main();
