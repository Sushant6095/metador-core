'use client';

/**
 * HeroField — living organic mint field for the hero (ADR-010 green identity).
 * Metador-brand equivalent of the benchmark's morphing hero field — caliber match,
 * never their assets (CLAUDE.md §8).
 *
 * Technique:
 *   - 4 pre-blurred mint radial blobs over the deep-slate base.
 *   - mix-blend-mode:screen → overlapping edges glow-merge like metaballs.
 *     Pure CSS, no goo filter re-raster per frame.
 *   - Only `transform` (translate/scale) + `opacity` animate → compositor at 60fps
 *     (DESIGN.md #motion; CLAUDE.md §4).
 *   - Slow, desynced drift (22–34s) reads as one calm living surface, not a loop.
 *     No hue shift — luminosity/position only.
 *   - Alphas tuned for mint-on-dark: mint (#50d2c1) is lighter than brass and
 *     blooms faster on screen blend; alphas reduced vs the brass ramp to avoid
 *     blowout on the cold slate (#0a0e14).
 *
 * Safety:
 *   - prefers-reduced-motion → blobs render at rest (rich static composition).
 *   - aria-hidden, pointer-events:none.
 *   - LCP-safe: divs only (no media).
 */

import { motion, useReducedMotion } from 'motion/react';

interface Blob {
  /** Stable key + label. */
  id: string;
  /** Diameter as viewport width, clamped by maxPx so it never dominates 4K. */
  sizeVw: number;
  maxPx: number;
  /** Center alpha of the mint radial (over slate, screen-blended). */
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
 * Four weights: a dominant top-right cluster, a deep low-left anchor, a roaming
 * mid blob, and a small bright accent lower-left.
 * Alphas tuned for mint-on-dark: mint is brighter than brass on screen blend;
 * values are reduced (0.10–0.16) to avoid blowout on #0a0e14.
 */
const BLOBS: readonly Blob[] = [
  {
    id: 'mass-tr',
    sizeVw: 52,
    maxPx: 760,
    alpha: 0.14,
    left: '62%',
    top: '10%',
    x: [0, 38, -20, 0],
    y: [0, 28, -16, 0],
    scale: [1, 1.1, 0.95, 1],
    opacity: [0.85, 1, 0.78, 0.85],
    duration: 26,
  },
  {
    id: 'anchor-bl',
    sizeVw: 44,
    maxPx: 580,
    alpha: 0.08,
    left: '-10%',
    top: '56%',
    x: [0, -24, 16, 0],
    y: [0, 20, -24, 0],
    scale: [1, 1.07, 0.97, 1],
    opacity: [0.65, 0.82, 0.60, 0.65],
    duration: 34,
  },
  {
    id: 'roam-mid',
    sizeVw: 36,
    maxPx: 480,
    alpha: 0.10,
    left: '32%',
    top: '42%',
    x: [0, 56, -38, 0],
    y: [0, -32, 26, 0],
    scale: [0.97, 1.12, 0.91, 0.97],
    opacity: [0.55, 0.80, 0.50, 0.55],
    duration: 30,
  },
  {
    id: 'accent-bl',
    sizeVw: 24,
    maxPx: 340,
    alpha: 0.16,
    left: '8%',
    top: '72%',
    x: [0, 26, -14, 0],
    y: [0, -20, 12, 0],
    scale: [1, 1.15, 0.93, 1],
    opacity: [0.50, 0.85, 0.45, 0.50],
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
