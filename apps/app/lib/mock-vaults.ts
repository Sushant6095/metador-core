/**
 * Mock vault data for G0/G1 shell skeletons — replaced by chain reads when
 * keel_core ships (G1). Amounts are integer base units (bigint): SUI 9dp,
 * DBUSDC 6dp. JS floats never touch money (CLAUDE.md §1).
 */

import { getScreenerVault, SCREENER_VAULTS } from './mock-screener';
import type { ScreenerVault } from './mock-screener';

export type StrategyKind = 'delegate' | 'dca';
export type VaultStatus = 'active' | 'revoked' | 'expired';

export interface MockVault {
  id: string;
  name: string;
  leader: string;
  strategy: StrategyKind;
  pool: string;
  /** Quote symbol + decimals for all amounts below. */
  quoteSymbol: 'SUI' | 'DBUSDC';
  quoteDecimals: number;
  tvl: bigint;
  /** Signed 30d PnL in quote base units. */
  pnl30d: bigint;
  /** Policy wall #1: spend ceiling. */
  budget: bigint;
  budgetSpent: bigint;
  /** Policy wall #3: unix ms expiry. */
  expiresAtMs: number;
  status: VaultStatus;
  followers: number;
}

export const MOCK_VAULTS: readonly MockVault[] = [
  {
    id: '0xa11ce00000000000000000000000000000000000000000000000000000000001',
    name: 'Deep Blue DCA',
    leader: '0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7',
    strategy: 'dca',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 12_450_000_000_000n, // 12,450 SUI
    pnl30d: 312_500_000_000n, // +312.5 SUI
    budget: 1_000_000_000_000n, // 1,000 SUI ceiling
    budgetSpent: 642_000_000_000n,
    expiresAtMs: 1_753_000_000_000,
    status: 'active',
    followers: 184,
  },
  {
    id: '0xa11ce00000000000000000000000000000000000000000000000000000000002',
    name: 'Metador Flagship',
    leader: '0x0f25c3a1e6f282ea0c95faa4518dbaa1607d888a6608d04fbedc408e1e59c608',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 86_300_120_000n, // 86,300.12 DBUSDC
    pnl30d: -1_204_310_000n, // -1,204.31 DBUSDC
    budget: 25_000_000_000n, // 25,000 DBUSDC ceiling
    budgetSpent: 9_876_540_000n,
    expiresAtMs: 1_751_500_000_000,
    status: 'active',
    followers: 96,
  },
  {
    id: '0xa11ce00000000000000000000000000000000000000000000000000000000003',
    name: 'Mariner Grid',
    leader: '0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1',
    strategy: 'delegate',
    pool: 'SUI/DBUSDC',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    tvl: 14_020_000_000n,
    pnl30d: 880_450_000n,
    budget: 5_000_000_000n,
    budgetSpent: 4_999_990_000n, // budget meter nearly full — wall about to bind
    expiresAtMs: 1_750_400_000_000,
    status: 'active',
    followers: 41,
  },
  {
    id: '0xa11ce00000000000000000000000000000000000000000000000000000000004',
    name: 'Harbor (revoked demo)',
    leader: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
    strategy: 'dca',
    pool: 'DEEP/SUI',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    tvl: 3_500_000_000_000n,
    pnl30d: 0n,
    budget: 500_000_000_000n,
    budgetSpent: 121_000_000_000n,
    expiresAtMs: 1_752_000_000_000,
    status: 'revoked', // the theatrical REVOKED state (CLAUDE.md §4)
    followers: 27,
  },
] as const;

/**
 * Marketplace view = the 4 curated demo anchors (which carry real 30d PnL)
 * followed by a deterministic slice of the screener fixture mapped into the
 * marketplace shape. This gives the marketplace a realistic depth (~18 rows)
 * — the density the trading surface needs — without mutating the demo-critical
 * MOCK_VAULTS curation that the detail page / cockpit / video script rely on.
 *
 * Determinism (CLAUDE.md §1): screener rows are themselves pure index-derived,
 * and 30d PnL here is synthesized from the integer nav7dDeltaBp via bigint math
 * only (no floats touch money). Same build → byte-identical marketplace.
 */
function screenerToMarketplace(s: ScreenerVault): MockVault {
  // Synthesize a 30d PnL from the 7d nav delta (bigint, base-unit safe):
  // pnl ≈ tvl * navBp / 10_000, sign preserved. Pure integer arithmetic.
  const bp = BigInt(s.nav7dDeltaBp);
  const pnl30d = (s.tvl * bp) / 10_000n;
  // Deterministic follower count from the id tail (no RNG, no Date.now).
  const tail = parseInt(s.id.slice(-4), 16);
  return {
    id: s.id,
    name: s.name,
    leader: s.leader,
    strategy: s.strategy,
    pool: s.pool,
    quoteSymbol: s.quoteSymbol,
    quoteDecimals: s.quoteDecimals,
    tvl: s.tvl,
    pnl30d,
    budget: s.budget,
    budgetSpent: s.budgetSpent,
    expiresAtMs: s.expiresAtMs,
    status: s.status,
    followers: 12 + (tail % 240),
  };
}

const CURATED_IDS = new Set(MOCK_VAULTS.map((v) => v.id));

export const MARKETPLACE_VAULTS: readonly MockVault[] = [
  ...MOCK_VAULTS,
  // Take the next 16 active/revoked screener rows that aren't already curated.
  ...SCREENER_VAULTS.filter((s) => !CURATED_IDS.has(s.id))
    .slice(0, 16)
    .map(screenerToMarketplace),
];

export function getMockVault(id: string): MockVault | undefined {
  const direct = MOCK_VAULTS.find((vault) => vault.id === id);
  if (direct) return direct;

  // Resolve screener-only vaults. mock-screener imports only `type` from this
  // file so there is no runtime circular dependency — static import is safe.
  // getScreenerVault is an O(1) map lookup that resolves all 500+ rows.
  const screener: ScreenerVault | undefined = getScreenerVault(id);
  if (!screener) return undefined;
  return {
    id: screener.id,
    name: screener.name,
    leader: screener.leader,
    strategy: screener.strategy,
    pool: screener.pool,
    quoteSymbol: screener.quoteSymbol,
    quoteDecimals: screener.quoteDecimals,
    tvl: screener.tvl,
    pnl30d: 0n, // screener fixture has no 30d PnL — detail page shows 0
    budget: screener.budget,
    budgetSpent: screener.budgetSpent,
    expiresAtMs: screener.expiresAtMs,
    status: screener.status,
    followers: 0,
  };
}
