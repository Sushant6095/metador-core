'use client';

/**
 * CustodyProblemSection — §8.2 (first narrative block, dark world).
 * The hook: states the custody problem plainly using real documented events.
 * Fraunces display title, Geist body, one stat callout.
 * One whileInView stagger (max 8 items, 50ms/item, translateY 16→0 + opacity).
 * Transform/opacity only, prefers-reduced-motion = instant.
 * No fear-mongering: facts only, per DESIGN.md voice.
 */

import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

/** Per-item stagger delay — 50ms per DESIGN.md choreography.md §8 spec */
const STAGGER_S = 0.05;

export function CustodyProblemSection() {
  const reducedMotion = useReducedMotion();

  const dy = reducedMotion ? 0 : 16;

  return (
    <section
      id="custody-problem"
      aria-labelledby="custody-problem-heading"
      style={{
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-bg)',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          width: '100%',
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
            color: 'var(--metador-primary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 'var(--metador-space-3)',
          }}
        >
          The problem
        </motion.p>

        {/* Display title */}
        <motion.h2
          id="custody-problem-heading"
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
            maxWidth: '22ch',
            marginBottom: 'var(--metador-space-8)',
          }}
        >
          The vault holds your money. The leader holds the key.
        </motion.h2>

        {/* Two-column body + stat layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
            gap: 'var(--metador-space-12)',
            alignItems: 'start',
          }}
        >
          {/* Left: narrative paragraphs */}
          <motion.div
            initial={{ opacity: 0, y: dy }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER, delay: STAGGER_S * 2 }}
          >
            <p
              style={{
                fontFamily: 'var(--metador-font-text)',
                fontSize: 'var(--metador-text-base)',
                lineHeight: 'var(--metador-text-base--line-height)',
                color: 'var(--metador-muted)',
                marginBottom: 'var(--metador-space-6)',
              }}
            >
              In April 2025, Drift Protocol lost $285 million when an attacker
              compromised a single privileged key. The vault funds moved because
              the key had the power to move them — that was the design.
            </p>
            <p
              style={{
                fontFamily: 'var(--metador-font-text)',
                fontSize: 'var(--metador-text-base)',
                lineHeight: 'var(--metador-text-base--line-height)',
                color: 'var(--metador-muted)',
                marginBottom: 'var(--metador-space-6)',
              }}
            >
              Hyperliquid's vault marketplace showed what copy trading could be at
              scale — then showed the other side: strategy drift. A leader trading
              outside their stated mandate, with no on-chain constraint stopping them.
            </p>
            <p
              style={{
                fontFamily: 'var(--metador-font-text)',
                fontSize: 'var(--metador-text-base)',
                lineHeight: 'var(--metador-text-base--line-height)',
                color: 'var(--metador-muted)',
              }}
            >
              The failure mode is structural. You cannot fix it with better promises
              or tighter monitoring. You fix it by removing the power entirely — by
              issuing a capability that can trade but cannot withdraw, cannot pivot
              markets, and expires automatically.
            </p>
          </motion.div>

          {/* Right: stat callout */}
          <motion.aside
            aria-label="Reference: Drift Protocol incident"
            initial={{ opacity: 0, y: dy }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER, delay: STAGGER_S * 3 }}
          >
            <div
              style={{
                backgroundColor: 'var(--metador-surface)',
                border: '1px solid var(--metador-border)',
                borderLeft: '3px solid var(--metador-danger)',
                borderRadius: 'var(--metador-radius-lg)',
                padding: 'var(--metador-space-8)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--metador-font-mono)',
                  fontSize: 'clamp(var(--metador-text-3xl), 5vw, var(--metador-text-4xl))',
                  lineHeight: 1.05,
                  fontWeight: 'var(--metador-weight-semibold)',
                  color: 'var(--metador-danger)',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  marginBottom: 'var(--metador-space-2)',
                  letterSpacing: '-0.02em',
                }}
              >
                $285M
              </p>
              <p
                style={{
                  fontFamily: 'var(--metador-font-text)',
                  fontSize: 'var(--metador-text-sm)',
                  lineHeight: 'var(--metador-text-base--line-height)',
                  color: 'var(--metador-muted)',
                  marginBottom: 'var(--metador-space-3)',
                }}
              >
                Lost in the Drift Protocol key compromise (April 2025). One key.
                Full custody. No wall that couldn&apos;t be crossed.
              </p>
              <p
                style={{
                  fontFamily: 'var(--metador-font-text)',
                  fontSize: 'var(--metador-text-xs)',
                  /* --metador-faint fails SC 1.4.3 at 13px on dark surface (3.09:1); switch to --metador-muted */
                  color: 'var(--metador-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                Documented public incident — source: Drift post-mortem
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
