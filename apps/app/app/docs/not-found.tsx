/**
 * /docs not-found — designed empty state for unknown doc slugs.
 * Rendered inside DocsLayoutShell's flex row, so we fill flex-1 and center.
 * Styled per Metador tokens: calm dark, brass accent, no raw hex.
 */
import Link from 'next/link';

export default function DocsNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <div
        className="font-mono font-medium mb-4"
        style={{
          fontSize: 'var(--metador-text-4xl)',
          color: 'var(--metador-primary)',
        }}
        aria-hidden="true"
      >
        404
      </div>
      <h1 className="font-display font-semibold text-2xl text-text mb-3">
        Page not found
      </h1>
      <p className="text-base text-muted mb-8 max-w-md leading-relaxed">
        This documentation page does not exist. It may have moved or the link
        may be incorrect.
      </p>
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium bg-primary text-on-primary hover:bg-primary-bright active:bg-primary-deep transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:ring-offset-bg"
      >
        Back to docs
      </Link>
    </div>
  );
}
