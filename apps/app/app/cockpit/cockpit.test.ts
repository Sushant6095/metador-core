import { describe, expect, it } from 'vitest';
import { computeLeaderTvlByCurrency } from './page';
import type { MockVault } from '../../lib/mock-vaults';

// Minimal vault stubs — only the fields used by the helper.
function makeVault(
  overrides: Pick<MockVault, 'quoteSymbol' | 'tvl'>,
): MockVault {
  return {
    id: '0x0',
    name: 'Test',
    leader: '0x0',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteDecimals: overrides.quoteSymbol === 'SUI' ? 9 : 6,
    pnl30d: 0n,
    budget: 0n,
    budgetSpent: 0n,
    expiresAtMs: 0,
    status: 'active',
    followers: 0,
    ...overrides,
  };
}

describe('computeLeaderTvlByCurrency', () => {
  it('returns zeros for an empty vault list', () => {
    const result = computeLeaderTvlByCurrency([]);
    expect(result.suiTotal).toBe(0n);
    expect(result.dbusdc6Total).toBe(0n);
  });

  it('sums SUI vaults only into suiTotal', () => {
    const vaults = [
      makeVault({ quoteSymbol: 'SUI', tvl: 1_000_000_000n }),
      makeVault({ quoteSymbol: 'SUI', tvl: 2_000_000_000n }),
    ];
    const result = computeLeaderTvlByCurrency(vaults);
    expect(result.suiTotal).toBe(3_000_000_000n);
    expect(result.dbusdc6Total).toBe(0n);
  });

  it('sums DBUSDC vaults only into dbusdc6Total', () => {
    const vaults = [
      makeVault({ quoteSymbol: 'DBUSDC', tvl: 5_000_000n }),
      makeVault({ quoteSymbol: 'DBUSDC', tvl: 10_000_000n }),
    ];
    const result = computeLeaderTvlByCurrency(vaults);
    expect(result.suiTotal).toBe(0n);
    expect(result.dbusdc6Total).toBe(15_000_000n);
  });

  it('handles mixed SUI and DBUSDC vaults correctly', () => {
    const vaults = [
      makeVault({ quoteSymbol: 'SUI', tvl: 12_450_000_000_000n }),
      makeVault({ quoteSymbol: 'DBUSDC', tvl: 86_300_120_000n }),
      makeVault({ quoteSymbol: 'SUI', tvl: 3_500_000_000_000n }),
    ];
    const result = computeLeaderTvlByCurrency(vaults);
    expect(result.suiTotal).toBe(15_950_000_000_000n);
    expect(result.dbusdc6Total).toBe(86_300_120_000n);
  });

  it('does not silently drop DBUSDC vaults when SUI vaults are also present', () => {
    // Regression guard for the original bug: only summing quoteSymbol === 'SUI'
    const vaults = [
      makeVault({ quoteSymbol: 'DBUSDC', tvl: 1_000_000n }),
    ];
    const result = computeLeaderTvlByCurrency(vaults);
    expect(result.dbusdc6Total).toBe(1_000_000n);
    expect(result.suiTotal).toBe(0n);
  });
});
