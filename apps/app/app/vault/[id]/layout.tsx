import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metador — Vault',
  description: 'Vault detail — policy card, budget meter, and live activity feed.',
};

export default function VaultDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
