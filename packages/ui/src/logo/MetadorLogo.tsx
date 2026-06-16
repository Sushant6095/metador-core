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
 * The charging-bull mark — Metador's emblem: a bull at full charge, head
 * lowered, horns thrust forward, tail up. A bold filled silhouette in
 * currentColor so callers tint it (text-primary = brass) and it stays crisp
 * down to 16px. Original art — our own geometry, not derived from any mark.
 */
export function MetadorMark({
  size = 24,
  className,
  'aria-hidden': ariaHidden = true,
}: MetadorMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden={ariaHidden || undefined}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : 'Metador'}
      focusable="false"
    >
      {/* Charging bull — composed silhouette (body + shoulder hump, lowered
          horned head, raised tail, galloping legs). Filled shapes union into
          one solid mark; currentColor tints the whole thing. */}
      <g fill="currentColor" stroke="none">
        {/* body + powerful shoulder hump, back sloping to the rump */}
        <path d="M9 30 Q11 21 22 20 Q29 15 38 18 Q44 20 46 26 L45 34 Q44 39 38 41 Q24 44 16 40 Q10 37 9 30 Z" />
        {/* lowered head + muzzle, charging down to the right */}
        <path d="M45 25 Q53 25 57 31 L60 39 Q60 42 56 41 L49 39 Q44 36 44 30 Z" />
        {/* horns — twin forward sweep (the anger) */}
        <path d="M50 26 Q57 19 63 17 Q60 21 56 27 Q53 28 50 26 Z" />
        <path d="M49 28 Q54 23 60 22 Q57 26 53 30 Q51 30 49 28 Z" />
        {/* tail flicked up over the rump */}
        <path d="M12 30 Q6 25 8 15 Q10 17 11 24 Q13 28 14 31 Z" />
        {/* legs — gallop stagger: front pair reaching, hind pair driving */}
        <path d="M42 39 L48 55 L45 56 L39 40 Z" />
        <path d="M38 40 L38 57 L41 57 L42 40 Z" />
        <path d="M22 40 L24 57 L21 57 L19 40 Z" />
        <path d="M17 39 L11 54 L14 55 L20 40 Z" />
      </g>
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
