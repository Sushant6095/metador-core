import { describe, expect, it } from 'vitest';
import { shortenAddress } from '@metador/deepbook';

/**
 * AddressPill delegates to shortenAddress from @metador/deepbook.
 * Tests are over the pure helper function — formatting behaviour.
 */
describe('AddressPill — shortenAddress formatting', () => {
  const fullAddress =
    '0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7';

  it('shortens a full address to 0x{4}…{4} format (default visible=4)', () => {
    const result = shortenAddress(fullAddress, 4);
    expect(result).toBe('0x642a…0dc7');
  });

  it('shortens with visible=6 to 0x{6}…{6}', () => {
    // fullAddress ends in '…beef30dc7'; last 6 chars = 'f30dc7'
    const result = shortenAddress(fullAddress, 6);
    expect(result).toBe('0x642a86…f30dc7');
  });

  it('returns the original if address is too short to shorten', () => {
    const short = '0xabcd';
    const result = shortenAddress(short, 4);
    // length 6 ≤ 2 + 4*2 = 10 → not shortened... actually 6 <= 10, so returned as-is
    expect(result).toBe('0xabcd');
  });

  it('returns the original string for non-0x addresses', () => {
    const nonHex = 'not-an-address';
    expect(shortenAddress(nonHex)).toBe('not-an-address');
  });

  it('returns the original for empty string', () => {
    expect(shortenAddress('')).toBe('');
  });

  it('shortens a long 32-byte address correctly', () => {
    const addr =
      '0x' + 'a'.repeat(64); // 66 chars
    const result = shortenAddress(addr, 4);
    expect(result).toBe('0xaaaa…aaaa');
  });

  it('uses the ellipsis character (…) not three dots (...)', () => {
    const result = shortenAddress(fullAddress, 4);
    expect(result).toContain('…');
    expect(result).not.toContain('...');
  });
});
