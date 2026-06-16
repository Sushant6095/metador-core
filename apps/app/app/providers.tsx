'use client';

import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from '@mysten/dapp-kit';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@metador/ui';
import '@mysten/dapp-kit/dist/index.css';

// Testnet only until the founder writes "go mainnet" in the decision log
// (CLAUDE.md §1).
const { networkConfig } = createNetworkConfig({
  testnet: { network: 'testnet', url: getJsonRpcFullnodeUrl('testnet') },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <ToastProvider>
            {children}
          </ToastProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
