'use client';

/**
 * useVirtualRows — minimal fixed-height windowed list for the screener table.
 *
 * Plain React, no dependency. Renders only the rows intersecting the scroll
 * viewport (+ overscan), padded by two spacer rows so total scroll height and
 * scroll position are exact. Keeps DOM row count bounded (≤ window + overscan)
 * regardless of dataset size, so a 500+ row leaderboard scrolls at 60fps.
 *
 * Compositor-friendly: we only mutate React state on scroll (throttled to one
 * update per animation frame); the spacer <td> heights drive layout, never a
 * per-row transform.
 */

import * as React from 'react';

export interface VirtualRange {
  /** First visible row index (inclusive). */
  start: number;
  /** Last visible row index (exclusive). */
  end: number;
  /** Pixel height of the top spacer (rows above the window). */
  padTop: number;
  /** Pixel height of the bottom spacer (rows below the window). */
  padBottom: number;
}

export interface UseVirtualRowsOptions {
  /** Total number of rows in the dataset. */
  count: number;
  /** Fixed pixel height of every row. */
  rowHeight: number;
  /** Visible viewport height in pixels. */
  viewportHeight: number;
  /** Extra rows rendered above/below the window (default 8). */
  overscan?: number;
}

const DEFAULT_OVERSCAN = 8;

export function computeRange(
  scrollTop: number,
  { count, rowHeight, viewportHeight, overscan = DEFAULT_OVERSCAN }: UseVirtualRowsOptions,
): VirtualRange {
  if (count === 0 || rowHeight <= 0 || viewportHeight <= 0) {
    return { start: 0, end: count, padTop: 0, padBottom: 0 };
  }
  const firstVisible = Math.floor(scrollTop / rowHeight);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(count, firstVisible + visibleCount + overscan);
  const padTop = start * rowHeight;
  const padBottom = (count - end) * rowHeight;
  return { start, end, padTop, padBottom };
}

export interface UseVirtualRowsResult extends VirtualRange {
  /** Attach to the scrollable container. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Measured viewport height (px) — null until first measure. */
  measuredHeight: number;
}

/**
 * Hook variant: measures the scroll container, tracks scroll position via
 * requestAnimationFrame throttling, returns the active window range.
 */
export function useVirtualRows(
  count: number,
  rowHeight: number,
  fallbackViewport = 720,
  overscan = DEFAULT_OVERSCAN,
): UseVirtualRowsResult {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [measuredHeight, setMeasuredHeight] = React.useState(fallbackViewport);
  const frame = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => setMeasuredHeight(el.clientHeight || fallbackViewport);
    measure();

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        setScrollTop(el.scrollTop);
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [fallbackViewport]);

  const range = computeRange(scrollTop, {
    count,
    rowHeight,
    viewportHeight: measuredHeight,
    overscan,
  });

  return { ...range, scrollRef, measuredHeight };
}
