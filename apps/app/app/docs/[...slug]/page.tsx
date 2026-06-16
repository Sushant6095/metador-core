/**
 * /docs/[...slug] — dynamic doc page renderer.
 * Maps slug segments to apps/docs/**\/slug.md.
 * e.g. /docs/concepts/the-vault → apps/docs/concepts/the-vault.md
 * 404 for unknown slugs (designed empty state via notFound()).
 */
import { notFound } from 'next/navigation';
import {
  parseSummary,
  readDocFile,
  slugToFilePath,
  findNavItem,
  filePathToHref,
  getNextPage,
} from '../../../lib/docs-nav';
import { extractHeadings } from '../_components/toc-headings';
import { DocsPageLayout } from '../_components/DocsPageLayout';
import { MarkdownRenderer } from '../_components/MarkdownRenderer';

interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const groups = parseSummary();

  // Resolve slug → filepath → content
  const filePath = slugToFilePath(slug);
  const content = readDocFile(filePath);

  // If file not found → 404 with designed empty state
  if (!content) notFound();

  const headings = extractHeadings(content);
  const currentHref = filePathToHref(filePath);
  const navMatch = findNavItem(groups, currentHref);
  const nextPage = getNextPage(groups, currentHref);

  const breadcrumb = navMatch
    ? { group: navMatch.group.label, page: navMatch.item.title }
    : null;

  return (
    <DocsPageLayout
      breadcrumb={breadcrumb}
      headings={headings}
      nextPage={nextPage}
    >
      <MarkdownRenderer content={content} />
    </DocsPageLayout>
  );
}

/**
 * Generate static params from SUMMARY.md so Next.js can pre-render all doc
 * pages at build time (optional optimization; not required for demo which runs
 * `next dev`).
 */
export async function generateStaticParams() {
  const groups = parseSummary();
  const allItems = groups.flatMap((g) => g.items);

  return allItems
    .map((item) => {
      // /docs → no slug; /docs/concepts/the-vault → ['concepts','the-vault']
      if (item.href === '/docs') return null;
      const slug = item.href.replace(/^\/docs\//, '').split('/');
      return { slug };
    })
    .filter((p): p is { slug: string[] } => p !== null);
}
