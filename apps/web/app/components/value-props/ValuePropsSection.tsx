'use client';

/**
 * ValuePropsSection — "For savers / For leaders."
 * Maya (crypto-curious saver) and Leo (skilled DeepBook trader) value props.
 * Two-column layout. Motion stagger-reveal on scroll.
 * Copy from PRODUCT.md, our own words.
 */

import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

interface ValueProp {
  id: string;
  persona: string;
  headline: string;
  points: readonly string[];
}

const VALUE_PROPS: readonly ValueProp[] = [
  {
    id: 'maya',
    persona: 'For savers',
    headline: 'Returns without custody risk.',
    points: [
      'Deposit once. The vault trades on your behalf — you hold shares, the strategy holds nothing of yours.',
      'Every limit is recorded on-chain. You can see exactly what the vault can and cannot do before you deposit.',
      'Revoke in one click, any time, from any device. Funds cannot be withdrawn to any address but yours.',
      'No skill required. Pick a strategy, check the policy card, decide if the walls are tight enough for you.',
    ],
  },
  {
    id: 'leo',
    persona: 'For leaders',
    headline: 'Monetise your edge without holding funds.',
    points: [
      'You never touch depositor money — the vault architecture makes that structurally impossible.',
      'Earn 10% of follower profit. Performance, not promises: if the vault makes money, you share it.',
      'Trade the same market you would trade anyway — SUI/USDC on DeepBook, same order book, same execution.',
      'Your track record is on-chain, auditable by anyone. No screenshots, no self-reported numbers.',
    ],
  },
] as const;

const STAGGER_DELAY_S = 0.05;

export function ValuePropsSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="value-props-heading"
      data-theme="light"
      style={{
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-bg)',
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
          style={{ marginBottom: 'var(--metador-space-12)' }}
        >
          {/* Eyebrow: faint per spec §3.4 */}
          <p
            className="metador-eyebrow"
            style={{ marginBottom: 'var(--metador-space-3)' }}
          >
            Who it&apos;s for
          </p>
          <h2
            id="value-props-heading"
            style={{
              fontFamily: 'var(--metador-font-display)',
              fontSize: 'clamp(1.8rem, 4vw + 0.5rem, var(--metador-text-3xl))',
              lineHeight: 'var(--metador-text-3xl--line-height)',
              fontWeight: 'var(--metador-weight-semibold)',
              color: 'var(--metador-text)',
              letterSpacing: '-0.02em',
              maxWidth: '28ch',
            }}
          >
            Copy trading that works for both sides.
          </h2>
        </motion.div>

        {/* Two-column grid */}
        <div
          className="grid gap-8"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
            gap: 'var(--metador-space-8)',
          }}
        >
          {VALUE_PROPS.map((prop, colIdx) => (
            <motion.article
              key={prop.id}
              aria-labelledby={`value-${prop.id}-heading`}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: DURATIONS_S.slow,
                ease: EASE_ENTER,
                delay: reducedMotion ? 0 : colIdx * 0.08,
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--metador-surface)',
                  border: '1px solid var(--metador-border)',
                  borderRadius: 'var(--metador-radius-lg)',
                  padding: 'var(--metador-space-8)',
                  height: '100%',
                }}
              >
                <p
                  className="metador-eyebrow"
                  style={{ marginBottom: 'var(--metador-space-3)' }}
                >
                  {prop.persona}
                </p>
                <h3
                  id={`value-${prop.id}-heading`}
                  style={{
                    fontFamily: 'var(--metador-font-display)',
                    fontSize: 'var(--metador-text-2xl)',
                    lineHeight: 'var(--metador-text-2xl--line-height)',
                    fontWeight: 'var(--metador-weight-semibold)',
                    color: 'var(--metador-text)',
                    letterSpacing: '-0.015em',
                    marginBottom: 'var(--metador-space-6)',
                  }}
                >
                  {prop.headline}
                </h3>

                <ul
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                  aria-label={`${prop.persona} benefits`}
                >
                  {prop.points.map((point, pIdx) => (
                    <motion.li
                      key={pIdx}
                      initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{
                        duration: DURATIONS_S.base,
                        ease: EASE_ENTER,
                        delay: reducedMotion
                          ? 0
                          : colIdx * 0.08 + pIdx * STAGGER_DELAY_S,
                      }}
                      style={{
                        display: 'flex',
                        gap: 'var(--metador-space-3)',
                        paddingBottom: 'var(--metador-space-4)',
                        marginBottom: 'var(--metador-space-4)',
                        borderBottom:
                          pIdx < prop.points.length - 1
                            ? '1px solid var(--metador-border)'
                            : 'none',
                      }}
                    >
                      {/* Mint bullet */}
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'block',
                          width: 6,
                          height: 6,
                          borderRadius: 'var(--metador-radius-full)',
                          backgroundColor: 'var(--metador-primary)',
                          flexShrink: 0,
                          marginTop: 8,
                        }}
                      />
                      <p
                        style={{
                          fontFamily: 'var(--metador-font-text)',
                          fontSize: 'var(--metador-text-sm)',
                          lineHeight: 'var(--metador-text-base--line-height)',
                          color: 'var(--metador-muted)',
                        }}
                      >
                        {point}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
