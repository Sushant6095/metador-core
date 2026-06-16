'use client';

/**
 * NavPnlChart — ECharts area chart: PLP yield (primary), Hedge cost (warn),
 * Net PnL (success/danger split). Green gradient above zero, danger gradient
 * below zero. Tree-shaken import, lazy via dynamic import at the call site.
 * Colors read from CSS custom properties via getComputedStyle so they theme-switch.
 */

import * as React from 'react';
import type { RangeKey, NavDataPoint } from './fixtures';

type SeriesKey = 'plpYield' | 'hedgeCost' | 'net';

interface NavPnlChartProps {
  data: NavDataPoint[];
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  activeSeries: Set<SeriesKey>;
  onToggleSeries: (s: SeriesKey) => void;
}

const RANGES: RangeKey[] = ['D', 'W', 'M', 'Y'];

const SERIES_META: { key: SeriesKey; label: string; tokenVar: string }[] = [
  { key: 'plpYield', label: 'PLP yield', tokenVar: '--metador-primary' },
  { key: 'hedgeCost', label: 'Hedge cost', tokenVar: '--metador-warn' },
  { key: 'net', label: 'Net', tokenVar: '--metador-success' },
];

function getToken(name: string): string {
  if (typeof window === 'undefined') return '#50d2c1';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function NavPnlChart({
  data,
  range,
  onRangeChange,
  activeSeries,
  onToggleSeries,
}: NavPnlChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = React.useRef<any>(null);
  // Flipped true once async ECharts init completes, so the option effect
  // (which runs on mount before init resolves) re-runs and applies the option.
  const [ready, setReady] = React.useState(false);

  // Initialize ECharts lazily
  React.useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    async function init() {
      const [{ init: echartsInit }, LineChart, GridComponent, TooltipComponent, LegendComponent] =
        await Promise.all([
          import('echarts/core'),
          import('echarts/charts').then((m) => m.LineChart),
          import('echarts/components').then((m) => m.GridComponent),
          import('echarts/components').then((m) => m.TooltipComponent),
          import('echarts/components').then((m) => m.LegendComponent),
        ]);

      const { CanvasRenderer } = await import('echarts/renderers');

      const { use } = await import('echarts/core');
      use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

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

  // Update chart option whenever data/series change
  React.useEffect(() => {
    if (!chartRef.current) return;

    const primary = getToken('--metador-primary');
    const warn = getToken('--metador-warn');
    const success = getToken('--metador-success');
    const danger = getToken('--metador-danger');
    const surface = getToken('--metador-raised');
    const border = getToken('--metador-border');
    const muted = getToken('--metador-muted');
    const textCol = getToken('--metador-text');
    const gridLine = 'rgba(255,255,255,0.05)';

    const labels = data.map((d) => d.label);

    const makeAreaStyle = (colorAbove: string, colorBelow: string) => ({
      origin: 'auto' as const,
      color: {
        type: 'linear' as const,
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: colorAbove + '40' },
          { offset: 0.6, color: colorAbove + '08' },
          { offset: 0.6, color: colorBelow + '08' },
          { offset: 1, color: colorBelow + '38' },
        ],
      },
    });

    const option = {
      backgroundColor: 'transparent',
      grid: { top: 12, right: 16, bottom: 32, left: 52, containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: surface,
        borderColor: border,
        borderWidth: 1,
        textStyle: { color: textCol, fontSize: 12, fontFamily: 'var(--metador-font-code)' },
        axisPointer: { type: 'cross', lineStyle: { color: muted, width: 1 } },
        formatter: (params: Array<{ seriesName: string; value: number; marker: string }>) => {
          return params
            .map((p) => {
              const sign = p.value >= 0 ? '+' : '';
              return `${p.marker} ${p.seriesName}: <b>${sign}${p.value.toFixed(2)}K</b>`;
            })
            .join('<br/>');
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: {
          color: muted,
          fontSize: 11,
          fontFamily: 'var(--metador-font-code)',
          fontVariantNumeric: 'tabular-nums',
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: muted,
          fontSize: 11,
          fontFamily: 'var(--metador-font-code)',
          formatter: (v: number) => (v === 0 ? '0' : (v > 0 ? '+' : '') + v.toFixed(0) + 'K'),
        },
        splitLine: { lineStyle: { color: gridLine, type: 'dashed' as const } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        activeSeries.has('plpYield') && {
          name: 'PLP yield',
          type: 'line',
          data: data.map((d) => d.plpYield),
          smooth: 0.4,
          symbol: 'none',
          lineStyle: { color: primary, width: 2 },
          areaStyle: makeAreaStyle(primary, primary),
          z: 3,
        },
        activeSeries.has('hedgeCost') && {
          name: 'Hedge cost',
          type: 'line',
          data: data.map((d) => d.hedgeCost),
          smooth: 0.4,
          symbol: 'none',
          lineStyle: { color: warn, width: 2 },
          areaStyle: makeAreaStyle(warn, danger),
          z: 2,
        },
        activeSeries.has('net') && {
          name: 'Net',
          type: 'line',
          data: data.map((d) => d.net),
          smooth: 0.4,
          symbol: 'none',
          lineStyle: {
            color: success,
            width: 2.5,
          },
          areaStyle: makeAreaStyle(success, danger),
          z: 4,
        },
      ].filter(Boolean),
    };

    chartRef.current.setOption(option, true);
  }, [data, activeSeries, ready]);

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
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <h2
          className="font-medium text-text"
          style={{ fontSize: 'var(--metador-text-lg)' }}
        >
          Protocol NAV / PnL
        </h2>
        {/* Range segmented control */}
        <div className="ml-auto flex gap-0.5" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={[
                'px-2 py-1 rounded-sm text-2xs font-medium tabular-nums',
                'transition-colors',
                r === range
                  ? 'text-primary border border-primary-deep'
                  : 'text-muted hover:text-text',
              ].join(' ')}
              style={{
                fontFamily: 'var(--metador-font-code)',
                transitionDuration: 'var(--metador-duration-fast)',
              }}
              aria-pressed={r === range}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggle chips */}
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Series toggles">
        {SERIES_META.map(({ key, label, tokenVar }) => {
          const active = activeSeries.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleSeries(key)}
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border',
                'text-2xs transition-colors',
                active ? 'border-border text-muted' : 'border-border/40 text-faint',
              ].join(' ')}
              style={{ transitionDuration: 'var(--metador-duration-fast)' }}
              aria-pressed={active}
            >
              <span
                className="shrink-0 rounded-sm"
                style={{
                  width: 9,
                  height: 9,
                  backgroundColor: `var(${tokenVar})`,
                  opacity: active ? 1 : 0.3,
                }}
                aria-hidden="true"
              />
              {label}
            </button>
          );
        })}
      </div>

      {/* Chart canvas */}
      <div
        ref={containerRef}
        style={{ height: 240, width: '100%' }}
        role="img"
        aria-label="Protocol NAV/PnL area chart over time"
      />
    </div>
  );
}
