/**
 * Display formatters for the trade terminal. All inputs are bigint base units;
 * these produce strings only (CLAUDE.md §2 — floats never touch money math).
 * Numerals render in tabular mono via MONO_STYLE so columns align.
 */
import type { CSSProperties } from 'react';
import { formatBaseUnits } from '@metador/deepbook';

export const MONO_STYLE: CSSProperties = {
  fontFamily: 'var(--metador-font-mono)',
  fontVariantNumeric: 'tabular-nums',
};

export function formatPrice(
  price: bigint,
  quoteDecimals: number,
  digits = 2,
): string {
  return formatBaseUnits(price, quoteDecimals, { maxFractionDigits: digits });
}

export function formatUsd(
  amount: bigint,
  decimals: number,
  digits = 2,
): string {
  const negative = amount < 0n;
  const body = formatBaseUnits(negative ? -amount : amount, decimals, {
    maxFractionDigits: digits,
  });
  return `${negative ? '-' : ''}$${body}`;
}

export function formatSignedUsd(
  amount: bigint,
  decimals: number,
  digits = 2,
): string {
  const sign = amount >= 0n ? '+' : '-';
  const abs = amount < 0n ? -amount : amount;
  return `${sign}$${formatBaseUnits(abs, decimals, { maxFractionDigits: digits })}`;
}

/** Compact $836.86M / $1.45B for volume + open interest. Display-only. */
export function formatCompactUsd(amount: bigint, decimals: number): string {
  const whole = Number(amount / 10n ** BigInt(decimals));
  if (whole >= 1e9) return `$${(whole / 1e9).toFixed(2)}B`;
  if (whole >= 1e6) return `$${(whole / 1e6).toFixed(2)}M`;
  if (whole >= 1e3) return `$${(whole / 1e3).toFixed(2)}K`;
  return `$${whole.toLocaleString('en-US')}`;
}

export function formatSize(
  size: bigint,
  baseDecimals: number,
  digits = 4,
): string {
  return formatBaseUnits(size, baseDecimals, { maxFractionDigits: digits });
}

/** Signed basis points → "+4.12%" / "-8.42%". */
export function formatBp(bp: number): string {
  const sign = bp >= 0 ? '+' : '-';
  return `${sign}${(Math.abs(bp) / 100).toFixed(2)}%`;
}

/** Sensible price precision by magnitude (SUI shows 4dp, BTC shows 0). */
export function priceDigits(price: bigint, quoteDecimals: number): number {
  const whole = Number(price / 10n ** BigInt(quoteDecimals));
  if (whole >= 1000) return 0;
  if (whole >= 1) return 4;
  return 6;
}
