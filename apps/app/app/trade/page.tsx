import { redirect } from 'next/navigation';
import { DEFAULT_MARKET } from '../../lib/mock-margin';

/** Bare /trade → default market terminal. */
export default function TradeIndex() {
  redirect(`/trade/${DEFAULT_MARKET}`);
}
