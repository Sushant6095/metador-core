/**
 * PLP + Hedge strategy backtest — the scored simulation for the DeepBook Predict
 * vault (ADR-009, idea #2). Thesis: "PLP yield minus crash insurance". The vault
 * supplies the bulk of capital to the Predict PLP pool (earning the pool's premium
 * flow) and spends a small slice each cycle on out-of-the-money binaries that pay
 * off in a tail move — capping the left-tail drawdown that makes raw PLP a hard
 * sell to outside LPs.
 *
 * Money-safety law (CLAUDE.md §1): every value is an integer base-unit `bigint`;
 * all rates are basis points (1e4 = 100%); JS floats never touch the money path.
 * Compounding truncates (round-down) so the simulation never overstates returns.
 * The model is intentionally simple and fully deterministic so results are
 * reproducible and unit-tested against known answers — the scenario series is the
 * only input and is meant to be replaced by real `predict-server` SVI/oracle
 * history at demo time.
 */

const BPS = 10_000n;

/** One rolling expiry cycle the strategy lives through. */
export interface Cycle {
  /** Label, e.g. "2026-06-16T12:00Z BTC 1h". */
  readonly label: string;
  /** BTC move this cycle, in tenths of a sigma (e.g. -52 = -5.2σ). Signed. */
  readonly moveTenthsSigma: number;
  /**
   * Net PLP return for the cycle in bps, applied to the supplied amount. Positive
   * in calm cycles (pool keeps premium); sharply negative in a tail move (pool
   * pays winning traders). Sourced from pool accounting / backtest, not invented
   * at runtime.
   */
  readonly plpReturnBps: number;
  /**
   * Gross hedge payoff multiple in bps applied to the hedge premium spent this
   * cycle (e.g. 0 = expired worthless; 80_000 = 8x). The OTM binary only pays in
   * the tail; calm cycles return 0 and the premium is pure drag.
   */
  readonly hedgePayoffBps: number;
}

export interface StrategyParams {
  /** Fraction of capital spent on the hedge each cycle, in bps (e.g. 300 = 3%). */
  readonly hedgeRatioBps: bigint;
}

export interface CyclePoint {
  readonly label: string;
  /** NAV at end of cycle, base units. */
  readonly nav: bigint;
  /** Signed PnL for the cycle, base units. */
  readonly pnl: bigint;
}

export interface SimResult {
  readonly startNav: bigint;
  readonly endNav: bigint;
  /** Total return over the series, bps. */
  readonly totalReturnBps: bigint;
  /** Max peak-to-trough drawdown over the series, bps. */
  readonly maxDrawdownBps: bigint;
  /** Worst single-cycle move in the series, in tenths of a sigma. */
  readonly worstMoveTenthsSigma: number;
  readonly series: readonly CyclePoint[];
}

export interface ComparisonResult {
  readonly hedged: SimResult;
  /** Same scenarios with hedgeRatioBps = 0 — the "naked PLP" baseline. */
  readonly nakedPlp: SimResult;
}

/** Apply a signed bps return to a base-unit amount, rounding toward zero. */
function applyBps(amount: bigint, rateBps: bigint): bigint {
  return (amount * rateBps) / BPS;
}

/**
 * Run the PLP+Hedge strategy over a cycle series. Each cycle: split NAV into a
 * PLP supply leg and a hedge premium leg, apply the cycle's PLP return to the
 * supply leg, add the hedge payoff, and roll the resulting NAV into the next
 * cycle. Fully deterministic for a given (startNav, scenarios, params).
 */
export function simulatePlpHedge(
  startNav: bigint,
  scenarios: readonly Cycle[],
  params: StrategyParams,
): SimResult {
  if (startNav <= 0n) throw new Error('simulatePlpHedge: startNav must be positive');
  if (params.hedgeRatioBps < 0n || params.hedgeRatioBps >= BPS) {
    throw new Error('simulatePlpHedge: hedgeRatioBps must be in [0, 10000)');
  }

  let nav = startNav;
  let peak = startNav;
  let maxDrawdownBps = 0n;
  let worstMove = 0;
  const series: CyclePoint[] = [];

  for (const cycle of scenarios) {
    const hedgePremium = applyBps(nav, params.hedgeRatioBps);
    const supplied = nav - hedgePremium;

    const plpResult = supplied + applyBps(supplied, BigInt(cycle.plpReturnBps));
    const hedgeReturn = applyBps(hedgePremium, BigInt(cycle.hedgePayoffBps));

    const next = plpResult + hedgeReturn;
    const pnl = next - nav;
    nav = next;
    series.push({ label: cycle.label, nav, pnl });

    if (nav > peak) peak = nav;
    if (peak > 0n) {
      const drawdownBps = ((peak - nav) * BPS) / peak;
      if (drawdownBps > maxDrawdownBps) maxDrawdownBps = drawdownBps;
    }
    if (cycle.moveTenthsSigma < worstMove) worstMove = cycle.moveTenthsSigma;
  }

  return {
    startNav,
    endNav: nav,
    totalReturnBps: ((nav - startNav) * BPS) / startNav,
    maxDrawdownBps,
    worstMoveTenthsSigma: worstMove,
    series,
  };
}

/** Run the strategy and the naked-PLP baseline (hedgeRatio = 0) side by side. */
export function compareToNakedPlp(
  startNav: bigint,
  scenarios: readonly Cycle[],
  params: StrategyParams,
): ComparisonResult {
  return {
    hedged: simulatePlpHedge(startNav, scenarios, params),
    nakedPlp: simulatePlpHedge(startNav, scenarios, { hedgeRatioBps: 0n }),
  };
}
