import { describe, expect, it } from 'vitest';
import { computeFillPercent } from './BudgetMeter';

describe('computeFillPercent', () => {
  it('returns 0 when budget is 0n (guard)', () => {
    expect(computeFillPercent(0n, 0n)).toBe(0);
    expect(computeFillPercent(500n, 0n)).toBe(0);
  });

  it('returns 0 when spent is 0n', () => {
    expect(computeFillPercent(0n, 1000n)).toBe(0);
  });

  it('returns 50 at half budget', () => {
    expect(computeFillPercent(500n, 1000n)).toBe(50);
  });

  it('returns exactly 79 percent — below warn threshold', () => {
    // 79% = 7900 / 10000 = 79.0
    const result = computeFillPercent(790n, 1000n);
    expect(result).toBeCloseTo(79, 1);
    expect(result).toBeLessThan(80);
  });

  it('returns exactly 80 percent — at warn threshold boundary', () => {
    const result = computeFillPercent(800n, 1000n);
    expect(result).toBe(80);
  });

  it('returns exactly 100 at budget exactly spent', () => {
    expect(computeFillPercent(1000n, 1000n)).toBe(100);
  });

  it('caps at 100 when spent exceeds budget', () => {
    // spent > budget should not return > 100
    expect(computeFillPercent(1200n, 1000n)).toBe(100);
    expect(computeFillPercent(9999n, 1000n)).toBe(100);
  });

  it('handles large bigint values correctly (e.g. 9 decimals USDC)', () => {
    // budget = 1000 USDC (9 decimals) = 1_000_000_000_000n
    // spent  = 250 USDC = 250_000_000_000n → 25%
    const budget = 1_000_000_000_000n;
    const spent = 250_000_000_000n;
    expect(computeFillPercent(spent, budget)).toBe(25);
  });

  it('handles 81% correctly', () => {
    const result = computeFillPercent(810n, 1000n);
    expect(result).toBe(81);
  });

  it('returns fractional percent correctly (2 decimal precision)', () => {
    // 1/3 ≈ 33.33%
    const result = computeFillPercent(1n, 3n);
    // 10000 / 3 = 3333 → 33.33
    expect(result).toBeCloseTo(33.33, 1);
  });

  it('spent=1 budget=10000 → 0.01%', () => {
    const result = computeFillPercent(1n, 10000n);
    expect(result).toBe(0.01);
  });
});
