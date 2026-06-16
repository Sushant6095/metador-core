/**
 * DeepBook Predict domain contract — the single source of truth for Predict
 * market shapes, vault types, money formatting, and abort decoding shared by
 * the contracts, the app, and the simulation harness.
 *
 * Money-safety law (CLAUDE.md §1, PRODUCT.md): every balance / premium / payout
 * / NAV / PLP value is an integer base-unit `bigint`. JS floats never touch
 * money. Probabilities and vol are the only non-money quantities and are carried
 * as scaled integers with an explicit denominator (never as drifting floats on
 * a money path).
 *
 * Grounded in the live Predict Move package (deepbookv3 @ predict, commit
 * e276939): orders are leveraged strike *ranges* `[lower_strike, higher_strike]`
 * (expiry_market::mint), PLP is the counterparty pool (pool/plp::supply/withdraw),
 * and `redeem_settled` is the permissionless keeper redeem. Deployed object IDs
 * for the `predict-testnet-4-16` deployment are filled in by the spike step.
 */

// === Scaling constants ===

/**
 * dUSDC quote-asset decimals. NOTE (money-safety): confirm against on-chain coin
 * metadata at deploy time before any mainnet move — this is the documented
 * testnet default and the single place the decimal lives.
 */
export const DUSDC_DECIMALS = 6;

/** Probability is carried in basis points (1e4 = 100%). entry_probability et al. */
export const PROBABILITY_DENOMINATOR = 10_000n;

/** Implied volatility is carried in basis points of annualized vol (1e4 = 100%). */
export const IV_DENOMINATOR = 10_000n;

/** Leverage tiers offered by Predict (order::leverage_*). UI/label layer only. */
export const LEVERAGE_TIERS = ['1x', '1.5x', '2x', '2.5x', '3x'] as const;
export type LeverageTier = (typeof LEVERAGE_TIERS)[number];

// === Market + oracle ===

/**
 * SVI (stochastic volatility inspired) total-variance params for one expiry,
 * read from `oracle::OracleSVIUpdated`. Total variance w(k) = a + b*(rho*(k-m) +
 * sqrt((k-m)^2 + sigma^2)) where k = log-moneyness. All params are scaled
 * integers (denominator documented per field) — never floats on the surface path.
 */
export interface SviParams {
  /** level term `a`, scaled by IV_DENOMINATOR^2 (variance). */
  readonly a: bigint;
  /** angle term `b`, scaled by IV_DENOMINATOR^2. */
  readonly b: bigint;
  /** skew `rho` in [-1, 1], scaled by IV_DENOMINATOR. */
  readonly rho: bigint;
  /** translation `m` (log-moneyness), scaled by IV_DENOMINATOR. */
  readonly m: bigint;
  /** smoothness `sigma`, scaled by IV_DENOMINATOR. */
  readonly sigma: bigint;
}

export type MarketLifecycle = 'active' | 'pending_settlement' | 'settled' | 'compacted';

/** A single rolling expiry market (e.g. a sub-hour BTC cycle). */
export interface PredictMarket {
  readonly marketId: string;
  readonly underlying: string; // e.g. "BTC"
  readonly quote: 'dUSDC';
  readonly pythLazerFeedId: number;
  /** Unix ms when this expiry settles. */
  readonly expiryMs: number;
  /** Strike grid, all in quote base units. */
  readonly minStrike: bigint;
  readonly maxStrike: bigint;
  readonly tickSize: bigint;
  /** Live underlying price (base units) from the oracle. */
  readonly spot: bigint;
  readonly svi: SviParams;
  readonly lifecycle: MarketLifecycle;
  readonly liquidationLtv: bigint; // basis points
}

// === Positions (Predict orders) ===

/** One open Predict order held by a manager: a leveraged strike range. */
export interface PredictPosition {
  readonly orderId: string; // u256 as decimal/hex string
  readonly marketId: string;
  readonly lowerStrike: bigint;
  readonly higherStrike: bigint;
  /** Contracts held, in lot base units. */
  readonly quantity: bigint;
  readonly leverage: LeverageTier;
  /** Probability paid at entry, in basis points. */
  readonly entryProbabilityBps: bigint;
  /** Premium paid (quote base units). */
  readonly premiumPaid: bigint;
  readonly openedAtMs: number;
}

// === PLP pool (the counterparty / yield source) ===

export interface PlpState {
  readonly poolVaultId: string;
  /** PLP shares outstanding. */
  readonly totalSupply: bigint;
  /** Idle (uncommitted) dUSDC, base units. */
  readonly idleBalance: bigint;
  /** dUSDC committed as backing across active expiries, base units. */
  readonly allocatedCapital: bigint;
  /** Outstanding payout liability to traders, base units. */
  readonly payoutLiability: bigint;
}

/** utilization = allocated / (idle + allocated), in basis points. Pure, no float. */
export function plpUtilizationBps(plp: Pick<PlpState, 'idleBalance' | 'allocatedCapital'>): bigint {
  const total = plp.idleBalance + plp.allocatedCapital;
  if (total <= 0n) return 0n;
  return (plp.allocatedCapital * 10_000n) / total;
}

// === Metador vault (keel_core::predict_vault) ===

export type VaultStrategy = 'plp_hedge' | 'range_ladder';

/** The four walls, re-pointed at a Predict vault (PRODUCT.md / ADR-009). */
export interface VaultPolicy {
  /** Budget: max dUSDC premium deployable per roll, base units. */
  readonly perRollBudget: bigint;
  /** Scope: the one expiry market / pyth feed this vault may touch. */
  readonly allowedPythFeedId: number;
  /** Expiry: vault mandate end (unix ms). */
  readonly mandateExpiryMs: number;
  readonly revoked: boolean;
}

export interface PredictVaultSummary {
  readonly vaultId: string;
  readonly managerId: string;
  readonly strategy: VaultStrategy;
  readonly owner: string;
  readonly leader: string;
  /** Tokenized share supply (reuses keel_core shares math). */
  readonly shareSupply: bigint;
  /** Net asset value in quote base units: manager balance + PLP value + live positions. */
  readonly nav: bigint;
  /** dUSDC supplied to PLP (base units). */
  readonly plpSupplied: bigint;
  /** Aggregate premium in live hedge positions (base units). */
  readonly hedgePremium: bigint;
  readonly policy: VaultPolicy;
}

// === Formatting (display only — math stays in bigint) ===

const PCT_FRACTION_DIGITS = 2;

/** Format a quote (dUSDC) base-unit amount for display. */
export function formatDusdc(amount: bigint, maxFractionDigits = 2): string {
  // Local re-implementation kept in sync with format.ts::formatBaseUnits.
  const neg = amount < 0n;
  const abs = (neg ? -amount : amount).toString().padStart(DUSDC_DECIMALS + 1, '0');
  const int = abs.slice(0, abs.length - DUSDC_DECIMALS).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fracFull = abs.slice(abs.length - DUSDC_DECIMALS);
  const frac = fracFull.slice(0, maxFractionDigits).replace(/0+$/, '');
  return `${neg ? '-' : ''}${int}${frac ? `.${frac}` : ''}`;
}

/** Format a basis-point probability/vol as a percent string, truncated. */
export function formatBps(bps: bigint, denominator: bigint = PROBABILITY_DENOMINATOR): string {
  const neg = bps < 0n;
  const abs = neg ? -bps : bps;
  // percent = bps / denominator * 100; keep integer math, scale to 2 dp.
  const scaled = (abs * 100n * 100n) / denominator; // value * 100 (for 2dp)
  const whole = scaled / 100n;
  const cents = (scaled % 100n).toString().padStart(2, '0').slice(0, PCT_FRACTION_DIGITS).replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole}${cents ? `.${cents}` : ''}%`;
}

// === Abort decoding (single source of truth for Predict error UX) ===
//
// Keyed by Move error-constant name. Numeric codes are confirmed against the
// deployed package at the spike step and recorded in docs/abort-codes.md.
export const PREDICT_ABORT_MESSAGES: Readonly<Record<string, string>> = {
  EMintPaused: 'Minting is paused on this market right now. Try again shortly.',
  EProofRequiredForLiveRedeem: 'Closing a live position needs trade authority — the vault leader must sign.',
  ECapNotInList: 'This capability was revoked by the vault owner. Funds are safe and withdrawable.',
  EInvalidProof: 'Trade authority does not match this account — refusing to act on another vault.',
  EZeroSupply: 'Supply amount must be greater than zero.',
  EZeroWithdraw: 'Withdrawal amount must be greater than zero.',
  EInsufficientIdleBalance: 'The pool cannot cover this withdrawal right now — idle liquidity is committed.',
  EZeroPoolValue: 'The pool has no value to price shares against yet.',
};

/** Decode a Predict abort to a human message; falls back to a safe generic. */
export function decodePredictAbort(constName: string): string {
  return (
    PREDICT_ABORT_MESSAGES[constName] ??
    'The chain refused this action. Your funds are unaffected — please retry or contact support.'
  );
}
