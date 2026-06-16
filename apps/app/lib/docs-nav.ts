/**
 * docs-nav.ts
 * Parses apps/docs/SUMMARY.md into a typed nav tree.
 * SUMMARY format: `## Group` headings + `* [Title](relative/path.md)` links.
 * Group labels like `## — FOR DEVELOPERS —` are preserved verbatim.
 * Never hardcodes the tree — everything is derived from SUMMARY.md at request time.
 */
import fs from 'fs';
import path from 'path';

export interface DocNavItem {
  title: string;
  /** Absolute URL path e.g. /docs/concepts/the-vault */
  href: string;
  /** Relative path within apps/docs e.g. concepts/the-vault.md */
  filePath: string;
}

export interface DocNavGroup {
  label: string;
  /** True for uppercase section dividers like "— FOR DEVELOPERS —" */
  isDivider: boolean;
  items: DocNavItem[];
}

/** Resolve a relative SUMMARY.md link to its apps/docs filepath. */
function resolveRelative(rel: string): string {
  // SUMMARY.md links are relative to the apps/docs root.
  return path.normalize(rel).replace(/\\/g, '/');
}

/** Convert a docs-relative filepath to a /docs URL slug. */
export function filePathToHref(filePath: string): string {
  // strip .md, strip leading slash
  const slug = filePath.replace(/\.md$/, '').replace(/^\//, '');
  // README.md at root → /docs
  if (slug === 'README') return '/docs';
  return `/docs/${slug}`;
}

/** Parse SUMMARY.md into nav groups. Reads the file synchronously (server component). */
export function parseSummary(): DocNavGroup[] {
  const summaryPath = path.join(
    process.cwd(),
    '../../apps/docs/SUMMARY.md',
  );
  const raw = fs.readFileSync(summaryPath, 'utf8');
  const lines = raw.split('\n');

  const groups: DocNavGroup[] = [];
  let currentGroup: DocNavGroup | null = null;

  for (const line of lines) {
    // ## Group heading
    const groupMatch = /^##\s+(.+)$/.exec(line);
    if (groupMatch) {
      const labelRaw = groupMatch[1];
      if (!labelRaw) continue;
      const label = labelRaw.trim();
      const isDivider = label.startsWith('—') || label.startsWith('-');
      currentGroup = { label, isDivider, items: [] };
      groups.push(currentGroup);
      continue;
    }

    // * [Title](path.md) — nav item
    const itemMatch = /^\*\s+\[(.+?)\]\((.+?)\)/.exec(line);
    if (itemMatch && currentGroup) {
      const titleRaw = itemMatch[1];
      const rawPathRaw = itemMatch[2];
      if (!titleRaw || !rawPathRaw) continue;
      const title = titleRaw.trim();
      const rawPath = rawPathRaw.trim();
      const filePath = resolveRelative(rawPath);
      const href = filePathToHref(filePath);
      currentGroup.items.push({ title, href, filePath });
    }
  }

  return groups;
}

/** Resolve a /docs slug array back to the markdown filepath, or null if unknown. */
export function slugToFilePath(slug: string[]): string {
  if (!slug || slug.length === 0) return 'README.md';
  return slug.join('/') + '.md';
}

/** Read a doc markdown file. Returns null if not found. */
export function readDocFile(filePath: string): string | null {
  const docPath = path.join(
    process.cwd(),
    '../../apps/docs',
    filePath,
  );
  try {
    return fs.readFileSync(docPath, 'utf8');
  } catch {
    return null;
  }
}

/** Given a slug, find the nav item + its group for breadcrumb rendering. */
export function findNavItem(
  groups: DocNavGroup[],
  href: string,
): { group: DocNavGroup; item: DocNavItem } | null {
  for (const group of groups) {
    for (const item of group.items) {
      if (item.href === href) return { group, item };
    }
  }
  return null;
}

/** Get the next page in linear reading order. */
export function getNextPage(
  groups: DocNavGroup[],
  currentHref: string,
): DocNavItem | null {
  const allItems = groups.flatMap((g) => g.items);
  const idx = allItems.findIndex((i) => i.href === currentHref);
  if (idx === -1 || idx >= allItems.length - 1) return null;
  return allItems[idx + 1] ?? null;
}
