/**
 * Deterministic seeded mock data for /network.
 * No Math.random() or Date.now() at module scope — values are fixed so the
 * page films reliably and types are the exact live shapes the real feeds will
 * satisfy.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NetworkKpis {
  totalTvlDbusdc: bigint;       // base units (6 decimals)
  plpAumDbusdc: bigint;
  plpUtilizationBps: number;    // e.g. 7257 = 72.57 %
  premiumAtRiskDbusdc: bigint;
  activeVaults: number;
  maxVaults: number;
}

export type RangeKey = 'D' | 'W' | 'M' | 'Y';

export interface NavDataPoint {
  label: string;   // axis tick
  plpYield: number;   // in K DBUSDC
  hedgeCost: number;  // in K DBUSDC (negative = cost)
  net: number;        // in K DBUSDC
}

export interface TvlSlice {
  label: string;
  valueKDbusdc: number;
  pct: number;
}

export interface TopVault {
  id: string;
  name: string;
  strategy: 'DELEGATE' | 'DCA' | 'RANGE';
  leaderAddress: string;
  pool: string;
  tvlDbusdc: bigint;
  pnl30dDbusdc: bigint;
  budgetUsedBps: number;   // 0–10000
  budgetTotalDbusdc: bigint;
  status: 'LIVE' | 'REVOKED' | 'PAUSED';
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export const NETWORK_KPIS: NetworkKpis = {
  totalTvlDbusdc: 399_600_000n,   // 399,600 DBUSDC (6 decimals)
  plpAumDbusdc: 439_000_000n,
  plpUtilizationBps: 7257,
  premiumAtRiskDbusdc: 48_200_000n,
  activeVaults: 16,
  maxVaults: 20,
};

// ── NAV / PnL time-series ─────────────────────────────────────────────────────

const NAV_SERIES: Record<RangeKey, NavDataPoint[]> = {
  D: [
    { label: '00:00', plpYield: 1.2, hedgeCost: -0.3, net: 0.9 },
    { label: '02:00', plpYield: 1.4, hedgeCost: -0.4, net: 1.0 },
    { label: '04:00', plpYield: 0.8, hedgeCost: -0.5, net: 0.3 },
    { label: '06:00', plpYield: 0.5, hedgeCost: -0.8, net: -0.3 },
    { label: '08:00', plpYield: 1.1, hedgeCost: -0.6, net: 0.5 },
    { label: '10:00', plpYield: 1.6, hedgeCost: -0.5, net: 1.1 },
    { label: '12:00', plpYield: 2.0, hedgeCost: -0.4, net: 1.6 },
    { label: '14:00', plpYield: 1.8, hedgeCost: -0.6, net: 1.2 },
    { label: '16:00', plpYield: 1.5, hedgeCost: -0.7, net: 0.8 },
    { label: '18:00', plpYield: 1.9, hedgeCost: -0.5, net: 1.4 },
    { label: '20:00', plpYield: 2.2, hedgeCost: -0.3, net: 1.9 },
    { label: '22:00', plpYield: 1.7, hedgeCost: -0.4, net: 1.3 },
  ],
  W: [
    { label: 'Mon', plpYield: 8.0, hedgeCost: -2.1, net: 5.9 },
    { label: 'Tue', plpYield: 15.0, hedgeCost: -3.5, net: 11.5 },
    { label: 'Wed', plpYield: 23.0, hedgeCost: -5.2, net: 17.8 },
    { label: 'Thu', plpYield: 19.0, hedgeCost: -6.8, net: 12.2 },
    { label: 'Fri', plpYield: 11.0, hedgeCost: -9.0, net: 2.0 },
    { label: 'Sat', plpYield: 2.0, hedgeCost: -9.5, net: -7.5 },
    { label: 'Sun', plpYield: 12.0, hedgeCost: -5.0, net: 7.0 },
  ],
  M: [
    { label: 'Jun 1',  plpYield: 8.0,  hedgeCost: -2.0, net: 6.0  },
    { label: 'Jun 3',  plpYield: 15.0, hedgeCost: -3.5, net: 11.5 },
    { label: 'Jun 5',  plpYield: 23.0, hedgeCost: -4.5, net: 18.5 },
    { label: 'Jun 7',  plpYield: 19.0, hedgeCost: -6.8, net: 12.2 },
    { label: 'Jun 9',  plpYield: 11.0, hedgeCost: -9.0, net: 2.0  },
    { label: 'Jun 11', plpYield: 2.0,  hedgeCost: -9.5, net: -7.5 },
    { label: 'Jun 13', plpYield: -3.0, hedgeCost: -8.0, net: -11.0 },
    { label: 'Jun 15', plpYield: 5.0,  hedgeCost: -7.5, net: -2.5 },
    { label: 'Jun 17', plpYield: 12.0, hedgeCost: -5.0, net: 7.0  },
  ],
  Y: [
    { label: 'Jan', plpYield: 42.0,  hedgeCost: -12.0, net: 30.0  },
    { label: 'Feb', plpYield: 55.0,  hedgeCost: -18.0, net: 37.0  },
    { label: 'Mar', plpYield: 33.0,  hedgeCost: -25.0, net: 8.0   },
    { label: 'Apr', plpYield: 10.0,  hedgeCost: -28.0, net: -18.0 },
    { label: 'May', plpYield: 68.0,  hedgeCost: -20.0, net: 48.0  },
    { label: 'Jun', plpYield: 29.0,  hedgeCost: -14.0, net: 15.0  },
  ],
};

export function getNavSeries(range: RangeKey): NavDataPoint[] {
  return NAV_SERIES[range];
}

// ── TVL Distribution ──────────────────────────────────────────────────────────

export const TVL_DISTRIBUTION: TvlSlice[] = [
  { label: 'PLP + Hedge', valueKDbusdc: 224.6, pct: 56 },
  { label: 'Range Ladder', valueKDbusdc: 87.4,  pct: 22 },
  { label: 'DCA',          valueKDbusdc: 60.2,  pct: 15 },
  { label: 'Delegate',     valueKDbusdc: 27.4,  pct: 7  },
];

// ── Top Vaults ────────────────────────────────────────────────────────────────

export const TOP_VAULTS: TopVault[] = [
  {
    id: 'v-001',
    name: 'Metador Flagship',
    strategy: 'DELEGATE',
    leaderAddress: '0x0f25e3b4a9c2d71f6e8a30b5c94d2e8f1a7b3c608',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 86_300_000n,
    pnl30dDbusdc: 3_556_000n,
    budgetUsedBps: 4000,
    budgetTotalDbusdc: 500_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-002',
    name: 'Meridian Spread',
    strategy: 'DELEGATE',
    leaderAddress: '0x3f7a2c9d1e4b8f0a6c5d9e3b7a2f4c8d1e6b9d4e5',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 44_750_000n,
    pnl30dDbusdc: 2_376_000n,
    budgetUsedBps: 3200,
    budgetTotalDbusdc: 300_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-003',
    name: 'Ironclad TWAP',
    strategy: 'DCA',
    leaderAddress: '0x7c25a3f9b1e4d6c2a8f0b3d5e9c1a4f7b2e6a11d1',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 31_091_000n,
    pnl30dDbusdc: 277_000n,
    budgetUsedBps: 8400,
    budgetTotalDbusdc: 200_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-004',
    name: 'Topsail Liquidity',
    strategy: 'DELEGATE',
    leaderAddress: '0x9d2e5c8a1f4b7d3e6c0a9f2b5d8e1c4a7f3b2e6a1',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 28_300_000n,
    pnl30dDbusdc: 1_414_000n,
    budgetUsedBps: 1800,
    budgetTotalDbusdc: 400_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-005',
    name: 'Fathom DCA Deep',
    strategy: 'DCA',
    leaderAddress: '0x4e8f1a3c6d9b2e5a8f0c3d6e9b2a5f8c1d4e7b6e0',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 19_640_000n,
    pnl30dDbusdc: -192_000n,
    budgetUsedBps: 10000,
    budgetTotalDbusdc: 150_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-006',
    name: 'Harbor',
    strategy: 'DCA',
    leaderAddress: '0x48c9a1e4f7b2d5c8e1a4f7b0d3c6a9e2b5f8c1ae9f',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 3_500_000n,
    pnl30dDbusdc: 0n,
    budgetUsedBps: 2400,
    budgetTotalDbusdc: 100_000_000n,
    status: 'REVOKED',
  },
  {
    id: 'v-007',
    name: 'Keel Alpha',
    strategy: 'RANGE',
    leaderAddress: '0x1c19a5b3e8f2d4c7a0f5d2e9b6c3a1f8d5b2e7a63a5',
    pool: 'DEEP/SUI',
    tvlDbusdc: 22_180_000n,
    pnl30dDbusdc: 889_000n,
    budgetUsedBps: 5500,
    budgetTotalDbusdc: 250_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-008',
    name: 'Compass Range',
    strategy: 'RANGE',
    leaderAddress: '0x5b2d8e1a4c7f0d3b6e9a2c5f8b1d4e7a0c3f6b9d2',
    pool: 'DEEP/SUI',
    tvlDbusdc: 18_430_000n,
    pnl30dDbusdc: 441_000n,
    budgetUsedBps: 6200,
    budgetTotalDbusdc: 200_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-009',
    name: 'Starboard MM',
    strategy: 'DELEGATE',
    leaderAddress: '0x6c3e9a2f5b8d1e4c7a0f3b6d9e2c5a8f1b4d7c0e3',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 15_090_000n,
    pnl30dDbusdc: -340_000n,
    budgetUsedBps: 7100,
    budgetTotalDbusdc: 180_000_000n,
    status: 'LIVE',
  },
  {
    id: 'v-010',
    name: 'Bow Watch DCA',
    strategy: 'DCA',
    leaderAddress: '0x7d4f0b3e6c9a2f5b8e1d4c7f0a3b6d9e2c5a8f1b',
    pool: 'SUI/DBUSDC',
    tvlDbusdc: 9_807_000n,
    pnl30dDbusdc: 210_000n,
    budgetUsedBps: 3300,
    budgetTotalDbusdc: 120_000_000n,
    status: 'LIVE',
  },
];

// ── Formatting helpers ────────────────────────────────────────────────────────

const DBUSDC_DECIMALS = 6;

/** Format bigint base-unit DBUSDC into a human string: K/M/B at 2dp. */
export function formatDbusdc(val: bigint): string {
  const n = Number(val) / Math.pow(10, DBUSDC_DECIMALS);
  return formatNumber(n);
}

/** Format a plain number into K/M/B at 2dp. */
export function formatNumber(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(2)}K`;
  return `${sign}${abs.toFixed(2)}`;
}

/** Format basis points as a percentage string: e.g. 7257 → "72.57" */
export function formatBps(bps: number): string {
  return (bps / 100).toFixed(2);
}

/** Shorten an address: first 6 + last 4 chars. */
export function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
