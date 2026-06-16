/**
 * sparkline geometry — pure, integer-in / string-out. No React, no floats on
 * money. Maps a basis-point series to SVG polyline points within a fixed box.
 *
 * The series is offsets-from-open in basis points (ScreenerVault.sparkline7d).
 * We normalize to the series' own min/max so every spark fills its box; the
 * sign of the LAST point decides the stroke color (matches nav7dDeltaBp).
 */

export interface SparkGeometry {
  /** SVG polyline `points` attribute. */
  points: string;
  /** "pos" | "neg" | "zero" — drives stroke color, matches the % delta sign. */
  sign: 'pos' | 'neg' | 'zero';
  /** Baseline y (the 7d-open line) for an optional dashed zero rule. */
  baselineY: number;
}

export function sparkGeometry(
  series: readonly number[],
  width: number,
  height: number,
  pad = 2,
): SparkGeometry {
  const last = series.length > 0 ? series[series.length - 1]! : 0;
  const sign: SparkGeometry['sign'] = last > 0 ? 'pos' : last < 0 ? 'neg' : 'zero';

  if (series.length < 2) {
    const midY = height / 2;
    return { points: `0,${midY} ${width},${midY}`, sign, baselineY: midY };
  }

  const min = Math.min(...series, 0);
  const max = Math.max(...series, 0);
  const span = max - min || 1; // guard flat series
  const innerH = height - pad * 2;
  const stepX = width / (series.length - 1);

  // y grows downward: higher value → smaller y.
  const yFor = (v: number): number => pad + innerH * (1 - (v - min) / span);

  const points = series
    .map((v, i) => `${(i * stepX).toFixed(2)},${yFor(v).toFixed(2)}`)
    .join(' ');

  return { points, sign, baselineY: yFor(0) };
}
