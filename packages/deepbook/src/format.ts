/**
 * Money display formatting. All balance/price/PnL math stays in integer
 * base units (bigint) — JS floats never touch money (CLAUDE.md §1).
 * Fraction digits beyond `maxFractionDigits` are TRUNCATED, never rounded:
 * a balance display must never overstate what the chain holds.
 */

const DEFAULT_MAX_FRACTION_DIGITS = 6;

function groupIntegerPart(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatBaseUnits(
  amount: bigint,
  decimals: number,
  options?: { maxFractionDigits?: number },
): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 38) {
    throw new Error(`formatBaseUnits: invalid decimals ${decimals}`);
  }
  const maxFractionDigits = options?.maxFractionDigits ?? DEFAULT_MAX_FRACTION_DIGITS;
  if (!Number.isInteger(maxFractionDigits) || maxFractionDigits < 0) {
    throw new Error(`formatBaseUnits: invalid maxFractionDigits ${maxFractionDigits}`);
  }

  const isNegative = amount < 0n;
  const absolute = (isNegative ? -amount : amount).toString().padStart(decimals + 1, '0');
  const integerPart = absolute.slice(0, absolute.length - decimals) || '0';
  const fractionFull = decimals === 0 ? '' : absolute.slice(absolute.length - decimals);
  const fraction = fractionFull.slice(0, maxFractionDigits).replace(/0+$/, '');

  const sign = isNegative ? '-' : '';
  const grouped = groupIntegerPart(integerPart);
  return fraction.length > 0 ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}

/** Shorten a 0x address for display: 0x1234…abcd. */
export function shortenAddress(address: string, visible = 4): string {
  if (!/^0x[0-9a-fA-F]+$/.test(address) || address.length <= 2 + visible * 2) {
    return address;
  }
  return `${address.slice(0, 2 + visible)}…${address.slice(-visible)}`;
}
