'use client';

/**
 * LenisProvider — Lenis ^1.3 smooth scroll wired for the landing page.
 *
 * - Initialises once on mount; destroys on unmount.
 * - No-ops entirely under prefers-reduced-motion (Lenis + Motion scroll
 *   triggers must both be inert — DESIGN.md #motion, CLAUDE.md §4).
 * - Uses Lenis RAF integration so the scroll driver stays on the main thread
 *   and Motion scroll-linked values stay in sync.
 * - Does NOT use `lerp` smoothing when reduced-motion is active (instant
 *   scroll, no kinetic feel).
 *
 * Usage: wrap the <main> content in layout.tsx (or page.tsx) to enable
 * smooth scroll for the whole landing surface.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion — Lenis must not run.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    // Expose lenis instance on window so Motion scroll hooks can access it
    // via the lenis `on('scroll')` event if needed in future.
    // (We do not use window here — RAF is sufficient for landing.)

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
