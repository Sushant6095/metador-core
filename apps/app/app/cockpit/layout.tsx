import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metador — Cockpit',
  description: 'Vault leader cockpit — manage your vaults, view open orders and policy walls.',
};

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
