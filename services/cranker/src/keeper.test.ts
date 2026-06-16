import { describe, it, expect } from 'vitest';
import {
  selectRedeemable,
  runKeeperOnce,
  type KeeperConfig,
  type PredictChainClient,
  type SettledOrder,
  type RollableVault,
} from './keeper.js';

const CONFIG: KeeperConfig = {
  predictServerUrl: 'https://predict-server.testnet.mystenlabs.com',
  registryId: '0xregistry',
  vaultIds: ['0xvault'],
  pollIntervalMs: 1000,
};

const ORDER_A: SettledOrder = { expiryMarketId: '0xm1', managerId: '0xmgr', orderId: '1' };
const ORDER_B: SettledOrder = { expiryMarketId: '0xm1', managerId: '0xmgr', orderId: '2' };

function fakeClient(overrides: Partial<PredictChainClient> = {}): PredictChainClient {
  return {
    fetchSettledOrders: async () => [ORDER_A, ORDER_B],
    fetchRollableVaults: async () => [],
    redeemSettled: async () => ({ txDigest: '0xdigest' }),
    rollVault: async () => ({ txDigest: '0xdigest' }),
    ...overrides,
  };
}

describe('selectRedeemable', () => {
  it('skips orders already seen this run (collision avoidance)', () => {
    const seen = new Set<string>(['0xm1:1']);
    expect(selectRedeemable([ORDER_A, ORDER_B], seen)).toEqual([ORDER_B]);
  });
});

describe('runKeeperOnce', () => {
  it('redeems all unseen settled orders and records them', async () => {
    const seen = new Set<string>();
    const summary = await runKeeperOnce(fakeClient(), CONFIG, seen);
    expect(summary.redeemed).toBe(2);
    expect(summary.failures).toBe(0);
    expect(seen.size).toBe(2);
  });

  it('keeps sweeping when one redeem fails', async () => {
    const client = fakeClient({
      redeemSettled: async (o: SettledOrder) => {
        if (o.orderId === '1') throw new Error('lost the race');
        return { txDigest: '0xok' };
      },
    });
    const summary = await runKeeperOnce(client, CONFIG, new Set());
    expect(summary.redeemed).toBe(1);
    expect(summary.failures).toBe(1);
  });

  it('rolls vaults whose bound expiry has settled', async () => {
    const rollable: RollableVault[] = [{ vaultId: '0xvault', settledExpiryMarketId: '0xm1' }];
    const client = fakeClient({ fetchRollableVaults: async () => rollable });
    const summary = await runKeeperOnce(client, CONFIG, new Set());
    expect(summary.rolled).toBe(1);
  });

  it('does not throw when the indexer is unreachable', async () => {
    const client = fakeClient({
      fetchSettledOrders: async () => {
        throw new Error('network down');
      },
    });
    const summary = await runKeeperOnce(client, CONFIG, new Set());
    expect(summary).toEqual({ redeemed: 0, rolled: 0, failures: 0 });
  });
});
