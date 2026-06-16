'use client';

/**
 * DocsSearch — ⌘K command palette over doc page titles + headings.
 * Uses cmdk. Navigates to the selected doc page.
 * Themed exclusively via --metador-* tokens. No raw hex.
 */
import * as React from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import type { DocNavGroup } from '../../../lib/docs-nav';

interface DocsSearchProps {
  groups: DocNavGroup[];
}

interface SearchItem {
  title: string;
  href: string;
  group: string;
}

export function DocsSearch({ groups }: DocsSearchProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Flatten all nav items for search
  const items: SearchItem[] = groups.flatMap((group) =>
    group.items.map((item) => ({
      title: item.title,
      href: item.href,
      group: group.label,
    })),
  );

  // ⌘K / Ctrl+K to open
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Trigger button — visible in docs header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search documentation (⌘K)"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border bg-raised text-muted text-sm hover:text-text hover:border-primary/40 transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search docs…</span>
        <kbd
          className="hidden sm:inline-flex items-center gap-0.5 text-2xs text-faint border border-border rounded-xs px-1 py-0.5"
          aria-label="Command K"
        >
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      {/* Command palette modal */}
      {open && (
        <div
          className="fixed inset-0 flex items-start justify-center pt-[15vh]"
          style={{ zIndex: 'var(--metador-z-modal)', backgroundColor: 'var(--metador-overlay)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-xl mx-4 rounded-lg border border-border bg-surface overflow-hidden"
            style={{ boxShadow: 'var(--metador-shadow-modal)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
          >
            <Command label="Search documentation">
              <div className="flex items-center border-b border-border px-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-muted shrink-0">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <Command.Input
                  autoFocus
                  placeholder="Search docs…"
                  className="flex-1 bg-transparent text-text text-sm py-4 px-3 outline-none placeholder:text-muted"
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                  }}
                />
                <kbd
                  className="text-2xs text-faint border border-border rounded-xs px-1.5 py-0.5 cursor-pointer"
                  onClick={() => setOpen(false)}
                  role="button"
                  tabIndex={0}
                  aria-label="Close"
                  onKeyDown={(e) => { if (e.key === 'Enter') setOpen(false); }}
                >
                  Esc
                </kbd>
              </div>

              <Command.List className="max-h-90 overflow-y-auto py-2">
                <Command.Empty className="py-8 text-center text-sm text-muted">
                  No pages found.
                </Command.Empty>

                {groups.map((group) => {
                  const groupItems = items.filter((i) => i.group === group.label);
                  if (groupItems.length === 0) return null;
                  return (
                    <Command.Group
                      key={group.label}
                      heading={group.label}
                      className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:select-none"
                    >
                      {groupItems.map((item) => (
                        <Command.Item
                          key={item.href}
                          value={item.title}
                          onSelect={() => handleSelect(item.href)}
                          className="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xs text-sm text-text cursor-pointer transition-colors duration-(--metador-duration-fast) aria-selected:bg-raised aria-selected:text-primary data-[selected=true]:bg-raised"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="text-muted shrink-0">
                            <path d="M2 2h7l3 3v7H2V2z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                            <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                          </svg>
                          {item.title}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
