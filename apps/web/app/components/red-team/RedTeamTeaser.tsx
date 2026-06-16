'use client';

/**
 * RedTeamTeaser — §8.6 dark band.
 * Short dark section ramping toward --metador-revoke accent.
 * Inter headline: "We leaked our own key."
 * One sentence (funds untouched — the walls held).
 * Ghost CTA links to the app's /safety page (APP_URL + /safety).
 * Transform/opacity only. One stagger reveal. Max 8 items.
 *
 * TODO: update ghost CTA href once the web /safety page is built.
 */

import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

const STAGGER_S = 0.05;

export function RedTeamTeaser() {
  const reducedMotion = useReducedMotion();
  const dy = reducedMotion ? 0 : 16;

  return (
    <section
      id="red-team"
      aria-labelledby="red-team-heading"
      style={{
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-bg)',
        borderTop: '1px solid var(--metador-border)',
        /* Subtle gradient toward the revoke accent at the bottom edge */
        background:
          'linear-gradient(to bottom, var(--metador-bg) 60%, color-mix(in srgb, var(--metador-revoke) 6%, var(--metador-bg)) 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: dy }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
          style={{
            fontFamily: 'var(--metador-font-text)',
            fontSize: 'var(--metador-text-xs)',
            /* --metador-revoke #e11d2a = 4.06:1 at 13px — fails SC 1.4.3.
               Switch text to --metador-danger #ff4d3e = 5.46:1. Revoke-red identity
               preserved on borders/accents (1.4.11 allows 3:1 for non-text). */
            color: 'var(--metador-danger)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 'var(--metador-space-4)',
          }}
        >
          Red team
        </motion.p>

        {/* Display headline */}
        <motion.h2
          id="red-team-heading"
          initial={{ opacity: 0, y: dy }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER, delay: STAGGER_S }}
          style={{
            fontFamily: 'var(--metador-font-display)',
            fontSize: 'clamp(2rem, 5vw + 0.5rem, var(--metador-text-4xl))',
            lineHeight: 1.05,
            fontWeight: 'var(--metador-weight-semibold)',
            color: 'var(--metador-text)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--metador-space-6)',
          }}
        >
          We leaked our own key.
        </motion.h2>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0, y: dy }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER, delay: STAGGER_S * 2 }}
          style={{
            fontFamily: 'var(--metador-font-text)',
            fontSize: 'var(--metador-text-lg)',
            lineHeight: 'var(--metador-text-lg--line-height)',
            color: 'var(--metador-muted)',
            maxWidth: '42ch',
            margin: '0 auto',
            marginBottom: 'var(--metador-space-8)',
          }}
        >
          Funds untouched. The walls held.
        </motion.p>

        {/* Ghost CTA */}
        <motion.div
          initial={{ opacity: 0, y: dy }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER, delay: STAGGER_S * 3 }}
        >
          {/*
           * TODO: replace href with web /safety page once built.
           * For now links to the app's /safety route.
           */}
          <a
            href={`${APP_URL}/safety`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--metador-space-2)',
              fontFamily: 'var(--metador-font-text)',
              fontWeight: 'var(--metador-weight-medium)',
              fontSize: 'var(--metador-text-base)',
              /* --metador-revoke #e11d2a = 4.06:1 at 16px normal — fails SC 1.4.3.
                 Text switches to --metador-danger #ff4d3e = 5.46:1 (passes).
                 Border retains --metador-revoke: border is non-text, 1.4.11 allows 3:1. */
              color: 'var(--metador-danger)',
              border: '1px solid color-mix(in srgb, var(--metador-revoke) 40%, transparent)',
              borderRadius: 'var(--metador-radius-sm)',
              padding: 'var(--metador-space-3) var(--metador-space-6)',
              textDecoration: 'none',
              transitionProperty: 'background-color, color, border-color',
              transitionDuration: 'var(--metador-duration-fast)',
              transitionTimingFunction: 'var(--metador-ease-standard)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = 'var(--metador-tint-revoke)';
              el.style.borderColor = 'var(--metador-revoke)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.backgroundColor = 'transparent';
              el.style.borderColor = 'color-mix(in srgb, var(--metador-revoke) 40%, transparent)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `var(--metador-ring-width) solid var(--metador-ring)`;
              e.currentTarget.style.outlineOffset = 'var(--metador-ring-offset)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            See the safety demo
            {/* Arrow — aria-hidden decorative */}
            <span aria-hidden="true" style={{ fontSize: 'var(--metador-text-base)' }}>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
