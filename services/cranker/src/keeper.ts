/**
 * Settled-redeem keeper (ADR-009 step 4, idea #8). Watches DeepBook Predict for
 * settled orders, calls the permissionless `expiry_market::redeem_settled` to claim
 * payouts on behalf of owners, and triggers a vault `roll` when a vault's bound
 * expiry settles. Untrusted by design (CLAUDE.md §10): the chain re-verifies every
 * call, so a misbehaving keeper can waste its own gas but cannot move funds wrongly.
 *
 * The chain client is an injected boundary (`PredictChainClient`) so this module's
 * selection/sequencing logic is unit-testable with zero network deps; the real
 * `@mysten/sui` implementation is wired in once the spike records deployed IDs
 * (see contracts/keel_core/PREDICT-SPIKE.md).
 */

/** Deployed object IDs + policy, filled from the predict-testnet-4-16 deployment. */
export interface KeeperConfig {
  readonly predictServerUrl: string;
  readonly registryId: string;
  /** Vaults this keeper auto-rolls on settlement (Metador `PredictVault` IDs). */
  readonly vaultIds: readonly string[];
  /** Poll cadence, ms. */
  readonly pollIntervalMs: number;
}

/** A resolved-but-unredeemed order discovered from the indexer. */
export interface SettledOrder {
  readonly expiryMarketId: string;
  readonly managerId: string;
  readonly orderId: string; // u256 as string
}

export interface RollableVault {
  readonly vaultId: string;
  readonly settledExpiryMarketId: string;
}

/** The chain boundary. Real impl uses @mysten/sui `Transaction` + the deployed IDs. */
export interface PredictChainClient {
  /** Settled orders not yet redeemed, from `predict-server`. */
  fetchSettledOrders(config: KeeperConfig): Promise<readonly SettledOrder[]>;
  /** Vaults whose bound expiry has settled and are due a roll. */
  fetchRollableVaults(config: KeeperConfig): Promise<readonly RollableVault[]>;
  /** Permissionless `expiry_market::redeem_settled` for one order. */
  redeemSettled(order: SettledOrder): Promise<{ txDigest: string }>;
  /** Leader `predict_vault::roll` for one vault. */
  rollVault(vault: RollableVault): Promise<{ txDigest: string }>;
}

/**
 * Pure selection: keep only orders not already handled this run. Coordinating
 * keepers avoid colliding on the same order by tracking `seen` keys (a settled
 * order is idempotent on-chain, so a lost race just wastes gas, never funds).
 */
export function selectRedeemable(
  orders: readonly SettledOrder[],
  seen: ReadonlySet<string>,
): readonly SettledOrder[] {
  return orders.filter((o) => !seen.has(orderKey(o)));
}

export function orderKey(order: SettledOrder): string {
  return `${order.expiryMarketId}:${order.orderId}`;
}

export interface KeeperRunSummary {
  readonly redeemed: number;
  readonly rolled: number;
  readonly failures: number;
}

/** One keeper pass: redeem settled orders, then roll due vaults. Never throws. */
export async function runKeeperOnce(
  client: PredictChainClient,
  config: KeeperConfig,
  seen: Set<string>,
): Promise<KeeperRunSummary> {
  let redeemed = 0;
  let rolled = 0;
  let failures = 0;

  const settled = await client.fetchSettledOrders(config).catch(() => []);
  for (const order of selectRedeemable(settled, seen)) {
    try {
      await client.redeemSettled(order);
      seen.add(orderKey(order));
      redeemed += 1;
    } catch {
      failures += 1; // keep sweeping; a single bad order must not stall the batch
    }
  }

  const rollable = await client.fetchRollableVaults(config).catch(() => []);
  for (const vault of rollable) {
    try {
      await client.rollVault(vault);
      rolled += 1;
    } catch {
      failures += 1;
    }
  }

  return { redeemed, rolled, failures };
}

/** Run the keeper loop until `signal` aborts. Each pass logs a one-line summary. */
export async function startKeeper(
  client: PredictChainClient,
  config: KeeperConfig,
  log: (msg: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const seen = new Set<string>();
  while (!signal.aborted) {
    const summary = await runKeeperOnce(client, config, seen);
    log(`keeper: redeemed=${summary.redeemed} rolled=${summary.rolled} failures=${summary.failures}`);
    await sleep(config.pollIntervalMs, signal);
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
