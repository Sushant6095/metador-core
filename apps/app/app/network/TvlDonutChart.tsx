'use client';

/**
 * TvlDonutChart — ECharts donut by strategy, center total label, legend chips.
 * Colors derived from CSS tokens via getComputedStyle — zero raw hex in JS.
 */

import * as React from 'react';
import type { TvlSlice } from './fixtures';

interface TvlDonutChartProps {
  slices: TvlSlice[];
  totalLabel: string;    // e.g. "399.6K"
  totalUnit?: string;    // e.g. "DBUSDC TVL"
}

function getToken(name: string): string {
  if (typeof window === 'undefined') return '#50d2c1';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Map slice index → token variable (4 slices max for the strategy donut)
const SLICE_TOKENS = [
  '--metador-primary',
  '--metador-warn',
  '--metador-primary-deep',
  '--metador-faint',
];

export function TvlDonutChart({ slices, totalLabel, totalUnit }: TvlDonutChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = React.useRef<any>(null);
  // Flipped true once async ECharts init completes, so the option effect re-runs.
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      const [{ init: echartsInit }, PieChart, TooltipComponent] = await Promise.all([
        import('echarts/core'),
        import('echarts/charts').then((m) => m.PieChart),
        import('echarts/components').then((m) => m.TooltipComponent),
      ]);
      const { CanvasRenderer } = await import('echarts/renderers');
      const { use } = await import('echarts/core');
      use([PieChart, TooltipComponent, CanvasRenderer]);
      if (cancelled || !containerRef.current) return;
      chartRef.current = echartsInit(containerRef.current, undefined, { renderer: 'canvas' });
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!chartRef.current) return;

    const surface = getToken('--metador-raised');
    const border = getToken('--metador-border');
    const textCol = getToken('--metador-text');
    const sliceColors = SLICE_TOKENS.map((t) => getToken(t));
    const surfaceColor = getToken('--metador-surface');

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: surface,
        borderColor: border,
        borderWidth: 1,
        textStyle: { color: textCol, fontSize: 12, fontFamily: 'var(--metador-font-code)' },
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name}: <b>${p.value.toFixed(1)}K DBUSDC</b> (${p.percent}%)`,
      },
      series: [
        {
          type: 'pie',
          radius: ['62%', '88%'],
          center: ['50%', '50%'],
          data: slices.map((s, i) => ({
            name: s.label,
            value: s.valueKDbusdc,
            itemStyle: { color: sliceColors[i % sliceColors.length], borderColor: surfaceColor, borderWidth: 2 },
          })),
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
          },
          // Muted hover label on center
          labelLine: { show: false },
        },
      ],
    };

    chartRef.current.setOption(option, true);

    // Center label overlay is handled in JSX below via absolute-positioned div

  }, [slices, ready]);

  // Resize observer
  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => chartRef.current?.resize());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="bg-surface border border-border rounded-lg"
      style={{ padding: 'var(--metador-space-4)' }}
    >
      <div className="flex items-center mb-3">
        <h2 className="font-medium text-text" style={{ fontSize: 'var(--metador-text-lg)' }}>
          Vault TVL Distribution
        </h2>
      </div>

      {/* Series legend chips */}
      <div className="flex flex-wrap gap-2 mb-3" role="list" aria-label="TVL distribution legend">
        {slices.map((s, i) => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1.5 border border-border rounded-full px-2.5 py-1 text-2xs text-muted"
            role="listitem"
          >
            <span
              className="shrink-0 rounded-sm"
              style={{
                width: 9,
                height: 9,
                backgroundColor: `var(${SLICE_TOKENS[i % SLICE_TOKENS.length]})`,
              }}
              aria-hidden="true"
            />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>

      {/* Donut + center overlay */}
      <div className="flex items-center justify-center">
        <div style={{ position: 'relative', width: 240, height: 240 }}>
          <div
            ref={containerRef}
            style={{ width: 240, height: 240 }}
            role="img"
            aria-label="Vault TVL distribution donut chart by strategy"
          />
          {/* Center label overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span
              className="text-text font-medium tabular-nums"
              style={{
                fontSize: 'var(--metador-text-lg)',
                fontFamily: 'var(--metador-font-code)',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {totalLabel}
            </span>
            {totalUnit && (
              <span
                className="text-muted uppercase tracking-wider mt-1"
                style={{ fontSize: 'var(--metador-text-2xs)', letterSpacing: '0.06em' }}
              >
                {totalUnit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
