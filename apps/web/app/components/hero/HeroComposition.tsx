'use client';

/**
 * HeroComposition — full-viewport graded dark video/Spline SLOT for the hero
 * (landing premium pass, founder build-list #1).
 *
 * This replaces the benched brass armature (ArmatureScene/Slot/Poster, kept
 * on disk). It is a graded dark COMPOSITION that reads expensive at first
 * paint and is ready to swap in a founder-supplied asset:
 *
 *   - data-hero-slot="poster" container, position:absolute inset:0, holds the
 *     swap-in surface. When a founder asset lands, drop a <video> (poster +
 *     muted/loop/playsInline) or a lazy <Spline> here; the gradient grade and
 *     vignette already frame it.
 *   - Layered radial gradients from --metador-primary-rgb at low alpha over the
 *     deep slate base (atmosphere), then a living <HeroField/> — drifting brass
 *     metaballs that glow-merge (transform/opacity only, reduced-motion =
 *     static). This is the Metador-brand match for the benchmark's morphing hero
 *     (founder parity directive, 2026-06-14).
 *   - The page-level .metador-grain (layout.tsx) gives the slate tooth on top.
 *   - Bottom vignette (in HeroSection) so the type sits on calm ground.
 *
 * No hue shift, luminosity only (DESIGN.md #motion). No WebGL, no Three.js —
 * pure CSS grade, so first paint is the composition (LCP-safe, CLS 0).
 */

import { HeroField } from './HeroField';

export function HeroComposition() {
  return (
    <div
      data-hero-slot="poster"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        // z2 per HeroSection layer order (above .metador-field z1, below vignette z3)
      }}
    >
      {/*
       * FOUNDER ASSET SWAP POINT.
       * Drop the hero asset here when supplied. Examples:
       *   <video data-hero-slot="asset" autoPlay muted loop playsInline
       *          poster="/hero-poster.jpg" style={{position:'absolute',inset:0,
       *          width:'100%',height:'100%',objectFit:'cover',opacity:0.9}}>
       *     <source src="/hero.webm" type="video/webm" />
       *   </video>
       * or a lazy-loaded Spline scene. The grade below already frames it; keep
       * the asset behind the gradients/vignette so the type stays legible.
       */}

      {/* Deep-slate base grade — radial wash so the composition is not a flat slab */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 90% at 72% 18%, color-mix(in srgb, var(--metador-surface) 70%, var(--metador-bg)) 0%, var(--metador-bg) 62%)',
        }}
      />

      {/* Layered brass radials from --metador-primary-rgb at low alpha (atmosphere) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(46% 42% at 74% 34%, rgba(var(--metador-primary-rgb), 0.10) 0%, transparent 64%),' +
            'radial-gradient(60% 55% at 88% 12%, rgba(var(--metador-primary-rgb), 0.05) 0%, transparent 70%),' +
            'radial-gradient(70% 60% at 8% 92%, rgba(var(--metador-primary-rgb), 0.04) 0%, transparent 72%)',
        }}
      />

      {/* Living organic brass field — drifting metaballs that glow-merge.
          The Metador-brand equivalent of the benchmark's morphing hero (founder
          parity directive). Transform/opacity only; reduced-motion = static. */}
      <HeroField />
    </div>
  );
}
