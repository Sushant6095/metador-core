'use client';

/**
 * PositionsPanel — bottom tabbed strip: Positions / Balances / Open Orders /
 * Order History. Positions always show liquidation price + health (money-safety
 * law). Mock data until the margin SDK is wired (P0 spike). Self-contained tab
 * strip (no external Tabs coupling) to stay robust during the rebuild.
 */
import { useState } from 'react';
import { mockPositions, MOCK_ACCOUNT } from '../../../lib/mock-margin';
import { getMarket } from '../../../lib/mock-margin';
import {
  MONO_STYLE,
  formatPrice,
  formatUsd,
  formatSignedUsd,
  formatSize,
  priceDigits,
} from '../../../lib/margin-format';

type Tab = 'positions' | 'balances' | 'orders' | 'history';

const TABS: { id: Tab; label: string; count?: number }[] = [
  { id: 'positions', label: 'Positions', count: 2 },
  { id: 'balances', label: 'Balances' },
  { id: 'orders', label: 'Open Orders', count: 0 },
  { id: 'history', label: 'Order History' },
];

export function PositionsPanel() {
  const [tab, setTab] = useState<Tab>('positions');
  const positions = mockPositions();
  const acct = MOCK_ACCOUNT;

  return (
    <section aria-label="Account" className="flex flex-col h-full bg-surface">
      <div
        role="tablist"
        className="flex items-center gap-1 px-2 border-b border-border h-9 shrink-0"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'h-9 px-3 text-xs font-medium border-b-2 -mb-px transition-colors duration-(--metador-duration-fast)',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                active
                  ? 'border-primary text-text'
                  : 'border-transparent text-muted hover:text-text',
              ].join(' ')}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span className="ml-1 text-faint" style={MONO_STYLE}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'positions' && (
          <table className="w-full text-xs" style={MONO_STYLE}>
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-faint">
                {[
                  'Market',
                  'Side',
                  'Size',
                  'Entry',
                  'Mark',
                  'Liq. price',
                  'Margin',
                  'uPnL',
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-2 font-medium ${i === 0 || i === 1 ? 'text-left' : 'text-right'}`}
                    style={{ fontFamily: 'var(--metador-font-text)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const mkt = getMarket(p.symbol);
                if (!mkt) return null;
                const digits = priceDigits(mkt.markPrice, mkt.quoteDecimals);
                const sideColor =
                  p.side === 'long'
                    ? 'var(--metador-success)'
                    : 'var(--metador-danger)';
                const pnlColor =
                  p.unrealizedPnl >= 0n
                    ? 'var(--metador-success)'
                    : 'var(--metador-danger)';
                const healthColor =
                  p.marginRatioBp < 500
                    ? 'var(--metador-danger)'
                    : 'var(--metador-text)';
                return (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="px-3 py-2 text-left text-text">
                      {p.symbol}
                    </td>
                    <td
                      className="px-3 py-2 text-left"
                      style={{ color: sideColor }}
                    >
                      {p.side === 'long' ? 'Long' : 'Short'} · {p.leverage}×
                    </td>
                    <td className="px-3 py-2 text-right text-text">
                      {formatSize(p.size, mkt.baseDecimals, 2)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted">
                      {formatPrice(p.entryPrice, mkt.quoteDecimals, digits)}
                    </td>
                    <td className="px-3 py-2 text-right text-text">
                      {formatPrice(p.markPrice, mkt.quoteDecimals, digits)}
                    </td>
                    <td
                      className="px-3 py-2 text-right"
                      style={{ color: 'var(--metador-danger)' }}
                    >
                      {formatPrice(
                        p.liquidationPrice,
                        mkt.quoteDecimals,
                        digits,
                      )}
                    </td>
                    <td
                      className="px-3 py-2 text-right"
                      style={{ color: healthColor }}
                    >
                      {(p.marginRatioBp / 100).toFixed(2)}%
                    </td>
                    <td
                      className="px-3 py-2 text-right"
                      style={{ color: pnlColor }}
                    >
                      {formatSignedUsd(p.unrealizedPnl, mkt.quoteDecimals)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === 'balances' && (
          <dl
            className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border"
            style={MONO_STYLE}
          >
            {[
              ['Collateral', formatUsd(acct.collateral, acct.quoteDecimals)],
              ['Equity', formatUsd(acct.equity, acct.quoteDecimals)],
              ['Available', formatUsd(acct.available, acct.quoteDecimals)],
              ['Margin used', formatUsd(acct.marginUsed, acct.quoteDecimals)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-surface px-3 py-3 flex flex-col gap-1"
              >
                <dt
                  className="text-[11px] uppercase tracking-wider text-faint"
                  style={{ fontFamily: 'var(--metador-font-text)' }}
                >
                  {label}
                </dt>
                <dd className="text-sm text-text">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {(tab === 'orders' || tab === 'history') && (
          <div className="flex items-center justify-center h-full min-h-[120px] text-sm text-faint">
            {tab === 'orders' ? 'No open orders.' : 'No order history yet.'}
          </div>
        )}
      </div>
    </section>
  );
}
