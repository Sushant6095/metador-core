/**
 * DocsPageLayout — wraps each doc page with:
 * - Breadcrumbs (Group / Page title)
 * - Center prose column (max-w 720px)
 * - Right TOC rail (220px, xl+ only, sticky)
 * - "Next page" footer pager
 *
 * Used as a server component wrapper in each page route.
 */
import * as React from 'react';
import Link from 'next/link';
import { TableOfContents } from './TableOfContents';
import type { TocHeading } from './TableOfContents';
import type { DocNavItem } from '../../../lib/docs-nav';

interface DocsPageLayoutProps {
  breadcrumb: { group: string; page: string } | null;
  headings: TocHeading[];
  nextPage: DocNavItem | null;
  children: React.ReactNode;
}

export function DocsPageLayout({
  breadcrumb,
  headings,
  nextPage,
  children,
}: DocsPageLayoutProps) {
  return (
    <>
      {/* Center prose column */}
      <main
        className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-8 max-w-3xl"
        id="doc-content"
      >
        {/* Breadcrumbs */}
        {breadcrumb && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm text-muted mb-6"
          >
            <span className="text-faint">{breadcrumb.group}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="text-faint shrink-0">
              <path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{breadcrumb.page}</span>
          </nav>
        )}

        {/* Doc content */}
        {children}

        {/* Footer: next page pager */}
        {nextPage && (
          <div className="mt-12 pt-8 border-t border-border">
            <Link
              href={nextPage.href}
              className="group flex items-center justify-between w-full px-4 py-4 rounded-md border border-border bg-surface hover:border-primary/40 hover:bg-raised transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
            >
              <div>
                <div className="text-2xs font-medium tracking-wider text-muted uppercase mb-1">
                  Next
                </div>
                <div className="text-sm font-medium text-text group-hover:text-primary transition-colors duration-(--metador-duration-fast)">
                  {nextPage.title}
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="text-muted group-hover:text-primary transition-colors duration-(--metador-duration-fast) shrink-0"
              >
                <path d="M5 3l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        )}
      </main>

      {/* Right TOC rail — xl+ only */}
      <TableOfContents headings={headings} />
    </>
  );
}
