import { redirect } from 'next/navigation';

/**
 * Docs entry point. The developer docs live in `apps/docs` as a Git-synced
 * GitBook space (.gitbook.yaml), not a Next.js route — so /docs redirects to the
 * published docs. URL is env-configurable (`NEXT_PUBLIC_DOCS_URL`); until the
 * GitBook space is published it falls back to the docs source on GitHub, which
 * renders the SUMMARY tree and pages directly.
 */
const DOCS_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ??
  'https://github.com/Sushant6095/metador-core/tree/main/apps/docs';

export default function DocsRedirect() {
  redirect(DOCS_URL);
}
