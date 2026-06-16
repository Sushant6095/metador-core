/**
 * remark-docs-links.ts
 * Remark plugin that rewrites internal `.md` links to /docs/* routes.
 * e.g. `[x](concepts/the-vault.md)` → `/docs/concepts/the-vault`
 *      `[x](../for-savers/risks.md)` → `/docs/for-savers/risks`
 * External links are left unchanged.
 */
import type { Root, Link } from 'mdast';
import { visit } from 'unist-util-visit';

/** Convert a relative .md path to an absolute /docs href. */
function rewriteLink(url: string, sourcePath?: string): string {
  // External links: keep as-is
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('//')
  ) {
    return url;
  }
  // Anchor-only: keep
  if (url.startsWith('#')) return url;

  // Strip fragment for processing, re-attach after
  const hashIdx = url.indexOf('#');
  const fragment = hashIdx !== -1 ? url.slice(hashIdx) : '';
  const pathPart = hashIdx !== -1 ? url.slice(0, hashIdx) : url;

  // Not a .md link — pass through
  if (!pathPart.endsWith('.md')) return url;

  // Resolve from the source doc's directory if a sourcePath is provided.
  let resolved = pathPart;
  if (sourcePath && !pathPart.startsWith('/')) {
    const dir = sourcePath.split('/').slice(0, -1).join('/');
    const joined = dir ? `${dir}/${pathPart}` : pathPart;
    const parts = joined.split('/');
    const stack: string[] = [];
    for (const p of parts) {
      if (p === '..') stack.pop();
      else if (p !== '.') stack.push(p);
    }
    resolved = stack.join('/');
  }

  // Strip .md and README → bare /docs
  const slug = resolved.replace(/\.md$/, '').replace(/^\//, '');
  const href = slug === 'README' || slug === '' ? '/docs' : `/docs/${slug}`;
  return href + fragment;
}

export function remarkDocsLinks(sourcePath?: string) {
  return function (tree: Root) {
    visit(tree, 'link', (node: Link) => {
      node.url = rewriteLink(node.url, sourcePath);
    });
  };
}
