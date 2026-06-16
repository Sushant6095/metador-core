import type { Metadata } from 'next';
import './globals.css';
import './atmosphere.css';
import { fraunces, geistMono, geistSans } from './fonts';
import { SkipLink } from './components/skip-link/SkipLink';

export const metadata: Metadata = {
  title: 'Metador — Vault layer for DeepBook on Sui',
  description:
    'Non-custodial strategy vaults with chain-enforced safety. Budget-capped, single-market, expiring, revocable — enforced by Sui validators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <SkipLink />
        {/* Grain overlay — single fixed node for the whole page (atmosphere.css §2.3) */}
        <div className="metador-grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
