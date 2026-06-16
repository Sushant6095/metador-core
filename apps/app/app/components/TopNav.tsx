'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@mysten/dapp-kit';
import * as React from 'react';
import { MetadorLogo } from '@metador/ui';

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '/predict', label: 'Predict' },
  { href: '/trade', label: 'Trade' },
  { href: '/', label: 'Marketplace' },
  { href: '/screener', label: 'Screener' },
  { href: '/network', label: 'Network' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/cockpit', label: 'Cockpit' },
  { href: '/safety', label: 'Safety' },
  { href: '/docs', label: 'Docs' },
];

const MENU_ID = 'topnav-mobile-menu';

/**
 * App chrome — sticky top nav, z-elevated (--metador-z-elevated = 10).
 * Surface bg + hairline bottom border. Metador wordmark in display face
 * as a single uninterrupted string (K and eel same size, no gap).
 *
 * Mobile (<640px):
 *   - Hamburger/close button with aria-expanded + aria-controls
 *   - Active page label visible next to the menu button
 *   - Compact icon-only Connect + brass Create button on right
 *   - Disclosure menu panel opens below the bar with vertical link list
 * Desktop (≥640px):
 *   - Horizontal link row as before
 */
export function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Derive the current page label for display next to the menu button
  const currentLabel =
    NAV_LINKS.find(({ href }) =>
      href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'),
    )?.label ?? 'Menu';

  // Close menu on route change
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className="sticky top-0 bg-surface border-b border-border w-full"
      style={{ zIndex: 'var(--metador-z-elevated)' }}
    >
      <div className="w-full max-w-[1440px] mx-auto px-4 flex items-center gap-4 h-14">
        {/* Wordmark lockup — MetadorLogo (mark + text), link wrapper owns accessible name */}
        <Link
          href="/"
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
          aria-label="Metador — home"
        >
          <MetadorLogo size="sm" />
        </Link>

        {/* Desktop nav links — horizontal row, hidden below 640px */}
        <nav
          aria-label="Main navigation"
          className="flex-1 hidden sm:block"
        >
          <ul className="flex items-center gap-0 min-w-max" role="list">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'relative inline-flex items-center px-3 py-4 text-sm font-medium',
                      'transition-colors duration-(--metador-duration-fast)',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                      'rounded-t-xs',
                      isActive ? 'text-primary' : 'text-muted hover:text-text',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-[2px]"
                        style={{ backgroundColor: 'var(--metador-primary)' }}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile: current section label + hamburger — visible below 640px */}
        <div className="flex-1 flex items-center gap-2 sm:hidden min-w-0">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((v) => !v)}
            className={[
              'inline-flex items-center justify-center min-w-[24px] min-h-[24px] p-1 rounded-xs',
              'text-muted hover:text-text',
              'transition-colors duration-(--metador-duration-fast)',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'shrink-0',
            ].join(' ')}
          >
            {/* Hamburger / close icon */}
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
          {/* Current page label — always visible, truncated if needed */}
          <span
            className="text-sm font-medium text-text truncate"
            aria-current="page"
          >
            {currentLabel}
          </span>
        </div>

        {/* Right side cluster */}
        <div className="shrink-0 flex items-center gap-2">
          {/* Desktop: full "Create Vault" label */}
          <Link
            href="/create"
            className="hidden sm:inline-flex items-center px-3 py-1 rounded-sm text-sm font-medium bg-primary text-on-primary hover:bg-primary-bright active:bg-primary-deep transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Create Vault
          </Link>
          {/* Mobile: compact "Create" */}
          <Link
            href="/create"
            aria-label="Create Vault"
            className="sm:hidden inline-flex items-center px-2 py-1 rounded-sm text-sm font-medium bg-primary text-on-primary hover:bg-primary-bright active:bg-primary-deep transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg min-h-[24px]"
          >
            Create
          </Link>
          {/*
           * dapp-kit ConnectButton — on mobile the wrapper forces a compact
           * icon-only layout by capping width and hiding text via CSS.
           * We cannot override dapp-kit internals — the compact container
           * constrains the hit area to the icon without forking the lib.
           */}
          <div className="[&_button]:!rounded-sm [&_button]:!text-sm [&_button]:!font-medium [&_button]:!border [&_button]:!border-border [&_button]:!bg-raised [&_button]:!text-text sm:[&_button]:!min-w-0 [&_button]:!min-h-[24px]">
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Mobile disclosure menu panel — shown below bar when open */}
      {menuOpen && (
        <nav
          id={MENU_ID}
          aria-label="Mobile navigation"
          className="sm:hidden border-t border-border bg-surface"
        >
          <ul role="list" className="flex flex-col py-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'flex items-center px-4 py-3 text-sm font-medium min-h-[44px]',
                      'transition-colors duration-(--metador-duration-fast)',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                      isActive
                        ? 'text-primary border-l-2 border-primary bg-primary/5 pl-[14px]'
                        : 'text-muted hover:text-text hover:bg-raised border-l-2 border-transparent pl-[14px]',
                    ].join(' ')}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
