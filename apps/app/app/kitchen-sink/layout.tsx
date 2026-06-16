import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metador — Kitchen Sink',
  description: 'Verify gate — every @metador/ui primitive in both themes.',
};

export default function KitchenSinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
