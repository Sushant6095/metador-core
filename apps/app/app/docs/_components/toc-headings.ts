/**
 * Server-safe TOC heading extraction. Pure string parsing — no 'use client',
 * so server components (the docs pages) can call extractHeadings() and pass the
 * result into the client TableOfContents for scroll-spy. (A client-module export
 * cannot be invoked from the server.)
 */

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Extract h2/h3 headings from raw markdown, skipping fenced code blocks. */
export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = markdown.split('\n');
  let inFence = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const h2 = /^##\s+(.+)$/.exec(line);
    const h3 = /^###\s+(.+)$/.exec(line);

    if (h2 && h2[1]) {
      const text = h2[1].replace(/\[(.+?)\]\(.+?\)/g, '$1').trim();
      // Mirror rehype-slug's id generation: lowercase, strip punctuation, spaces→dashes.
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      headings.push({ id, text, level: 2 });
    } else if (h3 && h3[1]) {
      const text = h3[1].replace(/\[(.+?)\]\(.+?\)/g, '$1').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      headings.push({ id, text, level: 3 });
    }
  }

  return headings;
}
