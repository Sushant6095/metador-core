'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMarket, DEFAULT_MARKET } from '../../../lib/mock-margin';
import { TradeTerminal } from '../../components/terminal/TradeTerminal';

/**
 * /trade/[market] — the trading terminal route (v4 product centerpiece).
 * Client-param pattern matching the rest of apps/app. Unknown markets
 * redirect to the default rather than 404, so a stale symbol still lands.
 */
export default function TradePage() {
  const params = useParams<{ market: string }>();
  const router = useRouter();
  const symbol = decodeURIComponent(params.market ?? '');
  const market = getMarket(symbol);

  useEffect(() => {
    if (!market) router.replace(`/trade/${DEFAULT_MARKET}`);
  }, [market, router]);

  if (!market) return null;
  return <TradeTerminal market={market} />;
}
