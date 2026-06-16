/**
 * Mock margin domain — shaped to DeepBook Margin so the trade terminal shell is
 * NOT throwaway (ADR-007 / metador-product skill). Real DeepBook Margin SDK entry
 * points are wired in the P0 protocol spike; until then the terminal renders
 * this clearly-marked mock model.
 *
 * MONEY DISCIPLINE (CLAUDE.md §2):
 *   - All amounts are integer base units (bigint). Floats never touch money.
 *   - Price convention: `price` is quote base units per ONE WHOLE base token
 *     (e.g. SUI at $3.42 with USDC 6dp → 3_420_000n). Sizes are base base-units.
 *     notional(quote units) = size * price / 10^baseDecimals.
 *   - Deltas/funding/ratios are signed basis-point INTEGERS (412 = +4.12%).
 *   - DETERMINISM: no Math.random / Date.now at module scope — every value is
 *     derived from pure index arithmetic, so builds are byte-identical.
 *
 * The liquidation/health helpers are ILLUSTRATIVE estimates pending the spike;
 * the real formulas (with maintenance margin from chain params) ship with
 * known-answer tests under the `risk-math` skill in P1. They are never presented
 * as authoritative — the terminal labels the surface "testnet preview".
 */

export type Side = 'long' | 'short';
export type MarginMode = 'cross' | 'isolated';

export interface MarginMarket {
  symbol: string; // 'SUI-USDC'
  base: string;
  quote: string;
  baseDecimals: number;
  quoteDecimals: number;
  /** Quote base units per 1 whole base token. */
  markPrice: bigint;
  indexPrice: bigint;
  /** Signed basis points, 24h. */
  change24hBp: number;
  /** Quote base units traded over 24h. */
  volume24h: bigint;
  /** Quote base units of open interest. */
  openInterest: bigint;
  /** Signed basis points, 8h funding. */
  fundingBp: number;
  maxLeverage: number;
  /** Quote base units. */
  tickSize: bigint;
}

export interface OrderBookLevel {
  price: bigint;
  size: bigint;
}

export interface OrderBook {
  bids: readonly OrderBookLevel[];
  asks: readonly OrderBookLevel[];
  spread: bigint;
  spreadBp: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: Side;
  mode: MarginMode;
  leverage: number;
  /** Base base-units. */
  size: bigint;
  entryPrice: bigint;
  markPrice: bigint;
  liquidationPrice: bigint;
  /** Signed quote base units. */
  unrealizedPnl: bigint;
  /** Margin (health) ratio in basis points; lower = closer to liquidation. */
  marginRatioBp: number;
}

export interface MarginAccount {
  /** Quote base units. */
  collateral: bigint;
  equity: bigint;
  available: bigint;
  marginUsed: bigint;
  quoteDecimals: number;
}

/** Maintenance-margin rate (bp) — ILLUSTRATIVE; real value comes from chain. */
const MAINT_MARGIN_BP = 50;
const BP = 10_000n;

/** Stable integer hash (splitmix-style) — deterministic pseudo-variation. */
function hash(n: number): number {
  let x = (n + 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

export const MARKETS: readonly MarginMarket[] = [
  {
    symbol: 'SUI-USDC',
    base: 'SUI',
    quote: 'USDC',
    baseDecimals: 9,
    quoteDecimals: 6,
    markPrice: 3_420_000n,
    indexPrice: 3_418_200n,
    change24hBp: -842,
    volume24h: 836_859_597_000000n,
    openInterest: 110_064_300_000000n,
    fundingBp: 12,
    maxLeverage: 10,
    tickSize: 100n,
  },
  {
    symbol: 'DEEP-USDC',
    base: 'DEEP',
    quote: 'USDC',
    baseDecimals: 6,
    quoteDecimals: 6,
    markPrice: 182_400n,
    indexPrice: 182_650n,
    change24hBp: 356,
    volume24h: 42_180_400_000000n,
    openInterest: 9_640_000_000000n,
    fundingBp: -8,
    maxLeverage: 5,
    tickSize: 100n,
  },
  {
    symbol: 'wBTC-USDC',
    base: 'wBTC',
    quote: 'USDC',
    baseDecimals: 8,
    quoteDecimals: 6,
    markPrice: 88_412_000000n,
    indexPrice: 88_390_000000n,
    change24hBp: 187,
    volume24h: 1_451_806_343_000000n,
    openInterest: 408_035_979_000000n,
    fundingBp: 21,
    maxLeverage: 20,
    tickSize: 1_000000n,
  },
  {
    symbol: 'ETH-USDC',
    base: 'ETH',
    quote: 'USDC',
    baseDecimals: 8,
    quoteDecimals: 6,
    markPrice: 3_050_000000n,
    indexPrice: 3_051_200000n,
    change24hBp: 345,
    volume24h: 612_540_120_000000n,
    openInterest: 184_220_000_000000n,
    fundingBp: 5,
    maxLeverage: 20,
    tickSize: 100000n,
  },
] as const;

export function getMarket(symbol: string): MarginMarket | undefined {
  return MARKETS.find((m) => m.symbol.toLowerCase() === symbol.toLowerCase());
}

export const DEFAULT_MARKET = 'SUI-USDC';

/**
 * Deterministic order book: 12 levels each side stepped by tickSize, with
 * stable pseudo-random sizes seeded from the market symbol + level index.
 */
export function buildOrderBook(market: MarginMarket, levels = 12): OrderBook {
  const seed = market.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const mid = market.markPrice;
  const sizeFor = (i: number): bigint => {
    const base = 2_000n + BigInt(hash(seed + i) % 9_000);
    return base * 10n ** BigInt(Math.max(0, market.baseDecimals - 3));
  };
  const asks: OrderBookLevel[] = [];
  const bids: OrderBookLevel[] = [];
  for (let i = 0; i < levels; i++) {
    asks.push({
      price: mid + market.tickSize * BigInt(i + 1),
      size: sizeFor(i),
    });
    bids.push({
      price: mid - market.tickSize * BigInt(i + 1),
      size: sizeFor(i + 100),
    });
  }
  const bestAsk = asks[0]?.price ?? mid;
  const bestBid = bids[0]?.price ?? mid;
  const spread = bestAsk - bestBid;
  const spreadBp = Number((spread * BP) / mid);
  return { bids, asks, spread, spreadBp };
}

/**
 * ILLUSTRATIVE liquidation price (pending spike + risk-math known-answer tests).
 *   long:  entry × (1 − 1/lev + mmr)
 *   short: entry × (1 + 1/lev − mmr)
 * Computed in basis points to stay integer/bigint.
 */
export function estimateLiquidationPrice(
  side: Side,
  entryPrice: bigint,
  leverage: number,
): bigint {
  if (leverage <= 0) return 0n;
  const oneOverLevBp = BigInt(Math.round(10_000 / leverage));
  const mmr = BigInt(MAINT_MARGIN_BP);
  const factorBp =
    side === 'long' ? BP - oneOverLevBp + mmr : BP + oneOverLevBp - mmr;
  return (entryPrice * factorBp) / BP;
}

/** Notional in quote base units for a base-unit size at a given price. */
export function notional(
  size: bigint,
  price: bigint,
  baseDecimals: number,
): bigint {
  return (size * price) / 10n ** BigInt(baseDecimals);
}

/** Mock open positions for the connected-account preview. */
export function mockPositions(): readonly Position[] {
  const sui = getMarket('SUI-USDC');
  const btc = getMarket('wBTC-USDC');
  if (!sui || !btc) return [];
  const suiEntry = 3_180_000n;
  const btcEntry = 90_100_000000n;
  const suiSize = 4_200_000_000000n; // 4,200 SUI (9dp)
  const btcSize = 12_000000n; // 0.12 wBTC (8dp)
  return [
    {
      id: 'pos-sui',
      symbol: sui.symbol,
      side: 'long',
      mode: 'cross',
      leverage: 5,
      size: suiSize,
      entryPrice: suiEntry,
      markPrice: sui.markPrice,
      liquidationPrice: estimateLiquidationPrice('long', suiEntry, 5),
      unrealizedPnl: notional(
        suiSize,
        sui.markPrice - suiEntry,
        sui.baseDecimals,
      ),
      marginRatioBp: 1_840,
    },
    {
      id: 'pos-btc',
      symbol: btc.symbol,
      side: 'short',
      mode: 'isolated',
      leverage: 10,
      size: btcSize,
      entryPrice: btcEntry,
      markPrice: btc.markPrice,
      liquidationPrice: estimateLiquidationPrice('short', btcEntry, 10),
      unrealizedPnl: notional(
        btcSize,
        btcEntry - btc.markPrice,
        btc.baseDecimals,
      ),
      marginRatioBp: 920,
    },
  ];
}

export const MOCK_ACCOUNT: MarginAccount = {
  collateral: 24_800_000000n, // $24,800
  equity: 25_412_000000n,
  available: 18_240_000000n,
  marginUsed: 7_172_000000n,
  quoteDecimals: 6,
};
