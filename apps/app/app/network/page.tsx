'use client';

/**
 * /network — Metador Protocol Analytics
 *
 * Panels (top-to-bottom):
 *   1. KPI strip    — 5 divider-delimited unboxed metrics
 *   2. Grid row     — NavPnlChart (left) + TvlDonutChart (right)
 *   3. TopVaultsTable — full-width, sortable, paginated, searchable
 *
 * Colors: --metador-primary (#50d2c1) + semantic tokens.
 * ECharts: tree-shaken, lazy via dynamic import inside each chart component.
 * No raw hex. No arbitrary Tailwind values.
 */

import * as React from 'react';
import { KpiStrip } from './KpiStrip';
import { LiveDot } from './LiveDot';
import { NavPnlChart } from './NavPnlChart';
import { TvlDonutChart } from './TvlDonutChart';
import { TopVaultsTable } from './TopVaultsTable';
import {
  NETWORK_KPIS,
  TVL_DISTRIBUTION,
  TOP_VAULTS,
  getNavSeries,
  formatDbusdc,
  formatBps,
  formatNumber,
  type RangeKey,
} from './fixtures';

type SeriesKey = 'plpYield' | 'hedgeCost' | 'net';

export default function NetworkPage() {
  const [range, setRange] = React.useState<RangeKey>('M');
  const [activeSeries, setActiveSeries] = React.useState<Set<SeriesKey>>(
    new Set(['plpYield', 'hedgeCost', 'net']),
  );
  const [lastUpdated, setLastUpdated] = React.useState<number>(Date.now());

  // Simulated live refresh — layout never shifts, only data values change
  React.useEffect(() => {
    const id = setInterval(() => {
      setLastUpdated(Date.now());
    }, 3000);
    return () => clearInterval(id);
  }, []);

  function toggleSeries(key: SeriesKey) {
    setActiveSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // keep at least one
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const kpis = [
    {
      label: 'Total Vault TVL',
      value: formatDbusdc(NETWORK_KPIS.totalTvlDbusdc),
      unit: 'DBUSDC',
      highlight: true,
    },
    {
      label: 'PLP Pool AUM',
      value: formatDbusdc(NETWORK_KPIS.plpAumDbusdc),
      unit: 'DBUSDC',
    },
    {
      label: 'PLP Utilization',
      value: formatBps(NETWORK_KPIS.plpUtilizationBps),
      unit: '%',
    },
    {
      label: 'Premium at Risk',
      value: formatDbusdc(NETWORK_KPIS.premiumAtRiskDbusdc),
      unit: 'DBUSDC',
      warn: true,
    },
    {
      label: 'Active Vaults',
      value: String(NETWORK_KPIS.activeVaults),
      unit: `/ ${NETWORK_KPIS.maxVaults}`,
    },
  ];

  const navData = getNavSeries(range);

  // Total TVL label for donut center
  const totalTvlLabel = formatNumber(
    Number(NETWORK_KPIS.totalTvlDbusdc) / Math.pow(10, 6),
  );

  return (
    <main
      className="min-h-screen bg-bg"
      style={{ fontFamily: 'var(--metador-font-text)' }}
    >
      <div
        className="w-full max-w-[1440px] mx-auto"
        style={{ padding: 'var(--metador-space-6)' }}
      >
        {/* ── Page header ──────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-3 mb-6"
          role="banner"
          aria-label="Network page header"
        >
          <h1
            className="font-semibold text-text"
            style={{
              fontSize: 'var(--metador-text-2xl)',
              letterSpacing: '-0.01em',
              fontFamily: 'var(--metador-font-display)',
              lineHeight: 1.2,
            }}
          >
            Network
          </h1>
          <span
            className="border rounded-sm px-2 py-1 text-primary"
            style={{
              fontSize: 'var(--metador-text-2xs)',
              fontFamily: 'var(--metador-font-code)',
              letterSpacing: '0.08em',
              borderColor: 'var(--metador-primary-deep)',
            }}
          >
            DEEPBOOK PREDICT · TESTNET
          </span>
          <span className="ml-auto">
            <LiveDot lastUpdatedMs={lastUpdated} />
          </span>
        </div>

        {/* ── KPI strip ────────────────────────────────────────────────── */}
        <div className="mb-6">
          <KpiStrip items={kpis} />
        </div>

        {/* ── Chart row: NAV/PnL (left) + TVL donut (right) ───────────── */}
        <div
          className="grid gap-4 mb-4"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          <NavPnlChart
            data={navData}
            range={range}
            onRangeChange={setRange}
            activeSeries={activeSeries}
            onToggleSeries={toggleSeries}
          />
          <TvlDonutChart
            slices={TVL_DISTRIBUTION}
            totalLabel={totalTvlLabel}
            totalUnit="DBUSDC TVL"
          />
        </div>

        {/* ── Top vaults table ─────────────────────────────────────────── */}
        <TopVaultsTable vaults={TOP_VAULTS} />
      </div>
    </main>
  );
}
