'use client';

/**
 * HeroComposition — full-viewport graded dark video/Spline SLOT for the hero.
 * ADR-010 green identity: mint radials replace the old brass radials.
 *
 * Structure (back→front):
 *   - data-hero-slot="poster" swap-in surface (video/Spline goes here).
 *   - Deep-slate base grade: radial wash, not a flat slab.
 *   - Layered mint radials from --metador-primary-rgb at low alpha (atmosphere).
 *     Alphas tuned for mint-on-dark to avoid blowout (lighter hue = lower alpha).
 *   - HeroField — living mint metaballs (transform/opacity, reduced-motion=static).
 *   - .metador-grain (layout.tsx) adds slate tooth above all layers.
 *   - Bottom vignette (in HeroSection) so type sits on calm ground.
 *
 * LCP-safe: pure CSS gradients, instant first paint. CLS 0 (position:absolute).
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

      {/* Layered mint radials from --metador-primary-rgb at low alpha (atmosphere).
          Alphas reduced vs brass ramp: mint is lighter, blooms faster on dark. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(46% 42% at 74% 34%, rgba(var(--metador-primary-rgb), 0.07) 0%, transparent 64%),' +
            'radial-gradient(60% 55% at 88% 12%, rgba(var(--metador-primary-rgb), 0.04) 0%, transparent 70%),' +
            'radial-gradient(70% 60% at 8% 92%, rgba(var(--metador-primary-rgb), 0.03) 0%, transparent 72%)',
        }}
      />

      {/* Living organic mint field — drifting metaballs that glow-merge.
          Metador-brand match for the benchmark's morphing hero (ADR-010 green).
          Transform/opacity only; reduced-motion = static. */}
      <HeroField />
    </div>
  );
}
