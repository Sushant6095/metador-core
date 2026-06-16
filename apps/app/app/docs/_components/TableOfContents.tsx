'use client';

/**
 * TableOfContents — right-rail, on-page TOC built from h2/h3 headings.
 * IntersectionObserver scroll-spies the active section (brass highlight).
 * Hidden below 1280px (the three-pane layout only opens at xl+).
 * Heading items extracted from the raw markdown via regex (server-safe input,
 * rendered here for scroll-spy interactivity).
 */
import * as React from 'react';
import type { TocHeading } from './toc-headings';

export type { TocHeading };

interface TableOfContentsProps {
  headings: TocHeading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>('');

  React.useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost heading that is currently intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const first = visible[0];
        if (first) {
          setActiveId(first.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      },
    );

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside
      className="hidden xl:flex flex-col w-55 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 pl-6"
      aria-label="On this page"
    >
      <p className="text-2xs font-medium tracking-wider text-muted uppercase mb-3 select-none">
        On this page
      </p>
      <nav aria-label="Table of contents">
        <ul role="list" className="flex flex-col gap-0.5">
          {headings.map((h) => {
            const isActive = activeId === h.id;
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={[
                    'block py-1 text-sm transition-colors duration-(--metador-duration-fast)',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg rounded-xs',
                    h.level === 3 ? 'pl-3' : 'pl-0',
                    isActive ? 'text-primary font-medium' : 'text-muted hover:text-text',
                  ].join(' ')}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
