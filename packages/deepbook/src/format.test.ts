import { describe, expect, test } from 'vitest';
import { formatBaseUnits, shortenAddress } from './format';

describe('formatBaseUnits — known answers', () => {
  test('whole units, 9 decimals (SUI)', () => {
    expect(formatBaseUnits(1_000_000_000n, 9)).toBe('1');
    expect(formatBaseUnits(2_000_000_000n, 9)).toBe('2');
  });

  test('fractional, trailing zeros trimmed', () => {
    expect(formatBaseUnits(1_234_567_890n, 9, { maxFractionDigits: 9 })).toBe(
      '1.23456789',
    );
    expect(formatBaseUnits(1_500_000_000n, 9)).toBe('1.5');
  });

  test('smallest unit, 9 decimals', () => {
    expect(formatBaseUnits(1n, 9, { maxFractionDigits: 9 })).toBe('0.000000001');
  });

  test('default 6 fraction digits TRUNCATE (never round up)', () => {
    // 0.0000019 SUI → shown as 0.000001, not 0.000002
    expect(formatBaseUnits(1_900n, 9)).toBe('0.000001');
  });

  test('zero', () => {
    expect(formatBaseUnits(0n, 9)).toBe('0');
    expect(formatBaseUnits(0n, 0)).toBe('0');
  });

  test('negative amounts (PnL)', () => {
    expect(formatBaseUnits(-1_500_000_000n, 9)).toBe('-1.5');
    expect(formatBaseUnits(-1n, 9, { maxFractionDigits: 9 })).toBe('-0.000000001');
  });

  test('thousands grouping, 6 decimals (USDC-style)', () => {
    expect(formatBaseUnits(123_456_789_012_345n, 6)).toBe('123,456,789.012345');
  });

  test('zero decimals', () => {
    expect(formatBaseUnits(1_234_567n, 0)).toBe('1,234,567');
  });

  test('maxFractionDigits 0 truncates fraction entirely', () => {
    expect(formatBaseUnits(1_999_999_999n, 9, { maxFractionDigits: 0 })).toBe('1');
  });

  test('rejects invalid decimals', () => {
    expect(() => formatBaseUnits(1n, -1)).toThrow();
    expect(() => formatBaseUnits(1n, 1.5)).toThrow();
  });
});

describe('shortenAddress', () => {
  test('shortens full sui address', () => {
    const address = '0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7';
    expect(shortenAddress(address)).toBe('0x642a…0dc7');
  });

  test('returns non-hex input unchanged', () => {
    expect(shortenAddress('not-an-address')).toBe('not-an-address');
  });

  test('returns short input unchanged', () => {
    expect(shortenAddress('0xabcd')).toBe('0xabcd');
  });
});
