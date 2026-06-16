/**
 * /docs — root page, renders apps/docs/README.md.
 * Server component: reads the file at request time (Next.js dev safe).
 * outputFileTracingRoot is set to repo root in next.config.ts so the path
 * ../../apps/docs resolves correctly from process.cwd() = apps/app.
 */
import { notFound } from 'next/navigation';
import {
  parseSummary,
  readDocFile,
  findNavItem,
  getNextPage,
} from '../../lib/docs-nav';
import { extractHeadings } from './_components/toc-headings';
import { DocsPageLayout } from './_components/DocsPageLayout';
import { MarkdownRenderer } from './_components/MarkdownRenderer';

export default function DocsRootPage() {
  const groups = parseSummary();
  const content = readDocFile('README.md');

  if (!content) notFound();

  const headings = extractHeadings(content);
  const navMatch = findNavItem(groups, '/docs');
  const nextPage = getNextPage(groups, '/docs');

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
