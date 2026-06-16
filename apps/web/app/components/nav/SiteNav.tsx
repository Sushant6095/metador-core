'use client';

/**
 * SiteNav — floating pill nav (landing premium pass, founder build-list #2).
 *
 * Geometry (choreography.md §3, founder-shots): a DETACHED rounded bar inset
 * ~16px from top/sides, pill height ~56px, generous radius (--metador-radius-pill
 * = 32px — large but diverged from their 60px capsule signature). Surface/scrim
 * background + hairline border, --metador-shadow-float so it reads as a floating
 * layer. MetadorLogo left; links + Launch App CTA right.
 *
 * STATIC on scroll (their measured behavior, choreography.md §3): no recolor,
 * no shrink, no transform. backdrop-filter:none (DESIGN.md overlay rule).
 *
 * Active-section awareness: mint underline on the matching link (transform/
 * opacity only). Mobile: text links collapse; the pill + Launch App stay.
 * Works at 375px and 1440px.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MetadorLogo } from '@metador/ui';
import { EASE_STANDARD } from '@metador/design-system';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

interface NavLink {
  label: string;
  href: string;
  sectionId: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'How it works', href: '#how-safety-works', sectionId: 'how-safety-works' },
  { label: 'Safety', href: '#activity-feed', sectionId: 'activity-feed' },
  { label: 'Waitlist', href: '#waitlist', sectionId: 'waitlist' },
];

export function SiteNav() {
  const [activeSection, setActiveSection] = useState<string>('');

  // Active-section tracking via IntersectionObserver
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.sectionId);
    const elements: Element[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) elements.push(el);
    });

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Use the first intersecting entry that is the most in-view
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        // 20% from top — fires when section is meaningfully in view
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      role="banner"
      style={{
        position: 'fixed',
        top: 'var(--metador-space-4)',
        left: 'var(--metador-space-4)',
        right: 'var(--metador-space-4)',
        zIndex: 'var(--metador-z-floating)',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none', // only the pill itself is interactive
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: 1120,
          minHeight: 56,
          backgroundColor: 'var(--metador-bg-scrim-nav)',
          border: '1px solid var(--metador-border)',
          borderRadius: 'var(--metador-radius-pill)',
          boxShadow: 'var(--metador-shadow-float)',
          backdropFilter: 'none', // no blur — DESIGN.md overlay rule
          padding: 'var(--metador-space-2) var(--metador-space-3) var(--metador-space-2) var(--metador-space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--metador-space-4)',
        }}
      >
        {/* Wordmark lockup */}
        <Link
          href="/"
          aria-label="Metador — home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          style={{ textDecoration: 'none', borderRadius: 'var(--metador-radius-xs)' }}
        >
          {/* neutralMark: the nav CTA is mint → logo mark goes neutral so the
              hero viewport keeps primary ≤2 (elevation-spec §3.2). */}
          <MetadorLogo size="sm" neutralMark />
        </Link>

        {/* Nav + CTA right */}
        <nav aria-label="Main navigation">
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--metador-space-4)',
            }}
          >
            {/* Text links — hidden on narrow mobile via responsive class */}
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.sectionId;
              return (
                <li key={link.sectionId} className="nav-link-item">
                  <a
                    href={link.href}
                    aria-current={isActive ? 'true' : undefined}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    style={{
                      position: 'relative',
                      fontFamily: 'var(--metador-font-text)',
                      fontSize: 'var(--metador-text-sm)',
                      color: isActive ? 'var(--metador-text)' : 'var(--metador-muted)',
                      textDecoration: 'none',
                      paddingBottom: 'var(--metador-space-1)',
                      transitionProperty: 'color',
                      transitionDuration: 'var(--metador-duration-fast)',
                      transitionTimingFunction: `cubic-bezier(${EASE_STANDARD.join(',')})`,
                      borderRadius: 'var(--metador-radius-xs)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--metador-text)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isActive
                        ? 'var(--metador-text)'
                        : 'var(--metador-muted)';
                    }}
                  >
                    {link.label}
                    {/* Mint underline on active — transform/opacity only */}
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: 'var(--metador-primary)',
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'scaleX(1)' : 'scaleX(0.4)',
                        transformOrigin: 'left',
                        transitionProperty: 'opacity, transform',
                        transitionDuration: 'var(--metador-duration-fast)',
                        transitionTimingFunction: `cubic-bezier(${EASE_STANDARD.join(',')})`,
                      }}
                    />
                  </a>
                </li>
              );
            })}

            {/* Launch App CTA — always visible */}
            <li>
              <a
                href={APP_URL}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: 'var(--metador-font-text)',
                  fontWeight: 'var(--metador-weight-medium)',
                  fontSize: 'var(--metador-text-sm)',
                  backgroundColor: 'var(--metador-primary)',
                  color: 'var(--metador-on-primary)',
                  borderRadius: 'var(--metador-radius-pill)',
                  padding: 'var(--metador-space-2) var(--metador-space-4)',
                  textDecoration: 'none',
                  transitionProperty: 'background-color',
                  transitionDuration: 'var(--metador-duration-fast)',
                  transitionTimingFunction: `cubic-bezier(${EASE_STANDARD.join(',')})`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--metador-primary-bright)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--metador-primary)';
                }}
              >
                Launch App
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
