'use client';

/**
 * OrderEntry — market/limit, cross/isolated, leverage, long/short, size.
 * Money-safety (CLAUDE.md §2 / metador-product): estimated **liquidation price** is
 * always shown before the action, plus a risk note before any leveraged action.
 * All derived numbers are bigint base units; the submit is a Connect CTA until
 * wallet + DeepBook Margin SDK are wired in the P0 spike (no fake on-chain tx).
 */
import { useState } from 'react';
import type { MarginMarket, Side, MarginMode } from '../../../lib/mock-margin';
import { estimateLiquidationPrice, notional } from '../../../lib/mock-margin';
import {
  MONO_STYLE,
  formatPrice,
  formatUsd,
  priceDigits,
} from '../../../lib/margin-format';

interface OrderEntryProps {
  market: MarginMarket;
}

type OrderType = 'market' | 'limit';

/** Parse a decimal string to bigint base units; null if invalid/too precise. */
function parseToBaseUnits(input: string, decimals: number): bigint | null {
  const t = input.trim();
  if (t === '' || t === '.' || !/^\d*\.?\d*$/.test(t)) return null;
  const [intPart, fracPart = ''] = t.split('.');
  if (fracPart.length > decimals) return null;
  try {
    return BigInt((intPart || '0') + fracPart.padEnd(decimals, '0'));
  } catch {
    return null;
  }
}

const FEE_BP = 35n; // 0.035% taker — illustrative

export function OrderEntry({ market }: OrderEntryProps) {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<Side>('long');
  const [mode, setMode] = useState<MarginMode>('cross');
  const [leverage, setLeverage] = useState(2);
  const [sizeStr, setSizeStr] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [reduceOnly, setReduceOnly] = useState(false);

  const digits = priceDigits(market.markPrice, market.quoteDecimals);
  const limitPrice =
    orderType === 'limit'
      ? parseToBaseUnits(limitStr, market.quoteDecimals)
      : null;
  const entryPrice =
    orderType === 'limit' && limitPrice ? limitPrice : market.markPrice;
  const sizeBase = parseToBaseUnits(sizeStr, market.baseDecimals);

  const notionalQuote = sizeBase
    ? notional(sizeBase, entryPrice, market.baseDecimals)
    : 0n;
  const marginRequired = leverage > 0 ? notionalQuote / BigInt(leverage) : 0n;
  const fees = (notionalQuote * FEE_BP) / 100_000n;
  const liqPrice = estimateLiquidationPrice(side, entryPrice, leverage);

  const longActive = side === 'long';
  const accent = longActive ? 'var(--metador-success)' : 'var(--metador-danger)';

  function segBtn(active: boolean): string {
    return [
      'flex-1 h-8 text-xs font-medium rounded-xs transition-colors duration-(--metador-duration-fast)',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
      active ? 'bg-raised text-text' : 'text-muted hover:text-text',
    ].join(' ');
  }

  return (
    <section
      aria-label="Order entry"
      className="flex flex-col gap-3 p-3 bg-surface h-full"
    >
      {/* Margin mode + leverage chip row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-sm border border-border p-0.5">
          <button
            type="button"
            className={segBtn(mode === 'cross')}
            onClick={() => setMode('cross')}
          >
            Cross
          </button>
          <button
            type="button"
            className={segBtn(mode === 'isolated')}
            onClick={() => setMode('isolated')}
          >
            Isolated
          </button>
        </div>
        <span
          className="px-2 h-8 inline-flex items-center rounded-sm border border-border text-xs text-text"
          style={MONO_STYLE}
        >
          {leverage}×
        </span>
      </div>

      {/* Order type tabs */}
      <div className="flex rounded-sm border border-border p-0.5">
        <button
          type="button"
          className={segBtn(orderType === 'market')}
          onClick={() => setOrderType('market')}
        >
          Market
        </button>
        <button
          type="button"
          className={segBtn(orderType === 'limit')}
          onClick={() => setOrderType('limit')}
        >
          Limit
        </button>
      </div>

      {/* Long / Short */}
      <div className="flex gap-2" role="group" aria-label="Direction">
        <button
          type="button"
          onClick={() => setSide('long')}
          aria-pressed={longActive}
          className="flex-1 h-9 rounded-sm text-sm font-semibold transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
          style={
            longActive
              ? {
                  backgroundColor: 'var(--metador-success)',
                  color: 'var(--metador-bg)',
                }
              : {
                  backgroundColor: 'var(--metador-tint-success)',
                  color: 'var(--metador-success)',
                }
          }
        >
          Long / Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('short')}
          aria-pressed={!longActive}
          className="flex-1 h-9 rounded-sm text-sm font-semibold transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
          style={
            !longActive
              ? {
                  backgroundColor: 'var(--metador-danger)',
                  color: 'var(--metador-bg)',
                }
              : {
                  backgroundColor: 'var(--metador-tint-danger)',
                  color: 'var(--metador-danger)',
                }
          }
        >
          Short / Sell
        </button>
      </div>

      {/* Limit price (limit only) */}
      {orderType === 'limit' && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-faint">
            Limit price ({market.quote})
          </span>
          <input
            inputMode="decimal"
            value={limitStr}
            onChange={(e) => setLimitStr(e.target.value)}
            placeholder={formatPrice(
              market.markPrice,
              market.quoteDecimals,
              digits,
            )}
            className="h-9 px-2 rounded-sm bg-raised border border-border text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={MONO_STYLE}
          />
        </label>
      )}

      {/* Size */}
      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-faint">
          Size ({market.base})
        </span>
        <input
          inputMode="decimal"
          value={sizeStr}
          onChange={(e) => setSizeStr(e.target.value)}
          placeholder="0.00"
          aria-invalid={sizeStr !== '' && sizeBase === null}
          className="h-9 px-2 rounded-sm bg-raised border border-border text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={MONO_STYLE}
        />
      </label>

      {/* Leverage slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-faint">
          <span>Leverage</span>
          <span style={{ ...MONO_STYLE, color: 'var(--metador-text)' }}>
            {leverage}× / {market.maxLeverage}×
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={market.maxLeverage}
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          aria-label="Leverage"
          style={{ accentColor: 'var(--metador-primary)' }}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-muted select-none">
        <input
          type="checkbox"
          checked={reduceOnly}
          onChange={(e) => setReduceOnly(e.target.checked)}
          style={{ accentColor: 'var(--metador-primary)' }}
        />
        Reduce only
      </label>

      {/* Summary — liquidation ALWAYS visible (money-safety law) */}
      <dl
        className="flex flex-col gap-1.5 text-xs border-t border-border pt-3"
        style={MONO_STYLE}
      >
        <Row
          label="Order value"
          value={formatUsd(notionalQuote, market.quoteDecimals)}
        />
        <Row
          label="Margin required"
          value={formatUsd(marginRequired, market.quoteDecimals)}
        />
        <Row
          label="Est. liquidation"
          value={
            sizeBase ? formatPrice(liqPrice, market.quoteDecimals, digits) : '—'
          }
          valueColor={accent}
        />
        <Row label="Est. fees" value={formatUsd(fees, market.quoteDecimals)} />
      </dl>

      {/* Submit — Connect CTA until wallet + margin SDK wired (P0 spike) */}
      <button
        type="button"
        disabled={!sizeBase}
        className="h-10 rounded-sm text-sm font-semibold bg-primary text-on-primary hover:bg-primary-bright active:bg-primary-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {sizeBase ? 'Connect wallet to trade' : 'Enter an amount'}
      </button>

      <p className="text-[11px] leading-snug text-faint">
        Leveraged trading can lose your entire margin. Liquidation occurs at the
        price above. Testnet preview — figures are illustrative.
      </p>
    </section>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd
        style={valueColor ? { color: valueColor } : undefined}
        className="text-text"
      >
        {value}
      </dd>
    </div>
  );
}
