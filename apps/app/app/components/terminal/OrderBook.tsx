/**
 * OrderBook — dense bid/ask ladder with cumulative depth shading. Presentational
 * (no hooks). Asks descend to the spread row; bids descend below. Numerals are
 * tabular mono; bid=success, ask=danger (semantic tokens, never raw hex).
 */
import type { MarginMarket, OrderBook as Book } from '../../../lib/mock-margin';
import {
  MONO_STYLE,
  formatPrice,
  formatSize,
  formatBp,
  priceDigits,
} from '../../../lib/margin-format';

interface OrderBookProps {
  market: MarginMarket;
  book: Book;
}

interface Row {
  price: bigint;
  size: bigint;
  cum: bigint;
}

function cumulate(levels: readonly { price: bigint; size: bigint }[]): Row[] {
  let running = 0n;
  return levels.map((l) => {
    running += l.size;
    return { price: l.price, size: l.size, cum: running };
  });
}

export function OrderBook({ market, book }: OrderBookProps) {
  const digits = priceDigits(market.markPrice, market.quoteDecimals);
  const asks = cumulate(book.asks);
  const bids = cumulate(book.bids);
  const lastAskCum = asks.at(-1)?.cum ?? 0n;
  const lastBidCum = bids.at(-1)?.cum ?? 0n;
  const rawMax = lastAskCum > lastBidCum ? lastAskCum : lastBidCum;
  const maxCum = rawMax === 0n ? 1n : rawMax;

  function depthPercent(cum: bigint): number {
    return Number((cum * 100n) / maxCum);
  }

  function Ladder({ rows, side }: { rows: Row[]; side: 'ask' | 'bid' }) {
    const color = side === 'ask' ? 'var(--metador-danger)' : 'var(--metador-success)';
    const tint =
      side === 'ask' ? 'var(--metador-tint-danger)' : 'var(--metador-tint-success)';
    // Asks: render deepest at top, best ask nearest the spread (reverse).
    const ordered = side === 'ask' ? [...rows].reverse() : rows;
    return (
      <ul role="list" className="flex flex-col">
        {ordered.map((r) => (
          <li
            key={`${side}-${r.price.toString()}`}
            className="relative grid grid-cols-[1fr_1fr_1fr] items-center px-3 h-[22px] text-xs"
            style={MONO_STYLE}
          >
            <span
              className="absolute inset-y-0 right-0 pointer-events-none"
              style={{
                width: `${depthPercent(r.cum)}%`,
                backgroundColor: tint,
              }}
              aria-hidden="true"
            />
            <span className="relative z-10 text-left" style={{ color }}>
              {formatPrice(r.price, market.quoteDecimals, digits)}
            </span>
            <span className="relative z-10 text-right text-text">
              {formatSize(r.size, market.baseDecimals, 2)}
            </span>
            <span className="relative z-10 text-right text-muted">
              {formatSize(r.cum, market.baseDecimals, 2)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      aria-label="Order book"
      className="flex flex-col h-full bg-surface"
    >
      <header className="grid grid-cols-[1fr_1fr_1fr] px-3 py-2 text-[11px] uppercase tracking-wider text-faint border-b border-border">
        <span className="text-left">Price</span>
        <span className="text-right">Size ({market.base})</span>
        <span className="text-right">Total</span>
      </header>

      <Ladder rows={asks} side="ask" />

      <div
        className="grid grid-cols-[1fr_auto] items-center px-3 py-1.5 border-y border-border bg-raised text-xs"
        style={MONO_STYLE}
      >
        <span className="text-faint uppercase tracking-wider text-[11px]">
          Spread
        </span>
        <span className="text-right text-muted">
          {formatPrice(book.spread, market.quoteDecimals, digits)} ·{' '}
          {formatBp(book.spreadBp).replace('+', '')}
        </span>
      </div>

      <Ladder rows={bids} side="bid" />
    </section>
  );
}
