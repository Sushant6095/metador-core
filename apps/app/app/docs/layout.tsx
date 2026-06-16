/**
 * /docs layout — three-pane GitBook-style docs portal.
 * Left sidebar (260px) · Center content (max 720px) · Right TOC rail (220px, xl+)
 * Sidebar data from SUMMARY.md, parsed server-side.
 * The DocsLayoutShell client component handles mobile drawer state.
 */
import type { Metadata } from 'next';
import { parseSummary } from '../../lib/docs-nav';
import { DocsLayoutShell } from './_components/DocsLayoutShell';

export const metadata: Metadata = {
  title: {
    template: '%s — Metador Docs',
    default: 'Metador Docs',
  },
  description: 'Documentation for Metador — non-custodial strategy vaults on DeepBook / Sui.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  // Parse SUMMARY.md server-side — no client JS needed for the nav tree itself
  const groups = parseSummary();

  return <DocsLayoutShell groups={groups}>{children}</DocsLayoutShell>;
}
