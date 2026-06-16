/**
 * Mock portfolio positions for G1 shell.
 * All amounts in bigint base units (SUI=9dp, DBUSDC=6dp).
 * Replaced by keel_core chain reads in G1.
 */

export interface PortfolioPosition {
  vaultId: string;
  vaultName: string;
  pool: string;
  strategy: 'delegate' | 'dca';
  quoteSymbol: 'SUI' | 'DBUSDC';
  quoteDecimals: number;
  /** Depositor's share of vault TVL in quote base units */
  deposited: bigint;
  /** Current value in quote base units */
  currentValue: bigint;
  /** Unrealised PnL = currentValue - deposited */
  pnl: bigint;
  /** Entry timestamp ms */
  enteredAtMs: number;
  status: 'active' | 'revoked' | 'expired';
}

export const MOCK_POSITIONS: readonly PortfolioPosition[] = [
  {
    vaultId: '0xa11ce00000000000000000000000000000000000000000000000000000000001',
    vaultName: 'Deep Blue DCA',
    pool: 'DEEP/SUI',
    strategy: 'dca',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    deposited: 500_000_000_000n, // 500 SUI
    currentValue: 531_200_000_000n, // 531.2 SUI
    pnl: 31_200_000_000n, // +31.2 SUI
    enteredAtMs: 1_748_000_000_000,
    status: 'active',
  },
  {
    vaultId: '0xa11ce00000000000000000000000000000000000000000000000000000000002',
    vaultName: 'Metador Flagship',
    pool: 'SUI/DBUSDC',
    strategy: 'delegate',
    quoteSymbol: 'DBUSDC',
    quoteDecimals: 6,
    deposited: 10_000_000_000n, // 10,000 DBUSDC
    currentValue: 9_879_420_000n, // 9,879.42 DBUSDC
    pnl: -120_580_000n, // -120.58 DBUSDC
    enteredAtMs: 1_749_500_000_000,
    status: 'active',
  },
  {
    vaultId: '0xa11ce00000000000000000000000000000000000000000000000000000000004',
    vaultName: 'Harbor (revoked demo)',
    pool: 'DEEP/SUI',
    strategy: 'dca',
    quoteSymbol: 'SUI',
    quoteDecimals: 9,
    deposited: 200_000_000_000n, // 200 SUI
    currentValue: 200_000_000_000n, // 200 SUI (no change, revoked)
    pnl: 0n,
    enteredAtMs: 1_747_000_000_000,
    status: 'revoked',
  },
] as const;

/**
 * Aggregate portfolio KPIs — pure bigint arithmetic, no floats touch money.
 * Returns totals in a synthetic "USD-equivalent" represented as DBUSDC (6dp)
 * for display purposes only (mock: 1 SUI = 3.42 DBUSDC at 6dp resolution).
 */
const SUI_TO_DBUSDC_BP = 342n; // mock rate: 3.42 DBUSDC per SUI × 100 = 342bp

function toDbusdc(amount: bigint, decimals: number): bigint {
  if (decimals === 6) return amount;
  // SUI (9dp) → DBUSDC (6dp): divide by 1000 then apply mock rate
  return (amount / 1_000n * SUI_TO_DBUSDC_BP) / 100n;
}

export interface PortfolioKpis {
  totalDeposited: bigint;   // DBUSDC 6dp
  totalCurrentValue: bigint; // DBUSDC 6dp
  totalPnl: bigint;          // DBUSDC 6dp (signed)
  activeCount: number;
}

export function computePortfolioKpis(
  positions: readonly PortfolioPosition[],
): PortfolioKpis {
  let totalDeposited = 0n;
  let totalCurrentValue = 0n;
  let totalPnl = 0n;
  let activeCount = 0;

  for (const p of positions) {
    totalDeposited += toDbusdc(p.deposited, p.quoteDecimals);
    totalCurrentValue += toDbusdc(p.currentValue, p.quoteDecimals);
    totalPnl += toDbusdc(p.pnl, p.quoteDecimals);
    if (p.status === 'active') activeCount++;
  }

  return { totalDeposited, totalCurrentValue, totalPnl, activeCount };
}
