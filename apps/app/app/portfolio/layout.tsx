import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metador — Portfolio',
  description: 'Your vault deposit positions and withdrawal history.',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
