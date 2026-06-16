import { describe, expect, it } from 'vitest';
import { SCREENER_VAULTS, getScreenerVault } from './mock-screener';

describe('mock-screener dataset', () => {
  it('holds at least 500 rows for virtualization', () => {
    expect(SCREENER_VAULTS.length).toBeGreaterThanOrEqual(500);
  });

  it('resolves every row through getScreenerVault (detail-page bridge)', () => {
    for (const v of SCREENER_VAULTS) {
      expect(getScreenerVault(v.id)).toBe(v);
    }
  });

  it('returns undefined for unknown ids', () => {
    expect(getScreenerVault('0xdoesnotexist')).toBeUndefined();
  });

  it('keeps all money fields as bigint base units (no floats)', () => {
    for (const v of SCREENER_VAULTS) {
      expect(typeof v.tvl).toBe('bigint');
      expect(typeof v.budget).toBe('bigint');
      expect(typeof v.budgetSpent).toBe('bigint');
      // spent never exceeds the ceiling — the budget wall is law
      expect(v.budgetSpent <= v.budget).toBe(true);
    }
  });

  it('uses unique ids across the whole dataset', () => {
    const ids = new Set(SCREENER_VAULTS.map((v) => v.id));
    expect(ids.size).toBe(SCREENER_VAULTS.length);
  });

  it('keeps numerals out of vault names (mono-ratio integrity)', () => {
    // The parity mono-tabular ratio counts any numeric-bearing cell; the name
    // cell is sans-serif, so a digit there would wrongly drag the ratio down.
    for (const v of SCREENER_VAULTS) {
      expect(/\d/.test(v.name)).toBe(false);
    }
  });

  it('ends every sparkline exactly at the reported 7d NAV delta', () => {
    for (const v of SCREENER_VAULTS) {
      expect(v.sparkline7d.length).toBeGreaterThanOrEqual(2);
      expect(v.sparkline7d[0]).toBe(0);
      expect(v.sparkline7d[v.sparkline7d.length - 1]).toBe(v.nav7dDeltaBp);
      for (const p of v.sparkline7d) expect(Number.isInteger(p)).toBe(true);
    }
  });

  it('is deterministic at module scope (no Math.random / Date.now)', () => {
    // A generated row's fields are pure functions of index — assert a couple
    // of stable anchors so a regression in the hash is caught.
    const first = SCREENER_VAULTS[0];
    expect(first?.id).toBe('0xsc0100000000000000000000000000000000000000000000000000000000000001');
    expect(first?.name).toBe('Metador Flagship');
  });
});
