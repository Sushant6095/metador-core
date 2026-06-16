'use client';

/**
 * DocsSidebar — sticky left nav for the docs portal.
 * Groups from SUMMARY.md, active page brass-highlighted with left tick.
 * Collapses to a drawer at mobile (controlled externally via isOpen/onClose).
 * Uppercase section dividers (isDivider) are non-interactive labels.
 */
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DocNavGroup } from '../../../lib/docs-nav';

interface DocsSidebarProps {
  groups: DocNavGroup[];
  /** Mobile: whether the drawer is open */
  isOpen?: boolean;
  /** Mobile: called to close the drawer */
  onClose?: () => void;
}

function SidebarContent({
  groups,
  pathname,
  onClose,
}: {
  groups: DocNavGroup[];
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <nav aria-label="Documentation navigation" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          {group.isDivider ? (
            /* Uppercase section divider — non-clickable audience separator */
            <div
              className="px-3 mb-2 text-2xs font-medium tracking-widest text-faint uppercase select-none"
              aria-hidden="true"
            >
              {group.label}
            </div>
          ) : (
            /* Regular group label */
            <div className="px-3 mb-1 text-2xs font-medium tracking-wider text-muted uppercase select-none">
              {group.label}
            </div>
          )}

          <ul role="list" className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive =
                item.href === '/docs'
                  ? pathname === '/docs'
                  : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'relative flex items-center px-3 py-1.5 text-sm rounded-xs',
                      'transition-colors duration-(--metador-duration-fast)',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
                      isActive
                        ? 'text-primary font-medium bg-primary/8'
                        : 'text-muted hover:text-text hover:bg-raised',
                    ].join(' ')}
                  >
                    {/* Left brass tick for active page */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--metador-primary)' }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="ml-2">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsSidebar({ groups, isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar — sticky, 260px wide, visible at md+ */}
      <aside
        className="hidden md:flex flex-col w-65 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 pr-4 border-r border-border"
        aria-label="Docs sidebar"
      >
        <SidebarContent groups={groups} pathname={pathname} />
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 flex"
          style={{ zIndex: 'var(--metador-z-modal)' }}
        >
          {/* Scrim */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--metador-overlay)' }}
            aria-hidden="true"
            onClick={onClose}
          />
          {/* Drawer panel */}
          <aside
            className="relative w-70 max-w-[85vw] h-full bg-surface border-r border-border overflow-y-auto py-6 px-4"
            style={{ boxShadow: 'var(--metador-shadow-modal)' }}
            aria-label="Docs navigation drawer"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="absolute top-4 right-4 p-1 text-muted hover:text-text transition-colors duration-(--metador-duration-fast) rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div className="mt-2">
              <SidebarContent groups={groups} pathname={pathname} onClose={onClose} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
