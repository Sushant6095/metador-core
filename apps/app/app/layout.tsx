import type { Metadata } from 'next';
import { AppAnalytics } from './analytics';
import { TopNav } from './components/TopNav';
import { fraunces, geistMono, geistSans } from './fonts';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Metador — App',
  description:
    'Non-custodial strategy vaults for DeepBook on Sui. Marketplace, cockpit, portfolio, safety.',
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
        <Providers>
          <AppAnalytics />
          <TopNav />
          <main className="w-full max-w-[1440px] mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
