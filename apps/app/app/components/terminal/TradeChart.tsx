'use client';

/**
 * TradeChart — placeholder candle frame for the terminal. Deterministic faux
 * candles (no Math.random) so the layout reads as a real chart panel; the live
 * lightweight-charts integration lands in P1 (banned from SSR, lazy-loaded).
 * Compositor-only; purely presentational.
 */
import { useMemo, useState } from 'react';
import type { MarginMarket } from '../../../lib/mock-margin';
import {
  MONO_STYLE,
  formatPrice,
  formatBp,
  priceDigits,
} from '../../../lib/margin-format';

const TIMEFRAMES = ['1m', '5m', '1h', 'D', 'W'] as const;
const COUNT = 56;

function seedWalk(
  seed: number,
): { o: number; c: number; h: number; l: number }[] {
  const out: { o: number; c: number; h: number; l: number }[] = [];
  let price = 100;
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) ^ 0x9e3779b9) >>> 0;
    return (s % 1000) / 1000 - 0.5;
  };
  for (let i = 0; i < COUNT; i++) {
    const o = price;
    const drift = next() * 4;
    const c = Math.max(20, o + drift);
    const h = Math.max(o, c) + Math.abs(next()) * 2;
    const l = Math.min(o, c) - Math.abs(next()) * 2;
    out.push({ o, c, h, l });
    price = c;
  }
  return out;
}

export function TradeChart({ market }: { market: MarginMarket }) {
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>('1h');
  const seed = market.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 7);
  const candles = useMemo(() => seedWalk(seed), [seed]);
  const digits = priceDigits(market.markPrice, market.quoteDecimals);

  const max = Math.max(...candles.map((d) => d.h));
  const min = Math.min(...candles.map((d) => d.l));
  const span = max - min || 1;
  const W = 100;
  const H = 60;
  const step = W / candles.length;
  const y = (v: number) => H - ((v - min) / span) * H;
  const up = market.change24hBp >= 0;

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center gap-1 px-2 h-9 border-b border-border shrink-0">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTf(t)}
            className={[
              'h-6 px-2 text-xs rounded-xs transition-colors duration-(--metador-duration-fast)',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tf === t ? 'bg-raised text-text' : 'text-muted hover:text-text',
            ].join(' ')}
            style={MONO_STYLE}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-faint">
          Candles · testnet preview
        </span>
      </div>

      <div className="relative flex-1 min-h-[220px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
          aria-label={`${market.symbol} price chart placeholder`}
        >
          {candles.map((d, i) => {
            const cx = i * step + step / 2;
            const rising = d.c >= d.o;
            const color = rising ? 'var(--metador-success)' : 'var(--metador-danger)';
            const bodyTop = y(Math.max(d.o, d.c));
            const bodyH = Math.max(0.4, Math.abs(y(d.o) - y(d.c)));
            return (
              <g key={i}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={y(d.h)}
                  y2={y(d.l)}
                  stroke={color}
                  strokeWidth={0.18}
                />
                <rect
                  x={cx - step * 0.3}
                  y={bodyTop}
                  width={step * 0.6}
                  height={bodyH}
                  fill={color}
                />
              </g>
            );
          })}
        </svg>
        {/* current-price marker line */}
        <div
          className="absolute right-0 px-1.5 py-0.5 text-[10px] rounded-xs"
          style={{
            ...MONO_STYLE,
            top: '12%',
            backgroundColor: up
              ? 'var(--metador-tint-success)'
              : 'var(--metador-tint-danger)',
            color: up ? 'var(--metador-success)' : 'var(--metador-danger)',
          }}
        >
          {formatPrice(market.markPrice, market.quoteDecimals, digits)} ·{' '}
          {formatBp(market.change24hBp)}
        </div>
      </div>
    </div>
  );
}
