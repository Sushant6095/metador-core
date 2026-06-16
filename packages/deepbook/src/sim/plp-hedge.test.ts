import { describe, it, expect } from 'vitest';
import { simulatePlpHedge, compareToNakedPlp, type Cycle } from './plp-hedge';

/**
 * Known-answer cases hand-computed in integer base units (CLAUDE.md §1). Start
 * NAV = 1,000,000,000 base units (= 1,000 dUSDC at 6 decimals). Two cycles: one
 * calm (hedge is pure drag), one −5σ crash (PLP loses, hedge pays). Every
 * expected value below is derived by hand and must match exactly.
 */
const START = 1_000_000_000n;
const HEDGE_3PCT = { hedgeRatioBps: 300n };

const SCENARIOS: readonly Cycle[] = [
  { label: 'calm +0.2σ', moveTenthsSigma: 2, plpReturnBps: 200, hedgePayoffBps: 0 },
  { label: 'crash -5.0σ', moveTenthsSigma: -50, plpReturnBps: -1500, hedgePayoffBps: 90_000 },
];

describe('simulatePlpHedge — known-answer', () => {
  const result = simulatePlpHedge(START, SCENARIOS, HEDGE_3PCT);

  it('cycle 1 (calm): hedge premium is pure drag', () => {
    // hedge = 30,000,000; supplied = 970,000,000; +2% = +19,400,000; payoff 0.
    expect(result.series[0]?.nav).toBe(989_400_000n);
    expect(result.series[0]?.pnl).toBe(-10_600_000n);
  });

  it('cycle 2 (crash): the hedge offsets the tail', () => {
    // from 989,400,000: hedge 29,682,000; supplied 959,718,000; −15% = −143,957,700;
    // hedge payoff 9x = +267,138,000 → 1,082,898,300.
    expect(result.series[1]?.nav).toBe(1_082_898_300n);
    expect(result.series[1]?.pnl).toBe(93_498_300n);
  });

  it('reports total return, max drawdown, and worst move', () => {
    expect(result.endNav).toBe(1_082_898_300n);
    expect(result.totalReturnBps).toBe(828n); // +8.28%
    expect(result.maxDrawdownBps).toBe(106n); // 1.06% — the hedge caps the tail
    expect(result.worstMoveTenthsSigma).toBe(-50);
  });
});

describe('compareToNakedPlp — the "crash insurance" thesis', () => {
  const { hedged, nakedPlp } = compareToNakedPlp(START, SCENARIOS, HEDGE_3PCT);

  it('naked PLP takes the full tail; hedged is protected', () => {
    // naked: cycle1 → 1,020,000,000; cycle2 −15% → 867,000,000.
    expect(nakedPlp.endNav).toBe(867_000_000n);
    expect(nakedPlp.maxDrawdownBps).toBe(1500n); // 15% drawdown
    // hedged ends higher AND with a fraction of the drawdown.
    expect(hedged.endNav).toBe(1_082_898_300n);
    expect(hedged.maxDrawdownBps).toBe(106n);
    expect(hedged.maxDrawdownBps < nakedPlp.maxDrawdownBps).toBe(true);
  });
});

describe('simulatePlpHedge — input guards', () => {
  it('rejects non-positive start NAV', () => {
    expect(() => simulatePlpHedge(0n, SCENARIOS, HEDGE_3PCT)).toThrow();
  });

  it('rejects a hedge ratio at or above 100%', () => {
    expect(() => simulatePlpHedge(START, SCENARIOS, { hedgeRatioBps: 10_000n })).toThrow();
  });
});
