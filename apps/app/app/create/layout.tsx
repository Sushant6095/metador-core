import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metador — Create Vault',
  description: 'Create a non-custodial strategy vault on DeepBook with four on-chain policy walls.',
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
