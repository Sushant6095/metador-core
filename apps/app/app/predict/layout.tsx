import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metador — Predict Vaults',
  description:
    'Non-custodial vault layer for DeepBook Predict. Four-walls policy, tokenized shares, PLP + hedge strategies.',
};

export default function PredictLayout({ children }: { children: React.ReactNode }) {
  return children;
}
