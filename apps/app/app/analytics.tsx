'use client';

import { METADOR_EVENTS, track } from '@metador/analytics';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Emits registry events only (CLAUDE.md sync contract). */
export function AppAnalytics() {
  const pathname = usePathname();
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const lastTrackedAddress = useRef<string | null>(null);

  useEffect(() => {
    track(METADOR_EVENTS.pageView, { app: 'app', path: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!account) {
      lastTrackedAddress.current = null;
      return;
    }
    if (lastTrackedAddress.current === account.address) return;
    lastTrackedAddress.current = account.address;
    track(METADOR_EVENTS.walletConnected, {
      wallet_name: currentWallet?.name ?? 'unknown',
      network: 'testnet',
    });
  }, [account, currentWallet]);

  return null;
}
