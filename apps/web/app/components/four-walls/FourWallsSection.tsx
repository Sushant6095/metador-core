'use client';

/**
 * FourWallsSection — "The four walls" narrative.
 * Four cards: budget / scope / expiry / revoke. Plain-English copy.
 * Motion stagger-reveal on scroll via whileInView. Transform/opacity only.
 */

import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

interface WallCard {
  id: string;
  label: string;
  headline: string;
  body: string;
  accentColor: string;
}

// Spec §3.4 + §5.3: card titles use --metador-text (drop brass).
// Wall-4 keeps --metador-revoke as the SOLE color signal.
// Wall-3 uses --metador-warn (orange) — a semantic signal, not brass decoration.
const WALLS: readonly WallCard[] = [
  {
    id: 'budget',
    label: 'Wall 1',
    headline: 'Budget ceiling',
    body:
      'The vault can move at most $X per day — a hard limit recorded on-chain. When the ceiling is hit, every trade is rejected automatically. The ceiling cannot be raised without your signature.',
    accentColor: 'var(--metador-text)',
  },
  {
    id: 'scope',
    label: 'Wall 2',
    headline: 'Single market',
    body:
      'The capability is locked to one market — for example, SUI/USDC. The leader cannot pivot to a different pair or asset class without creating a new vault you explicitly approve.',
    accentColor: 'var(--metador-text)',
  },
  {
    id: 'expiry',
    label: 'Wall 3',
    headline: 'Expiry date',
    body:
      'Every mandate has a built-in expiry. When the timestamp passes, the capability goes dead automatically — no action required from you. Nothing can trade past the deadline.',
    accentColor: 'var(--metador-warn)',
  },
  {
    id: 'revoke',
    label: 'Wall 4',
    headline: 'One-click revoke',
    body:
      'At any moment, you can kill the capability with one on-chain transaction. The leader immediately loses all trading power — not because Metador enforces it, but because the chain does.',
    accentColor: 'var(--metador-revoke)',
  },
] as const;

/** Per-item stagger delay (DESIGN.md: 40–60ms per item) */
const STAGGER_DELAY_S = 0.05;

export function FourWallsSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="how-safety-works"
      aria-labelledby="four-walls-heading"
      data-theme="light"
      style={{
        position: 'relative',
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Glow-bleed seam at dark→light entry (spec §2.4) */}
      <div className="metador-seam metador-seam--top" aria-hidden="true" />

      <div className="mx-auto w-full max-w-5xl">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
          style={{ marginBottom: 'var(--metador-space-12)' }}
        >
          {/* Eyebrow: faint per spec §3.4 — not brass */}
          <p
            className="metador-eyebrow"
            style={{
              marginBottom: 'var(--metador-space-2)',
            }}
          >
            Structural safety
          </p>
          {/* Section title: scaled up per spec §4.3, display sharp */}
          <h2
            id="four-walls-heading"
            className="metador-display"
            style={{
              fontFamily: 'var(--metador-font-display)',
              fontSize: 'clamp(2.5rem, 3vw + 1rem, 3.5rem)',
              lineHeight: 1.08,
              color: 'var(--metador-text)',
              maxWidth: '28ch',
              marginBottom: 'var(--metador-space-4)',
            }}
          >
            The four walls
          </h2>
          <p
            style={{
              fontFamily: 'var(--metador-font-text)',
              fontSize: 'var(--metador-text-base)',
              lineHeight: 'var(--metador-text-base--line-height)',
              color: 'var(--metador-muted)',
              maxWidth: '52ch',
            }}
          >
            Safety is structural, not promised. Even if the leader&apos;s key is fully
            compromised, these four on-chain constraints stay intact. Sui validators enforce
            them — Metador cannot override them.
          </p>
        </motion.div>

        {/* Cards grid */}
        <ul
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 'var(--metador-space-4)',
          }}
          aria-label="The four safety walls"
        >
          {WALLS.map((wall, i) => (
            <motion.li
              key={wall.id}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: DURATIONS_S.slow,
                ease: EASE_ENTER,
                delay: reducedMotion ? 0 : i * STAGGER_DELAY_S,
              }}
              style={{ listStyle: 'none' }}
            >
              <div
                className="h-full flex flex-col"
                style={{
                  backgroundColor: 'var(--metador-surface)',
                  border: '1px solid var(--metador-border)',
                  borderRadius: 'var(--metador-radius-lg)',
                  padding: 'var(--metador-space-6)',
                  borderTopWidth: '2px',
                  borderTopColor: wall.accentColor,
                  // Raised surface per spec §2.5 — float shadow gives depth
                  boxShadow: 'var(--metador-shadow-float)',
                  transition: `box-shadow var(--metador-duration-fast) var(--metador-ease-standard)`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--metador-shadow-modal)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--metador-shadow-float)';
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontSize: 'var(--metador-text-2xs)',
                    /* --metador-faint fails SC 1.4.3 at 12px on light surface (3.09:1); switch to --metador-muted */
                    color: 'var(--metador-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 'var(--metador-space-2)',
                  }}
                >
                  {wall.label}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--metador-font-display)',
                    fontSize: 'var(--metador-text-xl)',
                    lineHeight: 'var(--metador-text-xl--line-height)',
                    fontWeight: 'var(--metador-weight-semibold)',
                    color: wall.accentColor,
                    marginBottom: 'var(--metador-space-3)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {wall.headline}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontSize: 'var(--metador-text-sm)',
                    lineHeight: 'var(--metador-text-base--line-height)',
                    color: 'var(--metador-muted)',
                    flexGrow: 1,
                  }}
                >
                  {wall.body}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
