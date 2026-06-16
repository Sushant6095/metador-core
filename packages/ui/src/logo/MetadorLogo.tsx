/**
 * MetadorLogo — Metador brand mark + wordmark lockup.
 *
 * MetadorMark  — the charging-bull SVG mark, currentColor, inlined as JSX.
 * MetadorLogo  — mark + "Metador" wordmark, sized via the `size` prop.
 *
 * Design tokens only — no raw hex, no arbitrary values (CLAUDE.md §1).
 * The mark uses currentColor so callers can tint via text-primary etc.
 */

import * as React from 'react';

// ── MetadorMark ─────────────────────────────────────────────────────────────────

interface MetadorMarkProps {
  /** Rendered width and height in px. Default 24. */
  size?: number;
  className?: string;
  /**
   * Hides the element from assistive technology. Default true when used next
   * to visible text (MetadorLogo lockup). Pass false to make the mark the
   * accessible name bearer when rendered standalone.
   */
  'aria-hidden'?: boolean;
}

/**
 * The Metador monogram — a geometric "M" whose center dips into a keel point
 * (the keel-spine concept, ADR-010). A single even-width stroke in currentColor
 * so callers tint it (text-primary = mint-green) and it stays crisp and legible
 * down to 16px. Original geometry — not derived from any mark.
 */
export function MetadorMark({
  size = 24,
  className,
  'aria-hidden': ariaHidden = true,
}: MetadorMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden={ariaHidden || undefined}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : 'Metador'}
      focusable="false"
    >
      {/* Geometric "M" with a center keel point — even stroke, currentColor. */}
      <path
        d="M5 24 V8.5 L16 20.5 L27 8.5 V24"
        stroke="currentColor"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ── MetadorLogo ─────────────────────────────────────────────────────────────────

type LogoSize = 'sm' | 'md';

interface MetadorLogoProps {
  /**
   * sm — nav context: mark 20px, text-lg wordmark.
   * md — hero context: mark 28px, text-xl wordmark.
   * Default: sm.
   */
  size?: LogoSize;
  className?: string;
  /**
   * Neutralise the mark glyph to text color instead of brass. Use where the
   * amber budget (elevation-spec §3.2) is already spent in the same row — e.g.
   * a nav whose CTA is brass: the logo mark goes neutral so brass stays ≤2 per
   * viewport. Default false (mark keeps its brass fill).
   */
  neutralMark?: boolean;
}

/** Mark pixel sizes per lockup variant */
const MARK_SIZE: Record<LogoSize, number> = {
  sm: 20,
  md: 28,
};

/** Tailwind text-* class per lockup variant */
const TEXT_CLASS: Record<LogoSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
};

/**
 * Mark + "Metador" wordmark lockup.
 *
 * The accessible name "Metador" lives on the consumer-provided link wrapper.
 * The mark is aria-hidden (decorative alongside the visible word); the
 * wordmark span is also aria-hidden so screen readers read it once from the
 * link label, not twice.
 *
 * Usage:
 * ```tsx
 * <Link href="/" aria-label="Metador — home">
 *   <MetadorLogo size="sm" />
 * </Link>
 * ```
 */
export function MetadorLogo({ size = 'sm', className, neutralMark = false }: MetadorLogoProps) {
  return (
    <span
      className={[
        'inline-flex items-center',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ gap: '8px' }}
      aria-hidden="true"
    >
      {/* Mark — brass by default; neutral (text color) when the row's amber
          budget is already spent (elevation-spec §3.2). */}
      <MetadorMark
        size={MARK_SIZE[size]}
        className={`${neutralMark ? 'text-text' : 'text-primary'} shrink-0`}
        aria-hidden={true}
      />
      {/* Wordmark — display face, text color */}
      <span
        className={[
          TEXT_CLASS[size],
          'font-semibold leading-none text-text',
        ].join(' ')}
        style={{ fontFamily: 'var(--metador-font-display)', letterSpacing: '-0.01em' }}
      >
        Metador
      </span>
    </span>
  );
}
