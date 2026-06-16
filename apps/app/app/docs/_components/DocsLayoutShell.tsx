'use client';

/**
 * DocsLayoutShell — client boundary for the three-pane docs layout.
 * Left sidebar (260px) · Center+Right slot (flex-1).
 * The center+right column is the children slot — each page renders its own
 * content + TOC rail side by side using the DocsPageLayout wrapper below.
 */
import * as React from 'react';
import type { DocNavGroup } from '../../../lib/docs-nav';
import { DocsSidebar } from './DocsSidebar';
import { DocsSearch } from './DocsSearch';

interface DocsLayoutShellProps {
  groups: DocNavGroup[];
  children: React.ReactNode;
}

export function DocsLayoutShell({ groups, children }: DocsLayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    /*
     * We sit inside <main> which has px-4 py-8 — negate that to control our own inset.
     */
    <div className="flex min-h-[calc(100vh-3.5rem)] -mx-4 -my-8">
      {/* Left sidebar */}
      <DocsSidebar
        groups={groups}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Center + right column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Docs top bar — mobile hamburger + search */}
        <div
          className="sticky top-14 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-bg"
          style={{ zIndex: 'var(--metador-z-elevated)' }}
        >
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-1.5 rounded-xs text-muted hover:text-text transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open documentation navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Search — right-aligned */}
          <div className="ml-auto">
            <DocsSearch groups={groups} />
          </div>
        </div>

        {/* Page + TOC area — flex row; each page provides its own TOC rail */}
        <div className="flex flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
