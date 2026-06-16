'use client';

/**
 * StatBand — §8.4 Proof stat band.
 *
 * - 4 operational stats (testnet-preview placeholder values clearly labelled)
 * - Count-up once on first viewport entry (Motion useInView once:true)
 * - Animates a motion value from 0 → final; numbers via Geist Mono tabular
 * - respects prefers-reduced-motion (instant final values, no count-up)
 * - One tinted card (--metador-surface border --metador-border)
 * - Bg world: dark --metador-bg (§8.4 dark section)
 * - No APY, no earnings promises (PRODUCT.md non-goals)
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, animate } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

interface StatItem {
  label: string;
  /** Final numeric value */
  finalValue: number;
  /** Display suffix (e.g. '+', 'K', '%') */
  suffix: string;
  /** Display prefix (e.g. '$') */
  prefix: string;
  description: string;
}

/**
 * TESTNET-PREVIEW placeholder values.
 * These numbers are illustrative counts from internal testnet runs.
 * They will be replaced with live on-chain data at G3 mainnet prep.
 */
const STATS: StatItem[] = [
  {
    label: 'Vaults secured',
    finalValue: 12,
    prefix: '',
    suffix: '',
    description: 'Active strategy vaults on testnet',
  },
  {
    label: 'Policy checks',
    finalValue: 4800,
    prefix: '',
    suffix: '+',
    description: 'On-chain policy assertions evaluated',
  },
  {
    label: 'Capped exposure',
    finalValue: 500,
    prefix: '$',
    suffix: '/vault',
    description: 'Maximum daily budget per vault, hard-enforced in Move',
  },
  {
    label: 'Custodial incidents',
    finalValue: 0,
    prefix: '',
    suffix: '',
    description: 'Funds removed without owner signature: zero',
  },
];

/** Formats a number with comma separators */
function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

interface CountUpStatProps extends StatItem {
  shouldAnimate: boolean;
}

function CountUpStat({ label, finalValue, suffix, prefix, description, shouldAnimate }: CountUpStatProps) {
  const [displayValue, setDisplayValue] = useState(shouldAnimate ? 0 : finalValue);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || hasRun.current) return;
    if (finalValue === 0) {
      setDisplayValue(0);
      return;
    }

    hasRun.current = true;
    // Count-up duration: scale with value so small numbers feel punchy
    const duration = finalValue <= 12 ? DURATIONS_S.slow : DURATIONS_S.hero;

    const controls = animate(0, finalValue, {
      duration,
      ease: EASE_ENTER,
      onUpdate(v: number) {
        setDisplayValue(v);
      },
    });

    return () => {
      controls.stop();
    };
  }, [shouldAnimate, finalValue]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--metador-space-1)',
        textAlign: 'center',
        padding: 'var(--metador-space-6)',
        flex: '1 1 180px',
      }}
    >
      {/* Muted label */}
      <span
        style={{
          fontFamily: 'var(--metador-font-text)',
          fontSize: 'var(--metador-text-2xs)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--metador-muted)',
        }}
        aria-label={label}
      >
        {label}
      </span>

      {/* Mono tabular value — the visual peak */}
      <span
        className="stat-band-value"
        aria-live="polite"
        aria-atomic="true"
        style={{
          fontFamily: 'var(--metador-font-mono)',
          fontSize: 'clamp(var(--metador-text-3xl), 4vw, var(--metador-text-4xl))',
          lineHeight: 1.05,
          fontWeight: 'var(--metador-weight-semibold)',
          color: 'var(--metador-text)',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {prefix}
        {formatNumber(displayValue)}
        {suffix}
      </span>

      {/* Sub-description — honest mechanism, no hype */}
      <span
        style={{
          fontFamily: 'var(--metador-font-text)',
          fontSize: 'var(--metador-text-xs)',
          /* --metador-faint fails SC 1.4.3 at 13px (3.33:1); switch to --metador-muted */
          color: 'var(--metador-muted)',
          lineHeight: 1.5,
          marginTop: 'var(--metador-space-1)',
        }}
      >
        {description}
      </span>
    </div>
  );
}

export function StatBand() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // once:true — count-up fires exactly once when the band enters the viewport
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const shouldAnimate = isInView && !reducedMotion;

  return (
    <section
      id="stat-band"
      ref={ref}
      aria-label="Operational statistics — testnet preview"
      style={{
        backgroundColor: 'var(--metador-bg)',
        paddingTop: 'var(--metador-space-16)',
        paddingBottom: 'var(--metador-space-16)',
        paddingLeft: 'var(--metador-space-6)',
        paddingRight: 'var(--metador-space-6)',
      }}
    >
      {/* Testnet-preview callout — transparent to the reader */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DURATIONS_S.base, ease: EASE_ENTER }}
          style={{
            fontFamily: 'var(--metador-font-text)',
            fontSize: 'var(--metador-text-2xs)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            /* --metador-faint fails SC 1.4.3 at 12px (3.33:1); switch to --metador-muted */
            color: 'var(--metador-muted)',
            textAlign: 'center',
            marginBottom: 'var(--metador-space-6)',
          }}
        >
          Testnet preview — illustrative counts
        </motion.p>

        {/* Tinted card container */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER, delay: 0.05 }}
          style={{
            backgroundColor: 'var(--metador-surface)',
            border: '1px solid var(--metador-border)',
            borderRadius: 'var(--metador-radius-lg)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            overflow: 'hidden',
          }}
          role="list"
          aria-label="Operational statistics"
        >
          {STATS.map((stat) => (
            <div key={stat.label} role="listitem" style={{ flex: '1 1 180px' }}>
              <CountUpStat {...stat} shouldAnimate={shouldAnimate} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
