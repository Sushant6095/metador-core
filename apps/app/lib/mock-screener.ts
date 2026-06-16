/**
 * Mock screener/leaderboard data — ≥500 vaults shaped like real indexer rows
 * for the G2 leaderboard surface (hyperscreener density benchmark).
 *
 * DETERMINISM CONTRACT (CLAUDE.md §1 + parity reproducibility):
 *   No Math.random / Date.now at module scope. Every field is derived from
 *   pure index arithmetic via a small splitmix-style integer hash, so the
 *   dataset is byte-identical on every build → parity numbers are stable.
 *
 * MONEY DISCIPLINE:
 *   Amounts are bigint base units: SUI 9dp, DBUSDC 6dp. JS floats never touch
 *   money. nav7dDeltaBp is a signed basis-points integer (412 = +4.12%).
 *   sparkline7d is an int array of basis-point offsets from the 7d open — a
 *   compact integer series, never a float price.
 *
 * The first 14 rows are hand-authored anchors (demo wallets, the revoked +
 * expired states, the known testnet leaders). The remainder are generated.
 */

import type { StrategyKind, VaultStatus } from './mock-vaults';

export interface ScreenerVault {
  id: string;
  name: string;
  leader: string;
  strategy: StrategyKind;
  pool: string;
  quoteSymbol: 'SUI' | 'DBUSDC';
  quoteDecimals: number;
  tvl: bigint;
  /** Signed basis-points integer for 7-day NAV delta. NOT a float. */
  nav7dDeltaBp: number;
  /**
   * 7-day NAV path as basis-point offsets from the 7d open (integers).
   * Drives the inline SVG sparkline. e.g. [0, 40, 12, 95, 60, 130, 412].
   * Last element equals nav7dDeltaBp by construction.
   */
  sparkline7d: readonly number[];
  budget: bigint;
  budgetSpent: bigint;
  /** Unix ms expiry */
  expiresAtMs: number;
  status: VaultStatus;
  /** Age of vault in whole days */
  ageDays: number;
}

// ── Deterministic integer hash (splitmix32) ─────────────────────────────────
// Pure: same input → same output. Used to derive every generated field from a
// row index + a salt. No global RNG state, no Date.now.

function hash32(seed: number): number {
  let z = (seed + 0x9e3779b9) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
  z = z ^ (z >>> 15);
  return z >>> 0; // unsigned 32-bit
}

/** Deterministic integer in [min, max] from (index, salt). */
function pick(index: number, salt: number, min: number, max: number): number {
  const span = max - min + 1;
  return min + (hash32(index * 0x100 + salt) % span);
}

/** Deterministic 64-hex-char object id, prefixed 0xsc + zero-padded index. */
function makeId(index: number): string {
  const tail = index.toString(16).padStart(4, '0');
  // 64 hex chars total after 0x: "sc02" marker + filler + index tail
  const filler = '0'.repeat(64 - 4 - tail.length);
  return `0xsc02${filler}${tail}`;
}

/** Deterministic 64-hex leader address from index — looks like a real account. */
function makeLeader(index: number): string {
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += hash32(index * 0x1000 + i).toString(16).padStart(8, '0');
  }
  return `0x${out.slice(0, 64)}`;
}

// Word banks (digit-free — vault-name cells must carry no numerals so the
// parity mono-tabular ratio counts only the genuine numeric columns).
const PREFIXES = [
  'Metador', 'Deep', 'Meridian', 'Quarterdeck', 'Ironclad', 'Mariner', 'Reef',
  'Bilge', 'Starboard', 'Topsail', 'Nautilus', 'Fathom', 'Bowsprit', 'Harbor',
  'Anchor', 'Beacon', 'Cove', 'Drift', 'Ebb', 'Flux', 'Gale', 'Helm', 'Inlet',
  'Jetty', 'Metadorson', 'Lagoon', 'Mast', 'Neptune', 'Onyx', 'Pelagic', 'Quay',
  'Rudder', 'Sextant', 'Tide', 'Undertow', 'Vortex', 'Windward', 'Yardarm',
  'Zephyr', 'Azure', 'Brackish', 'Current', 'Delta', 'Estuary',
] as const;
const SUFFIXES = [
  'Flagship', 'Spread', 'Alpha', 'Grid', 'TWAP', 'Quant', 'Arb', 'Weekly',
  'Liquidity', 'Compounder', 'Carry', 'Momentum', 'Reversion', 'Maker',
  'Hedge', 'Basis', 'Vault', 'Strategy', 'Capital', 'Edge', 'Signal',
] as const;

const POOLS = [
  { pool: 'SUI/DBUSDC', quoteSymbol: 'DBUSDC' as const, quoteDecimals: 6 },
  { pool: 'DEEP/SUI', quoteSymbol: 'SUI' as const, quoteDecimals: 9 },
] as const;

/**
 * Build a 7-point basis-point path that ends exactly at `endBp`.
 * Deterministic wiggle derived from the row index; integer-only.
 */
function makeSparkline(index: number, endBp: number): number[] {
  const points: number[] = [0];
  // Distribute the move across 6 steps with deterministic noise.
  for (let step = 1; step <= 6; step++) {
    const target = Math.round((endBp * step) / 6);
    const noise = pick(index, 200 + step, -40, 40);
    const v = step === 6 ? endBp : target + noise;
    points.push(v);
  }
  return points;
}

// ── Hand-authored anchors (demo wallets + theatrical states) ────────────────
// These ids/leaders are referenced by the detail-page bridge and the demo.

const ANCHORS: readonly ScreenerVault[] = [
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000001',
    name: 'Metador Flagship',
    leader: '0x0f25c3a1e6f282ea0c95faa4518dbaa1607d888a6608d04fbedc408e1e59c608',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 86_300_120_000n,
    nav7dDeltaBp: 412,
    sparkline7d: [0, 60, 145, 90, 210, 330, 412],
    budget: 25_000_000_000n,
    budgetSpent: 9_876_540_000n,
    expiresAtMs: 1_751_500_000_000,
    status: 'active',
    ageDays: 47,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000002',
    name: 'Deep Blue DCA',
    leader: '0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7',
    strategy: 'dca',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 61_200_000_000_000n,
    nav7dDeltaBp: 287,
    sparkline7d: [0, 30, 88, 140, 110, 220, 287],
    budget: 5_000_000_000_000n,
    budgetSpent: 1_840_000_000_000n,
    expiresAtMs: 1_753_000_000_000,
    status: 'active',
    ageDays: 33,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000003',
    name: 'Meridian Spread',
    leader: '0x3f7a1b2c9d4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3d4e5',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 44_750_000_000n,
    nav7dDeltaBp: 531,
    sparkline7d: [0, 90, 180, 260, 350, 470, 531],
    budget: 20_000_000_000n,
    budgetSpent: 6_340_000_000n,
    expiresAtMs: 1_754_200_000_000,
    status: 'active',
    ageDays: 61,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000004',
    name: 'Quarterdeck Alpha',
    leader: '0x1a9f3e7b2c6d4f8e0a5b9c3d7e1f5a9b3c7d1e5f9a3b7c1d5e9f3a7b1c5d9e3f',
    strategy: 'delegate',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 38_800_000_000_000n,
    nav7dDeltaBp: 178,
    sparkline7d: [0, 20, 60, 40, 110, 150, 178],
    budget: 8_000_000_000_000n,
    budgetSpent: 5_200_000_000_000n,
    expiresAtMs: 1_752_800_000_000,
    status: 'active',
    ageDays: 29,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000005',
    name: 'Ironclad TWAP',
    leader: '0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1',
    strategy: 'dca',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 31_090_500_000n,
    nav7dDeltaBp: 89,
    sparkline7d: [0, 25, 10, 45, 30, 70, 89],
    budget: 15_000_000_000n,
    budgetSpent: 12_650_000_000n,
    expiresAtMs: 1_751_900_000_000,
    status: 'active',
    ageDays: 18,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000006',
    name: 'Mariner Grid',
    leader: '0x22be5f1bfb36b1f8e9c2d4a7b3e8f1a5c9d2b6e3f7a1c5d9b3e7f2a6c1d8b4e9',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 24_020_000_000n,
    nav7dDeltaBp: 634,
    sparkline7d: [0, 120, 240, 320, 440, 560, 634],
    budget: 10_000_000_000n,
    budgetSpent: 9_980_000_000n,
    expiresAtMs: 1_750_400_000_000,
    status: 'active',
    ageDays: 14,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000007',
    name: 'Reef DCA Weekly',
    leader: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
    strategy: 'dca',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 19_750_000_000_000n,
    nav7dDeltaBp: -134,
    sparkline7d: [0, -20, -55, -30, -90, -110, -134],
    budget: 3_000_000_000_000n,
    budgetSpent: 980_000_000_000n,
    expiresAtMs: 1_755_000_000_000,
    status: 'active',
    ageDays: 22,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000008',
    name: 'Bilge Pump Arb',
    leader: '0x5e8f2a1b9c6d3e7f0a4b8c2d6e1f5a9b3c7d1e8f2a6b0c4d8e3f7a1b5c9d2e6f',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 17_440_000_000n,
    nav7dDeltaBp: 202,
    sparkline7d: [0, 40, 90, 70, 140, 175, 202],
    budget: 8_000_000_000n,
    budgetSpent: 2_100_000_000n,
    expiresAtMs: 1_756_000_000_000,
    status: 'active',
    ageDays: 9,
  },
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000009',
    name: 'Starboard DCA',
    leader: '0xa3b7c1d5e9f3071b2c6d0e4f8a2b6c0d4e8f2a7b1c5d9e3f8a2b6c1d5e0f4a8',
    strategy: 'dca',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 12_990_000_000n,
    nav7dDeltaBp: -287,
    sparkline7d: [0, -40, -90, -150, -180, -240, -287],
    budget: 6_000_000_000n,
    budgetSpent: 3_420_000_000n,
    expiresAtMs: 1_752_600_000_000,
    status: 'active',
    ageDays: 37,
  },
  {
    id: '0xsc010000000000000000000000000000000000000000000000000000000000000a',
    name: 'Topsail Liquidity',
    leader: '0x9d2e6a1f5b3c7e0d4a8b2c6f0e4a9d3b7f1e5a0c4b8d2f6e1a5c9b3d7f2e6a1',
    strategy: 'delegate',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 9_300_000_000_000n,
    nav7dDeltaBp: 445,
    sparkline7d: [0, 80, 160, 230, 320, 400, 445],
    budget: 2_500_000_000_000n,
    budgetSpent: 450_000_000_000n,
    expiresAtMs: 1_754_500_000_000,
    status: 'active',
    ageDays: 5,
  },
  {
    id: '0xsc010000000000000000000000000000000000000000000000000000000000000b',
    name: 'Nautilus Grid',
    leader: '0x6c0f4a8b2e6d1f5a9c3b7d1e5f9a3c7b1d5e9f3a7c1b5d9e3f7a1c5b9d3e7f1',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 7_820_000_000n,
    nav7dDeltaBp: -55,
    sparkline7d: [0, -10, -25, -15, -40, -48, -55],
    budget: 4_000_000_000n,
    budgetSpent: 1_560_000_000n,
    expiresAtMs: 1_753_400_000_000,
    status: 'active',
    ageDays: 52,
  },
  {
    id: '0xsc010000000000000000000000000000000000000000000000000000000000000c',
    name: 'Fathom DCA Deep',
    leader: '0x4e8f2b6a0c4d8e3f7a1b5c9d2e6f0a4b8c2d6e0f4a8b3c7d1e5f9a3b7c2d6e0',
    strategy: 'dca',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 6_140_000_000_000n,
    nav7dDeltaBp: 312,
    sparkline7d: [0, 50, 120, 180, 240, 290, 312],
    budget: 1_500_000_000_000n,
    budgetSpent: 1_499_000_000_000n,
    expiresAtMs: 1_751_200_000_000,
    status: 'active',
    ageDays: 41,
  },
  {
    id: '0xsc010000000000000000000000000000000000000000000000000000000000000d',
    name: 'Bowsprit Quant',
    leader: '0x2d6e0f4a8b2c6d0e4f8a2b7c1d5e9f3a7b1c5d9e3f8a2b6c0d4e8f2a7b1c5d9',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 4_550_000_000n,
    nav7dDeltaBp: -412,
    sparkline7d: [0, -60, -140, -210, -300, -370, -412],
    budget: 3_000_000_000n,
    budgetSpent: 2_900_000_000n,
    expiresAtMs: 1_750_100_000_000,
    status: 'active',
    ageDays: 68,
  },
  // ── Revoked (theatrical state) ────────────────────────────────────────────
  {
    id: '0xsc010000000000000000000000000000000000000000000000000000000000000e',
    name: 'Harbor Revoked Demo',
    leader: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
    strategy: 'dca',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 3_500_000_000_000n,
    nav7dDeltaBp: 0,
    sparkline7d: [0, 10, -5, 8, -2, 4, 0],
    budget: 500_000_000_000n,
    budgetSpent: 121_000_000_000n,
    expiresAtMs: 1_752_000_000_000,
    status: 'revoked',
    ageDays: 15,
  },
  {
    id: '0xsc010000000000000000000000000000000000000000000000000000000000000f',
    name: 'Capsized Arb',
    leader: '0x8b3c7d1e5f9a3b7c2d6e0f4a8b2c6d0e4f8a3b7c1d5e9f2a6b0c4d8e3f7a2b6',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 2_110_000_000n,
    nav7dDeltaBp: -763,
    sparkline7d: [0, -120, -260, -400, -540, -680, -763],
    budget: 5_000_000_000n,
    budgetSpent: 5_000_000_000n,
    expiresAtMs: 1_748_000_000_000,
    status: 'revoked',
    ageDays: 83,
  },
  // ── Expired ────────────────────────────────────────────────────────────────
  {
    id: '0xsc0100000000000000000000000000000000000000000000000000000000000010',
    name: 'Drift Catcher',
    leader: '0xc1d5e9f3a7b2c6d0e4a8b3c7d1e5f9a2b6c0d4e8f3a7b1c5d9e2f6a0b4c8d3e7',
    strategy: 'dca',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 1_200_000_000n,
    nav7dDeltaBp: 44,
    sparkline7d: [0, 8, 20, 14, 30, 38, 44],
    budget: 2_000_000_000n,
    budgetSpent: 1_800_000_000n,
    expiresAtMs: 1_747_000_000_000,
    status: 'expired',
    ageDays: 90,
  },
] as const;

// ── Generated rows ──────────────────────────────────────────────────────────
// Total dataset ≥ 500 to exercise virtualization at the benchmark's density.

const GENERATED_COUNT = 500;
const EXPIRES_BASE_MS = 1_750_000_000_000; // fixed epoch anchor (no Date.now)

function generateVault(i: number): ScreenerVault {
  const index = ANCHORS.length + i;
  const poolCfg = POOLS[pick(index, 1, 0, POOLS.length - 1)] ?? POOLS[0];
  const strategy: StrategyKind = pick(index, 2, 0, 1) === 0 ? 'delegate' : 'dca';

  // TVL: log-distributed magnitudes so the leaderboard has a believable tail.
  // Build the bigint from integer parts only — no float money.
  const tvlUnits = BigInt(pick(index, 3, 500, 95_000)); // whole quote units
  const tvlFrac = BigInt(pick(index, 4, 0, 99)); // 2dp of fractional units
  const scale = 10n ** BigInt(poolCfg.quoteDecimals);
  const tvl = tvlUnits * scale + (tvlFrac * scale) / 100n;

  // 7d NAV delta in bp: skew positive but allow drawdowns.
  const navRoll = pick(index, 5, 0, 999);
  let nav7dDeltaBp: number;
  if (navRoll < 120) nav7dDeltaBp = -pick(index, 6, 30, 820); // ~12% negative
  else nav7dDeltaBp = pick(index, 7, 5, 690);

  // Budget + spent (spent ≤ budget always; some near ceiling, a few maxed).
  const budgetUnits = BigInt(pick(index, 8, 1_000, 30_000));
  const budget = budgetUnits * scale;
  const spentPct = pick(index, 9, 3, 100); // percent of budget consumed
  const budgetSpent = (budget * BigInt(spentPct)) / 100n;

  const status: VaultStatus = 'active';
  const ageDays = pick(index, 10, 1, 180);
  const expiresAtMs = EXPIRES_BASE_MS + pick(index, 11, 0, 9_000) * 1_000_000;

  const prefix = PREFIXES[pick(index, 12, 0, PREFIXES.length - 1)] ?? 'Metador';
  const suffix = SUFFIXES[pick(index, 13, 0, SUFFIXES.length - 1)] ?? 'Vault';
  const name = `${prefix} ${suffix}`;

  return {
    id: makeId(index),
    name,
    leader: makeLeader(index),
    strategy,
    pool: poolCfg.pool,
    quoteSymbol: poolCfg.quoteSymbol,
    quoteDecimals: poolCfg.quoteDecimals,
    tvl,
    nav7dDeltaBp,
    sparkline7d: makeSparkline(index, nav7dDeltaBp),
    budget,
    budgetSpent,
    expiresAtMs,
    status,
    ageDays,
  };
}

const GENERATED: readonly ScreenerVault[] = Array.from(
  { length: GENERATED_COUNT },
  (_, i) => generateVault(i),
);

export const SCREENER_VAULTS: readonly ScreenerVault[] = [...ANCHORS, ...GENERATED];

// O(1) lookup map for the detail-page bridge — resolves all 500+ rows.
const VAULT_BY_ID: ReadonlyMap<string, ScreenerVault> = new Map(
  SCREENER_VAULTS.map((v) => [v.id, v]),
);

/**
 * Look up a screener vault by id (for detail page resolution).
 * Returns undefined if not found. Resolves every generated row, not just
 * the hand-authored anchors — keeps the static-import bridge in mock-vaults.
 */
export function getScreenerVault(id: string): ScreenerVault | undefined {
  return VAULT_BY_ID.get(id);
}
