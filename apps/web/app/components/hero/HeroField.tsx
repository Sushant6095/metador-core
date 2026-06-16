'use client';

/**
 * HeroField — living organic brass field for the hero (founder PARITY directive,
 * 2026-06-14: "same dynamic effects"). This is the Metador-brand equivalent of the
 * Hyperliquid hero's morphing metaball field — a benchmark CALIBER match, never
 * their palette (brass on slate, not green) and never their assets (CLAUDE.md §8).
 *
 * Technique (deliberately NOT WebGL / NOT their Spline):
 *   - 4 pre-blurred brass radial blobs over the deep-slate base.
 *   - mix-blend-mode:screen → where blobs overlap they add luminosity, so the
 *     soft blurred edges glow-MERGE like metaballs. Pure CSS, no goo filter
 *     re-raster per frame.
 *   - Only `transform` (translate/scale) + `opacity` animate → the whole field
 *     stays on the compositor at 60fps (rules/performance.md; CLAUDE.md §4).
 *   - Slow, desynced drift (22–34s) reads as one calm living surface, not a
 *     loop. No hue shift — luminosity/position only (DESIGN.md #motion).
 *
 * Motion-budget note: choreography.md §4 caps ambient movers at one. The founder
 * parity directive explicitly overrides that for the hero — the living field IS
 * the requested effect. Scoped to the hero only; the rest of the site keeps §4.
 *
 * Safety:
 *   - prefers-reduced-motion → blobs render at rest (still a rich composition),
 *     zero animation.
 *   - aria-hidden, pointer-events:none — never intercepts or announces.
 *   - LCP-safe: divs only (no media), layered above the instant base grade.
 */

import { motion, useReducedMotion } from 'motion/react';

interface Blob {
  /** Stable key + label. */
  id: string;
  /** Diameter as viewport width, clamped by maxPx so it never dominates 4K. */
  sizeVw: number;
  maxPx: number;
  /** Center alpha of the brass radial (over slate, screen-blended). */
  alpha: number;
  /** Resting anchor (percent of the field box). */
  left: string;
  top: string;
  /** Drift keyframes — transform only (compositor-friendly). */
  x: number[];
  y: number[];
  scale: number[];
  opacity: number[];
  /** Seconds for one full drift cycle; desynced across blobs. */
  duration: number;
}

/**
 * Four weights: a dominant top-right cluster (mirrors the benchmark's bright
 * mass), a deep low-left anchor, a roaming mid blob, and a small bright accent
 * lower-left. Alphas tuned so screen-blend overlaps glow without blowing out.
 */
const BLOBS: readonly Blob[] = [
  {
    id: 'mass-tr',
    sizeVw: 52,
    maxPx: 760,
    alpha: 0.26,
    left: '64%',
    top: '12%',
    x: [0, 36, -18, 0],
    y: [0, 26, -14, 0],
    scale: [1, 1.12, 0.94, 1],
    opacity: [0.9, 1, 0.82, 0.9],
    duration: 26,
  },
  {
    id: 'anchor-bl',
    sizeVw: 40,
    maxPx: 560,
    alpha: 0.13,
    left: '-8%',
    top: '58%',
    x: [0, -22, 18, 0],
    y: [0, 18, -22, 0],
    scale: [1, 1.08, 0.96, 1],
    opacity: [0.7, 0.9, 0.65, 0.7],
    duration: 34,
  },
  {
    id: 'roam-mid',
    sizeVw: 34,
    maxPx: 460,
    alpha: 0.16,
    left: '34%',
    top: '40%',
    x: [0, 60, -40, 0],
    y: [0, -34, 28, 0],
    scale: [0.96, 1.14, 0.9, 0.96],
    opacity: [0.6, 0.85, 0.55, 0.6],
    duration: 30,
  },
  {
    id: 'accent-bl',
    sizeVw: 22,
    maxPx: 320,
    alpha: 0.22,
    left: '10%',
    top: '74%',
    x: [0, 28, -16, 0],
    y: [0, -22, 14, 0],
    scale: [1, 1.18, 0.92, 1],
    opacity: [0.55, 0.9, 0.5, 0.55],
    duration: 22,
  },
] as const;

export function HeroField() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        // Isolate the screen blend to this field (not the layers below it).
        isolation: 'isolate',
      }}
    >
      {BLOBS.map((blob) => {
        const base = {
          position: 'absolute' as const,
          left: blob.left,
          top: blob.top,
          width: `${blob.sizeVw}vw`,
          height: `${blob.sizeVw}vw`,
          maxWidth: blob.maxPx,
          maxHeight: blob.maxPx,
          borderRadius: 'var(--metador-radius-full)',
          background: `radial-gradient(circle at center, rgba(var(--metador-primary-rgb), ${blob.alpha}) 0%, transparent 66%)`,
          filter: 'blur(44px)',
          mixBlendMode: 'screen' as const,
          willChange: 'transform, opacity',
        };

        if (reducedMotion) {
          // At rest: mid-keyframe scale, base opacity — a rich static field.
          return <div key={blob.id} style={base} />;
        }

        return (
          <motion.div
            key={blob.id}
            style={base}
            animate={{
              x: blob.x,
              y: blob.y,
              scale: blob.scale,
              opacity: blob.opacity,
            }}
            transition={{
              duration: blob.duration,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        );
      })}
    </div>
  );
}
