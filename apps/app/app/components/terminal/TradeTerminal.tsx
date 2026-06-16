'use client';

/**
 * TradeTerminal — hyperliquid-grade margin terminal, Metador brand. Composes the
 * market header (with switcher), chart, order book, order entry, and positions.
 * Mock data (mock-margin) until the DeepBook Margin SDK lands in the P0 spike.
 *
 * Layout: header bar → [chart | order book | order entry] → positions strip.
 * Stacks to a single column < lg. All numerals tabular mono; up/down semantic.
 */
import { useRouter } from 'next/navigation';
import type { MarginMarket } from '../../../lib/mock-margin';
import { MARKETS, buildOrderBook } from '../../../lib/mock-margin';
import {
  MONO_STYLE,
  formatPrice,
  formatCompactUsd,
  formatBp,
  priceDigits,
} from '../../../lib/margin-format';
import { OrderBook } from './OrderBook';
import { OrderEntry } from './OrderEntry';
import { PositionsPanel } from './PositionsPanel';
import { TradeChart } from './TradeChart';

interface TradeTerminalProps {
  market: MarginMarket;
}

function HeaderStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[84px]">
      <span className="text-[10px] uppercase tracking-wider text-faint">
        {label}
      </span>
      <span className="text-xs text-text" style={{ ...MONO_STYLE, color }}>
        {value}
      </span>
    </div>
  );
}

function MarketHeader({ market }: { market: MarginMarket }) {
  const router = useRouter();
  const digits = priceDigits(market.markPrice, market.quoteDecimals);
  const up = market.change24hBp >= 0;
  const upColor = up ? 'var(--metador-success)' : 'var(--metador-danger)';

  return (
    <header className="flex items-center gap-5 px-4 h-16 border-b border-border bg-surface overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <label htmlFor="market-select" className="sr-only">
          Select market
        </label>
        <select
          id="market-select"
          value={market.symbol}
          onChange={(e) => router.push(`/trade/${e.target.value}`)}
          className="bg-raised border border-border rounded-sm px-2 h-9 text-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {MARKETS.map((m) => (
            <option key={m.symbol} value={m.symbol}>
              {m.symbol}
            </option>
          ))}
        </select>
        <span
          className="px-1.5 h-5 inline-flex items-center rounded-xs text-[10px] font-medium"
          style={{
            backgroundColor: 'var(--metador-raised)',
            color: 'var(--metador-muted)',
          }}
        >
          {market.maxLeverage}× max
        </span>
      </div>

      <div className="flex flex-col gap-0.5 shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-faint">
          Mark
        </span>
        <span
          className="text-base font-semibold"
          style={{ ...MONO_STYLE, color: upColor }}
        >
          {formatPrice(market.markPrice, market.quoteDecimals, digits)}
        </span>
      </div>

      <HeaderStat
        label="Index"
        value={formatPrice(market.indexPrice, market.quoteDecimals, digits)}
      />
      <HeaderStat
        label="24h Change"
        value={formatBp(market.change24hBp)}
        color={upColor}
      />
      <HeaderStat
        label="24h Volume"
        value={formatCompactUsd(market.volume24h, market.quoteDecimals)}
      />
      <HeaderStat
        label="Open Interest"
        value={formatCompactUsd(market.openInterest, market.quoteDecimals)}
      />
      <HeaderStat
        label="Funding (8h)"
        value={formatBp(market.fundingBp)}
        color={
          market.fundingBp >= 0 ? 'var(--metador-success)' : 'var(--metador-danger)'
        }
      />
    </header>
  );
}

export function TradeTerminal({ market }: TradeTerminalProps) {
  const book = buildOrderBook(market);

  return (
    <div className="flex flex-col w-full max-w-[1440px] mx-auto">
      <MarketHeader market={market} />

      {/* Top region: chart | order book | order entry (stacks < lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_300px] border-b border-border">
        <div className="border-b lg:border-b-0 lg:border-r border-border">
          <TradeChart market={market} />
        </div>
        <div className="border-b lg:border-b-0 lg:border-r border-border max-h-[520px] overflow-auto">
          <OrderBook market={market} book={book} />
        </div>
        <div>
          <OrderEntry market={market} />
        </div>
      </div>

      {/* Positions strip */}
      <div className="min-h-[200px]">
        <PositionsPanel />
      </div>
    </div>
  );
}
