'use client';

/**
 * BuildersBand — §8.7 factual, quiet dark band.
 * "Built on Sui · settles on DeepBook" + 3 factual points.
 * No partner-logo wall, no fake badges.
 * One whileInView stagger on enter (≤8, 40ms).
 * Transform/opacity only.
 */

import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

const STAGGER_S = 0.04;

interface BuildPoint {
  id: string;
  headline: string;
  body: string;
}

const BUILD_POINTS: readonly BuildPoint[] = [
  {
    id: 'non-custodial',
    headline: 'Non-custodial objects',
    body: 'Depositor funds live in a Sui shared object. The leader receives a locked TradeCap — a capability that can place orders but cannot move funds or change the policy.',
  },
  {
    id: 'policy-asserts',
    headline: 'On-chain policy asserts',
    body: 'Every trade attempt passes four Move-level checks: budget ceiling, market scope, expiry, and revocation status. Sui validators enforce them. Metador cannot override them.',
  },
  {
    id: 'open-source',
    headline: 'Open source',
    body: 'The keel_core Move package is public. The policy code that guards your funds is readable, auditable, and will be independently reviewed before mainnet.',
  },
] as const;

export function BuildersBand() {
  const reducedMotion = useReducedMotion();
  const dy = reducedMotion ? 0 : 16;

  return (
    <section
      id="builders"
      aria-labelledby="builders-heading"
      style={{
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-surface)',
        borderTop: '1px solid var(--metador-border)',
        borderBottom: '1px solid var(--metador-border)',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Stack label */}
        <motion.div
          initial={{ opacity: 0, y: dy }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
          style={{ marginBottom: 'var(--metador-space-12)' }}
        >
          <p
            className="metador-eyebrow"
            style={{ marginBottom: 'var(--metador-space-3)' }}
          >
            Stack
          </p>
          <h2
            id="builders-heading"
            style={{
              fontFamily: 'var(--metador-font-display)',
              fontSize: 'clamp(1.6rem, 3vw + 0.5rem, var(--metador-text-3xl))',
              lineHeight: 'var(--metador-text-3xl--line-height)',
              fontWeight: 'var(--metador-weight-semibold)',
              color: 'var(--metador-text)',
              letterSpacing: '-0.02em',
            }}
          >
            Built on Sui · settles on DeepBook
          </h2>
        </motion.div>

        {/* Three factual points */}
        <ul
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
          aria-label="Technical foundation"
        >
          {BUILD_POINTS.map((point, i) => (
            <motion.li
              key={point.id}
              initial={{ opacity: 0, y: dy }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: DURATIONS_S.slow,
                ease: EASE_ENTER,
                delay: reducedMotion ? 0 : i * STAGGER_S,
              }}
              style={{
                display: 'flex',
                gap: 'var(--metador-space-6)',
                paddingTop: 'var(--metador-space-6)',
                paddingBottom: 'var(--metador-space-6)',
                borderBottom:
                  i < BUILD_POINTS.length - 1
                    ? '1px solid var(--metador-border)'
                    : 'none',
                alignItems: 'flex-start',
              }}
            >
              {/* Mint ordinal — primary color tabular */}
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--metador-font-mono)',
                  fontSize: 'var(--metador-text-xs)',
                  color: 'var(--metador-primary)',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  flexShrink: 0,
                  marginTop: 3,
                  letterSpacing: '0.04em',
                }}
              >
                0{i + 1}
              </span>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontSize: 'var(--metador-text-base)',
                    fontWeight: 'var(--metador-weight-medium)',
                    color: 'var(--metador-text)',
                    marginBottom: 'var(--metador-space-2)',
                  }}
                >
                  {point.headline}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontSize: 'var(--metador-text-sm)',
                    lineHeight: 'var(--metador-text-base--line-height)',
                    color: 'var(--metador-muted)',
                    maxWidth: '64ch',
                  }}
                >
                  {point.body}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
