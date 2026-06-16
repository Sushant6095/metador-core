'use client';

/**
 * SviSurface — live vol-surface viewer for a Predict market.
 *
 * Renders an SVG heatmap: strike (x) × implied probability (y), colored by
 * IV level. Uses pure bigint SVI math for the surface, then converts to
 * display-only floats for SVG geometry (geometry, not money).
 *
 * Architecture: reads SviParams + spot from the mock now; structured so a
 * predict-server SVI feed can swap in by replacing `props.market`.
 *
 * Motion: enter opacity 0→1 only (transform/opacity rule). No animation on
 * the cells themselves — the data color is the signal.
 *
 * NOTE: All strike/probability values in this component are display-only
 * geometry (floats are fine here). Money amounts are never computed here.
 */

import * as React from 'react';
import { motion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import { formatDusdc } from '@metador/deepbook';
import type { PredictMarket, SviParams } from '@metador/deepbook';

interface SviSurfaceProps {
  market: PredictMarket;
  className?: string;
}

// ── SVI math (display-only floats — geometry, not money) ─────────────────────

/**
 * Compute SVI total-variance w(k) at log-moneyness k.
 * Params are bigint scaled by 1e4 (IV_DENOMINATOR^2 for variance).
 * Returns a plain number for SVG geometry only.
 */
function sviVariance(svi: SviParams, k: number): number {
  const scale = 10_000;
  const a = Number(svi.a) / scale;
  const b = Number(svi.b) / scale;
  const rho = Number(svi.rho) / scale;
  const m = Number(svi.m) / scale;
  const sigma = Number(svi.sigma) / scale;
  const km = k - m;
  return a + b * (rho * km + Math.sqrt(km * km + sigma * sigma));
}

/**
 * Convert total variance w to annualized IV (%).
 * w = IV^2 * T (T in years); for sub-hour ~1/8760 year.
 * Returns display-only float for SVG.
 */
function sviIv(svi: SviParams, k: number, tYears: number): number {
  const w = sviVariance(svi, k);
  if (tYears <= 0 || w < 0) return 0;
  return Math.sqrt(Math.abs(w) / tYears) * 100; // percent
}

// ── Surface grid computation ──────────────────────────────────────────────────

interface GridCell {
  strike: bigint;
  iv: number;
  k: number; // log-moneyness (display float)
  color: string;
  label: string; // formatted strike for tooltip
}

function buildSurfaceGrid(market: PredictMarket, cols = 12): GridCell[] {
  const spotNum = Number(market.spot) / 1e6; // to human-readable price
  const minS = Number(market.minStrike) / 1e6;
  const maxS = Number(market.maxStrike) / 1e6;
  const step = (maxS - minS) / (cols - 1);

  // Time to expiry in years (display-only float)
  const nowMs = market.expiryMs - 90 * 60 * 1000; // mock: 90 min to expiry at start
  const tMs = market.expiryMs - nowMs;
  const tYears = Math.max(tMs / (1000 * 60 * 60 * 24 * 365), 1e-6);

  return Array.from({ length: cols }, (_, i) => {
    const sNum = minS + i * step;
    const k = Math.log(sNum / spotNum);
    const iv = sviIv(market.svi, k, tYears);

    // Color: brass for high IV/near-ATM, fades to muted for deep OTM
    const normalizedIv = Math.min(iv / 200, 1); // 0..1
    const alpha = 0.15 + normalizedIv * 0.75;
    // Hue: brass at high IV (74° in HSL ≈ primary), cooler/muted at low
    const hue = 74 - normalizedIv * 30; // 44–74
    const saturation = 60 + normalizedIv * 30; // 60–90
    const lightness = 35 + normalizedIv * 25; // 35–60

    return {
      strike: BigInt(Math.round(sNum * 1e6)),
      iv,
      k,
      color: `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha.toFixed(2)})`,
      label: `$${Math.round(sNum).toLocaleString()}`,
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SviSurface({ market, className }: SviSurfaceProps) {
  const cells = buildSurfaceGrid(market, 14);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const spotHuman = Number(market.spot) / 1e6;

  // Find ATM index (closest to spot)
  const atmIdx = cells.reduce((closest, cell, i) => {
    const cDist = Math.abs(Number(cell.strike) / 1e6 - spotHuman);
    const bDist = Math.abs(Number(cells[closest]!.strike) / 1e6 - spotHuman);
    return cDist < bDist ? i : closest;
  }, 0);

  const maxIv = Math.max(...cells.map((c) => c.iv), 0.01);
  const hoveredCell = hoveredIdx !== null ? (cells[hoveredIdx] ?? null) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
      className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}
      aria-label="SVI vol surface — strike vs implied volatility"
    >
      {/* Heatmap bars */}
      <div
        role="img"
        aria-label={`Vol surface for BTC/${market.quote}, ${cells.length} strike points`}
        className="flex items-end gap-px h-24"
      >
        {cells.map((cell, i) => {
          const heightPct = (cell.iv / maxIv) * 100;
          const isAtm = i === atmIdx;
          const isHovered = i === hoveredIdx;

          return (
            <div
              key={i}
              className="relative flex-1 flex flex-col justify-end cursor-crosshair group/cell"
              style={{ height: '100%' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(i)}
              onBlur={() => setHoveredIdx(null)}
              tabIndex={0}
              role="button"
              aria-label={`Strike ${cell.label}: IV ${cell.iv.toFixed(1)}%`}
            >
              {/* Bar */}
              <div
                className="w-full rounded-t-xs transition-opacity duration-(--metador-duration-fast)"
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  backgroundColor: cell.color,
                  opacity: isHovered ? 1 : 0.85,
                  outline: isAtm
                    ? '1px solid var(--metador-primary)'
                    : isHovered
                      ? '1px solid var(--metador-border)'
                      : undefined,
                  outlineOffset: '1px',
                }}
              />
              {/* ATM indicator */}
              {isAtm && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                  aria-label="ATM (at the money)"
                >
                  <span
                    className="text-2xs text-primary font-mono"
                    style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
                  >
                    ATM
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis: first / ATM / last strike labels */}
      <div className="relative flex items-start h-5">
        {cells[0] && (
          <span
            className="absolute left-0 text-2xs text-faint font-mono"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {cells[0].label}
          </span>
        )}
        {cells[atmIdx] && (
          <span
            className="absolute text-2xs text-primary font-mono font-medium"
            style={{
              left: `${(atmIdx / (cells.length - 1)) * 100}%`,
              transform: 'translateX(-50%)',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {cells[atmIdx].label}
          </span>
        )}
        {cells.at(-1) != null && (
          <span
            className="absolute right-0 text-2xs text-faint font-mono"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {cells.at(-1)!.label}
          </span>
        )}
      </div>

      {/* Hover tooltip / persistent stats row */}
      <div className="flex items-center gap-4 text-xs text-muted min-h-[36px]">
        {hoveredCell ? (
          <>
            <span>
              Strike:{' '}
              <span
                className="font-mono text-text"
                style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
              >
                ${formatDusdc(hoveredCell.strike, 0)}
              </span>
            </span>
            <span>
              IV:{' '}
              <span className="font-mono text-primary" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {hoveredCell.iv.toFixed(1)}%
              </span>
            </span>
            <span>
              Log-moneyness:{' '}
              <span className="font-mono text-text" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {hoveredCell.k >= 0 ? '+' : ''}
                {hoveredCell.k.toFixed(3)}
              </span>
            </span>
          </>
        ) : (
          <>
            <span>
              Spot:{' '}
              <span className="font-mono text-text" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                ${formatDusdc(market.spot, 0)}
              </span>
            </span>
            <span>
              Peak IV:{' '}
              <span className="font-mono text-primary" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {maxIv.toFixed(1)}%
              </span>
            </span>
            <span className="text-faint">Hover a strike to inspect</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
