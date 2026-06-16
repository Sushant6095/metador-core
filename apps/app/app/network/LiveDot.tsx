'use client';

/**
 * LiveDot — pulsing green dot + "LIVE" label + last-updated timestamp.
 * Opacity-only pulse (honors transform/opacity compositor rule).
 * Honors prefers-reduced-motion: pulse collapses to static.
 */

import * as React from 'react';

interface LiveDotProps {
  lastUpdatedMs?: number; // epoch ms; if omitted, uses a static label
}

export function LiveDot({ lastUpdatedMs }: LiveDotProps) {
  const [secondsAgo, setSecondsAgo] = React.useState(0);

  React.useEffect(() => {
    if (lastUpdatedMs == null) return;
    const update = () =>
      setSecondsAgo(Math.round((Date.now() - lastUpdatedMs) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedMs]);

  const label =
    lastUpdatedMs == null
      ? 'LIVE'
      : secondsAgo <= 1
      ? 'LIVE · just now'
      : `LIVE · updated ${secondsAgo}s ago`;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-muted"
      style={{ fontSize: 'var(--metador-text-2xs)', fontFamily: 'var(--metador-font-code)' }}
      aria-label={label}
      aria-live="polite"
    >
      <span
        className="shrink-0 rounded-full motion-safe:animate-pulse"
        style={{
          width: 7,
          height: 7,
          backgroundColor: 'var(--metador-success)',
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
