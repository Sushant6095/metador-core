import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metador — Predict Vault',
  description:
    'Predict vault detail — policy walls, vol surface, PLP risk, positions, and revoke.',
};

export default function PredictVaultDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
