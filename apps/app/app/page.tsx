import type { Metadata } from 'next';
import { formatBaseUnits } from '@metador/deepbook';
import { MARKETPLACE_VAULTS } from '../lib/mock-vaults';
import { MarketplaceTable } from './components/MarketplaceTable';

export const metadata: Metadata = {
  title: 'Metador — Marketplace',
  description: 'Browse non-custodial strategy vaults for DeepBook on Sui.',
};

// ── Bigint-safe stat computation (no floats) ─────────────────────────────────

function computeTotalTvl(): { sui: bigint; dbusdc: bigint } {
  return MARKETPLACE_VAULTS.reduce(
    (acc, v) =>
      v.quoteSymbol === 'SUI'
        ? { ...acc, sui: acc.sui + v.tvl }
        : { ...acc, dbusdc: acc.dbusdc + v.tvl },
    { sui: 0n, dbusdc: 0n },
  );
}

function computeTotalVolume24h(): { sui: bigint; dbusdc: bigint } {
  // Mock: use budgetSpent as proxy for 24h volume in shell
  return MARKETPLACE_VAULTS.reduce(
    (acc, v) =>
      v.quoteSymbol === 'SUI'
        ? { ...acc, sui: acc.sui + v.budgetSpent }
        : { ...acc, dbusdc: acc.dbusdc + v.budgetSpent },
    { sui: 0n, dbusdc: 0n },
  );
}

function joinAmounts(sui: bigint, dbusdc: bigint): string {
  return [
    sui > 0n ? `${formatBaseUnits(sui, 9, { maxFractionDigits: 0 })} SUI` : null,
    dbusdc > 0n
      ? `${formatBaseUnits(dbusdc, 6, { maxFractionDigits: 0 })} DBUSDC`
      : null,
  ]
    .filter(Boolean)
    .join(' + ');
}

// ── Page (Server Component — SSR for LCP; client island owns the table) ────────

export default function Marketplace() {
  const tvl = computeTotalTvl();
  const vol = computeTotalVolume24h();
  const tvlStr = joinAmounts(tvl.sui, tvl.dbusdc);
  const volStr = joinAmounts(vol.sui, vol.dbusdc);
  const activeCount = MARKETPLACE_VAULTS.filter((v) => v.status === 'active').length;

  return (
    <section aria-labelledby="marketplace-heading" className="flex flex-col gap-3">
      {/* Title + inline stat strip on one row — keeps the dense table high in
          the viewport (screener density grammar: divider-delimited stats). */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1
          id="marketplace-heading"
          className="text-2xl font-semibold text-text leading-none shrink-0"
          style={{ fontFamily: 'var(--metador-font-display)' }}
        >
          Vault Marketplace
        </h1>
        <div
          className="flex items-stretch divide-x divide-border rounded-md border border-border bg-surface px-4 py-2 overflow-x-auto"
          role="group"
          aria-label="Marketplace stats"
        >
          <StatSlot label="Total TVL" value={tvlStr} />
          <StatSlot
            label="Active"
            value={`${activeCount}`}
            unit={`/ ${MARKETPLACE_VAULTS.length}`}
            accent
          />
          <StatSlot label="24h Vol (est.)" value={volStr} />
        </div>
      </div>

      {/* Vault table — screener density grammar (client island) */}
      <MarketplaceTable vaults={[...MARKETPLACE_VAULTS]} />
    </section>
  );
}

interface StatSlotProps {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}
function StatSlot({ label, value, unit, accent }: StatSlotProps) {
  return (
    <div className="flex flex-col gap-1 px-4 first:pl-0 min-w-0">
      <span className="text-2xs uppercase tracking-widest text-muted truncate">
        {label}
      </span>
      <span
        className="font-mono text-lg leading-none truncate"
        style={{
          fontVariantNumeric: 'tabular-nums lining-nums',
          color: accent ? 'var(--metador-primary)' : 'var(--metador-text)',
        }}
      >
        {value}
        {unit && <span className="text-sm text-muted ml-1">{unit}</span>}
      </span>
    </div>
  );
}
