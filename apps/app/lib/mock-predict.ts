/**
 * Mock Predict domain — shaped to @metador/deepbook predict.ts so the
 * Predict vault surface is NOT throwaway. Real predict-server feeds wire in
 * the P1 spike; until then every surface renders this clearly-marked mock.
 *
 * MONEY DISCIPLINE (CLAUDE.md §1):
 *   - All amounts are integer base units (bigint). dUSDC = 6 decimals.
 *   - Probabilities and vol are scaled integers (denominator explicit).
 *   - DETERMINISM: no Math.random / Date.now at module scope — every value
 *     derived from pure constants, so builds are byte-identical.
 *
 * Contract: imports only from @metador/deepbook (predict.ts types + formatters).
 * See ADR-009 for vault architecture and the four-walls model.
 */

import type {
  PredictMarket,
  PredictPosition,
  PlpState,
  PredictVaultSummary,
  SviParams,
} from '@metador/deepbook';

// ── Deterministic hash helper (splitmix-style, same approach as mock-margin) ──

function hash(n: number): number {
  let x = (n + 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

// ── Reference anchor timestamps (deterministic — no Date.now at module scope) ──
// Pinned to a well-known offset from Unix epoch so every build is identical.
// 1_750_000_000_000 = ~2025-06-15 15:06:40 UTC (safely in the future for demo).

const EPOCH_BASE = 1_750_000_000_000;

/** Expiry anchors: BTC sub-hour rolling markets (3 × 30 min apart). */
const EXPIRY_30 = EPOCH_BASE + 30 * 60 * 1000; // +30 min
const EXPIRY_60 = EPOCH_BASE + 60 * 60 * 1000; // +60 min
const EXPIRY_90 = EPOCH_BASE + 90 * 60 * 1000; // +90 min

// ── BTC spot reference (dUSDC, 6dp) ─────────────────────────────────────────
// BTC at ~$68,500; dUSDC 6dp → 68_500_000_000 base units
const BTC_SPOT = 68_500_000_000n;

// ── SVI params ───────────────────────────────────────────────────────────────
// SVI total-variance: w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2))
// Params are scaled integers; denominator = IV_DENOMINATOR^2 for variance.
// These are plausible sub-hour BTC vol surface values (not calibrated to live data).

const SVI_NEAR: SviParams = {
  a: 200n,    // low level variance
  b: 800n,    // moderate angle
  rho: -3000n, // mild negative skew (put skew typical for BTC)
  m: 0n,       // centered at ATM
  sigma: 2000n, // smoothness
};

const SVI_MID: SviParams = {
  a: 280n,
  b: 920n,
  rho: -2800n,
  m: 200n,
  sigma: 2400n,
};

const SVI_FAR: SviParams = {
  a: 350n,
  b: 1050n,
  rho: -2600n,
  m: 300n,
  sigma: 2600n,
};

// ── Markets ──────────────────────────────────────────────────────────────────

export const PREDICT_MARKETS: readonly PredictMarket[] = [
  {
    marketId: '0xmkt0000000000000000000000000000000000000000000000000000000001',
    underlying: 'BTC',
    quote: 'dUSDC',
    pythLazerFeedId: 1001,
    expiryMs: EXPIRY_30,
    minStrike: 60_000_000_000n,   // $60,000
    maxStrike: 80_000_000_000n,   // $80,000
    tickSize: 500_000_000n,       // $500 tick
    spot: BTC_SPOT,
    svi: SVI_NEAR,
    lifecycle: 'active',
    liquidationLtv: 8000n,        // 80% LTV
  },
  {
    marketId: '0xmkt0000000000000000000000000000000000000000000000000000000002',
    underlying: 'BTC',
    quote: 'dUSDC',
    pythLazerFeedId: 1001,
    expiryMs: EXPIRY_60,
    minStrike: 58_000_000_000n,
    maxStrike: 82_000_000_000n,
    tickSize: 500_000_000n,
    spot: BTC_SPOT,
    svi: SVI_MID,
    lifecycle: 'active',
    liquidationLtv: 7500n,
  },
  {
    marketId: '0xmkt0000000000000000000000000000000000000000000000000000000003',
    underlying: 'BTC',
    quote: 'dUSDC',
    pythLazerFeedId: 1001,
    expiryMs: EXPIRY_90,
    minStrike: 55_000_000_000n,
    maxStrike: 85_000_000_000n,
    tickSize: 500_000_000n,
    spot: BTC_SPOT,
    svi: SVI_FAR,
    lifecycle: 'active',
    liquidationLtv: 7000n,
  },
] as const;

export function getPredictMarket(marketId: string): PredictMarket | undefined {
  return PREDICT_MARKETS.find((m) => m.marketId === marketId);
}

// ── PLP pool state ────────────────────────────────────────────────────────────

export const MOCK_PLP_STATE: PlpState = {
  poolVaultId: '0xplp000000000000000000000000000000000000000000000000000000000001',
  totalSupply: 500_000_000_000n,     // 500,000 PLP shares (6dp)
  idleBalance: 120_400_000_000n,     // $120,400 idle dUSDC
  allocatedCapital: 318_600_000_000n, // $318,600 committed
  payoutLiability: 48_200_000_000n,  // $48,200 payout liability
};

// ── Positions ─────────────────────────────────────────────────────────────────
// Two open Predict positions per vault (deterministic via hash seeding).

function buildPositions(vaultSeed: number): readonly PredictPosition[] {
  const mkt1 = PREDICT_MARKETS[0];
  const mkt2 = PREDICT_MARKETS[1];
  if (!mkt1 || !mkt2) return [];

  // Position 1: plp_hedge vault — ATM strangle (two ranges around spot)
  // Position 2: range_ladder vault — wide ladder OTM ranges
  return [
    {
      orderId: `order-${hash(vaultSeed + 1).toString(16).padStart(8, '0')}`,
      marketId: mkt1.marketId,
      lowerStrike: 66_000_000_000n,  // $66,000
      higherStrike: 71_000_000_000n, // $71,000
      quantity: 5_000_000n,          // 5 lots (6dp)
      leverage: '2x',
      entryProbabilityBps: 3800n,    // 38% entry probability
      premiumPaid: 380_000_000n,     // $380 premium paid
      openedAtMs: EPOCH_BASE - 25 * 60 * 1000, // 25 min ago
    },
    {
      orderId: `order-${hash(vaultSeed + 2).toString(16).padStart(8, '0')}`,
      marketId: mkt2.marketId,
      lowerStrike: 71_000_000_000n,  // $71,000 (OTM range)
      higherStrike: 76_000_000_000n, // $76,000
      quantity: 3_000_000n,
      leverage: '1.5x',
      entryProbabilityBps: 1900n,   // 19% OTM
      premiumPaid: 210_000_000n,    // $210
      openedAtMs: EPOCH_BASE - 10 * 60 * 1000, // 10 min ago
    },
  ];
}

// ── Vault summaries ───────────────────────────────────────────────────────────

export const PREDICT_VAULTS: readonly PredictVaultSummary[] = [
  {
    vaultId: '0xpv000000000000000000000000000000000000000000000000000000000001',
    managerId: '0xmgr00000000000000000000000000000000000000000000000000000000001',
    strategy: 'plp_hedge',
    owner: '0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7',
    leader: '0x0f25c3a1e6f282ea0c95faa4518dbaa1607d888a6608d04fbedc408e1e59c608',
    shareSupply: 200_000_000_000n,     // 200,000 shares (6dp)
    nav: 224_600_000_000n,             // $224,600 NAV
    plpSupplied: 180_000_000_000n,     // $180,000 in PLP
    hedgePremium: 590_000_000n,        // $590 in open hedge positions
    policy: {
      perRollBudget: 5_000_000_000n,   // $5,000 per-roll budget ceiling
      allowedPythFeedId: 1001,
      mandateExpiryMs: 1_753_000_000_000,
      revoked: false,
    },
  },
  {
    vaultId: '0xpv000000000000000000000000000000000000000000000000000000000002',
    managerId: '0xmgr00000000000000000000000000000000000000000000000000000000002',
    strategy: 'range_ladder',
    owner: '0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1',
    leader: '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
    shareSupply: 80_000_000_000n,      // 80,000 shares
    nav: 87_400_000_000n,              // $87,400 NAV
    plpSupplied: 70_000_000_000n,      // $70,000 in PLP
    hedgePremium: 430_000_000n,        // $430 in hedge positions
    policy: {
      perRollBudget: 2_000_000_000n,   // $2,000 per-roll budget ceiling
      allowedPythFeedId: 1001,
      mandateExpiryMs: 1_751_500_000_000,
      revoked: false,
    },
  },
] as const;

export function getPredictVault(vaultId: string): PredictVaultSummary | undefined {
  return PREDICT_VAULTS.find((v) => v.vaultId === vaultId);
}

export function getPredictVaultPositions(vaultId: string): readonly PredictPosition[] {
  const idx = PREDICT_VAULTS.findIndex((v) => v.vaultId === vaultId);
  if (idx < 0) return [];
  return buildPositions(idx + 1);
}

// ── Mock activity feed entries (Predict-flavoured) ────────────────────────────

export interface PredictFeedEntry {
  kind: 'mint' | 'redeem' | 'supply' | 'withdraw' | 'rejected' | 'revoked' | 'deposit';
  title: string;
  detail?: string;
  timestamp: number;
  txHash?: string;
}

export function buildPredictFeed(
  vault: PredictVaultSummary,
  overrideRevoked?: boolean,
): PredictFeedEntry[] {
  const base = EPOCH_BASE - 60 * 60 * 1000; // 1 hour ago
  const isRevoked = overrideRevoked ?? vault.policy.revoked;

  const entries: PredictFeedEntry[] = [
    ...(isRevoked
      ? [
          {
            kind: 'revoked' as const,
            title: 'Capability revoked · irreversible',
            timestamp: base + 55 * 60 * 1000,
            txHash:
              '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666000011112222333a',
          },
        ]
      : []),
    {
      kind: 'rejected' as const,
      title: 'Mint rejected by policy: per-roll budget exceeded',
      detail: 'Attempted premium $620 — ceiling is $500/roll',
      timestamp: base + 42 * 60 * 1000,
    },
    {
      kind: 'mint' as const,
      title: 'Range minted on BTC/dUSDC',
      detail: 'Range $66,000–$71,000 · 2x leverage · premium $380',
      timestamp: base + 35 * 60 * 1000,
      txHash:
        '0xbbbb2222cccc3333dddd4444eeee5555ffff6666000011112222333344445556',
    },
    {
      kind: 'supply' as const,
      title: 'PLP supply deployed',
      detail: 'Supplied $5,000 to PLP pool · utilization now 72.3%',
      timestamp: base + 30 * 60 * 1000,
      txHash:
        '0xcccc3333dddd4444eeee5555ffff6666000011112222333344445555666677778',
    },
    {
      kind: 'deposit' as const,
      title: 'Depositor joined',
      detail: '+$12,000 dUSDC · 10,714 shares minted',
      timestamp: base + 20 * 60 * 1000,
    },
    {
      kind: 'mint' as const,
      title: 'Range minted on BTC/dUSDC',
      detail: 'Range $71,000–$76,000 · 1.5x leverage · premium $210',
      timestamp: base + 15 * 60 * 1000,
      txHash:
        '0xdddd4444eeee5555ffff6666000011112222333344445555666677778888999aa',
    },
    {
      kind: 'deposit' as const,
      title: 'Vault created',
      detail: 'Policy walls enforced on-chain · Predict manager bound',
      timestamp: base,
    },
  ];

  return entries.slice(0, 8);
}
