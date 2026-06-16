'use client';

/**
 * HeroSection — full-viewport graded dark composition (landing premium pass).
 * Caliber bar: hyperfoundation founder-shots — a monumental Inter claim on an
 * atmospheric dark field in the green identity (ADR-010).
 *
 * Z-layers (back→front):
 *   z0: --metador-bg base
 *   z1: .metador-field atmosphere gradients
 *   z2: HeroComposition — full-bleed graded dark video/Spline SLOT
 *   z3: .metador-vignette-bottom — depth fog so type sits on calm ground
 *   z4: content column — center-anchored, vertically centered, monumental type
 *
 * Green mint budget (≤2 primary per viewport, elevation-spec §3):
 *   - ONE headline accent word in mint (the verb "can't")
 *   - ONE CTA fill in mint (primary CTA)
 *   - Everything else: --metador-text / --metador-muted / --metador-faint
 *
 * Hero type:
 *   - Inter clamp(3rem, 5.6vw, 5.5rem), line-height 0.97, tracking -0.04em
 *   - white-dominant; mint on at most one word
 *   - eyebrow caps; two CTAs (mint primary + ghost secondary)
 */

import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import { HeroComposition } from './HeroComposition';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

export function HeroSection() {
  const reducedMotion = useReducedMotion();

  function revealTransition(delaySeconds: number) {
    return {
      duration: DURATIONS_S.hero,
      ease: EASE_ENTER,
      delay: reducedMotion ? 0 : delaySeconds,
    };
  }

  const hiddenState = { opacity: 0, y: reducedMotion ? 0 : 24 };
  const visibleState = { opacity: 1, y: 0 };

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      style={{
        position: 'relative',
        height: '100vh',
        minHeight: '100svh',
        overflow: 'hidden',
        backgroundColor: 'var(--metador-bg)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* z1: Atmosphere field — layered radials from --metador-primary-rgb */}
      <div className="metador-field" aria-hidden="true" />

      {/* z2: Full-bleed graded dark composition — founder asset slot */}
      <HeroComposition />

      {/* z3: Bottom vignette — depth fog so type sits on calm ground */}
      <div className="metador-vignette-bottom" aria-hidden="true" />

      {/* z4: Content column — center-anchored, vertically centered, monumental */}
      <div
        style={{
          position: 'relative',
          zIndex: 'var(--metador-z-elevated)',
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 var(--metador-space-6)',
          paddingTop: 'var(--metador-space-16)',
          paddingBottom: 'var(--metador-space-16)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            marginInline: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Eyebrow — faint caps, metador-eyebrow class (atmosphere.css §4.4) */}
          <motion.p
            className="metador-eyebrow"
            initial={hiddenState}
            animate={visibleState}
            transition={revealTransition(0.04)}
            style={{
              marginBottom: 'var(--metador-space-6)',
            }}
          >
            Vault layer · DeepBook on Sui
          </motion.p>

          {/* Main headline — Inter, monumental scale, tight leading */}
          <motion.h1
            id="hero-heading"
            className="metador-display--hero"
            initial={hiddenState}
            animate={visibleState}
            transition={revealTransition(0.1)}
            style={{
              fontFamily: 'var(--metador-font-display)',
              // Size band: 3rem floor at 375px, scales to 5.5rem at 1440px.
              // 900px max-width parent keeps the claim to ~3 lines.
              fontSize: 'clamp(3rem, 5.6vw, 5.5rem)',
              lineHeight: 0.97,
              letterSpacing: '-0.04em',
              color: 'var(--metador-text)',
              marginBottom: 'var(--metador-space-8)',
              maxWidth: '100%',
            }}
          >
            Vaults that{' '}
            {/* ONE mint accent word — the load-bearing verb (spec §3.3, green identity) */}
            <span style={{ color: 'var(--metador-primary)' }}>can&apos;t</span>
            {' '}run off with your money.
          </motion.h1>

          {/* Sub-line — Inter, muted, max 52ch */}
          <motion.p
            initial={hiddenState}
            animate={visibleState}
            transition={revealTransition(0.18)}
            style={{
              fontFamily: 'var(--metador-font-text)',
              fontSize: 'var(--metador-text-lg)',
              lineHeight: 1.6,
              color: 'var(--metador-muted)',
              marginBottom: 'var(--metador-space-12)',
              maxWidth: '52ch',
            }}
          >
            Each vault&apos;s trading power is a locked capability — budget-capped,
            single-market, expiring, revocable — enforced by Sui validators, not by Metador.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={hiddenState}
            animate={visibleState}
            transition={revealTransition(0.26)}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 'var(--metador-space-3)',
            }}
          >
            {/* Primary CTA — mint fill (ONE mint CTA per budget §3) */}
            <a
              href={APP_URL}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--metador-font-text)',
                fontWeight: 'var(--metador-weight-medium)',
                fontSize: 'var(--metador-text-base)',
                padding: 'var(--metador-space-3) var(--metador-space-8)',
                borderRadius: 'var(--metador-radius-sm)',
                backgroundColor: 'var(--metador-primary)',
                color: 'var(--metador-on-primary)',
                textDecoration: 'none',
                boxShadow: 'var(--metador-glow-primary)',
                transitionProperty: 'background-color, box-shadow',
                transitionDuration: 'var(--metador-duration-fast)',
                transitionTimingFunction: 'var(--metador-ease-standard)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--metador-primary-bright)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--metador-primary)';
              }}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Launch App
            </a>

            {/* Secondary CTA — ghost (NOT mint; spec §3: at most 2 primary per viewport,
                both already used: accent word + primary CTA fill) */}
            <a
              href="/docs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--metador-font-text)',
                fontWeight: 'var(--metador-weight-medium)',
                fontSize: 'var(--metador-text-base)',
                padding: 'var(--metador-space-3) var(--metador-space-8)',
                borderRadius: 'var(--metador-radius-sm)',
                backgroundColor: 'transparent',
                color: 'var(--metador-text)',
                border: '1px solid var(--metador-border)',
                textDecoration: 'none',
                transitionProperty: 'background-color, border-color',
                transitionDuration: 'var(--metador-duration-fast)',
                transitionTimingFunction: 'var(--metador-ease-standard)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--metador-raised)';
                e.currentTarget.style.borderColor = 'var(--metador-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--metador-border)';
              }}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Read the docs
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
