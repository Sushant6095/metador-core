'use client';

/**
 * StackSection — original isometric diagram of OUR four-layer stack
 * (landing premium pass, founder build-list #4).
 *
 * Pattern transfer ONLY (choreography.md §3 — their stack is an iso layer
 * diagram; ours is hand-authored, our tokens, our content, our composition).
 * Divergence: brass edges on cold slate ≠ their mint blocks on forest; our four
 * layers describe Metador's architecture, not theirs. Two different brands.
 *
 * Layers bottom→top (extruded iso boxes, brass edge accents, mono caps labels):
 *   Sui  →  DeepBook  →  keel_core (vault · policy · shares)  →
 *   Apps (marketplace · cockpit · screener)
 *
 * Dark section. Motion: ONE restrained whileInView stagger (≤8 items, ~55ms),
 * opacity + translateY, tokens only. prefers-reduced-motion = instant.
 */

import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

interface StackLayer {
  id: string;
  title: string;
  sub: string;
  /** highlight: keel_core is the one layer Metador owns — brass-emphasised face */
  owned: boolean;
}

// Bottom → top. Reversed for rendering (top layer drawn last / highest).
const LAYERS: readonly StackLayer[] = [
  { id: 'sui', title: 'SUI', sub: 'L1 · validators enforce the rules', owned: false },
  { id: 'deepbook', title: 'DEEPBOOK', sub: 'on-chain CLOB · matching & settlement', owned: false },
  { id: 'metador-core', title: 'METADOR_CORE', sub: 'vault · policy · shares', owned: true },
  { id: 'apps', title: 'APPS', sub: 'marketplace · cockpit · screener', owned: false },
] as const;

const STAGGER_S = 0.055;

// Isometric box geometry (SVG units). One box drawn as top + left + right face.
const BOX_W = 250; // half-width of the top rhombus (x span)
const BOX_D = 124; // depth offset (y span of the top rhombus)
const BOX_H = 40; // extrusion height (vertical face) — slab, not a tall block
const LAYER_GAP = 56; // vertical gap between stacked layers (clear separation)
const VIEW_W = 720;
const VIEW_H = 700;

interface IsoBoxProps {
  layer: StackLayer;
  /** vertical offset of this layer's top-front vertex */
  cy: number;
}

function IsoBox({ layer, cy }: IsoBoxProps) {
  const cx = VIEW_W / 2;
  // Top rhombus vertices (front, right, back, left)
  const topFront = `${cx},${cy + BOX_D}`;
  const topRight = `${cx + BOX_W},${cy + BOX_D / 2}`;
  const topBack = `${cx},${cy}`;
  const topLeft = `${cx - BOX_W},${cy + BOX_D / 2}`;
  // Left vertical face (front, left, left-down, front-down)
  const leftFace = `${cx},${cy + BOX_D} ${cx - BOX_W},${cy + BOX_D / 2} ${cx - BOX_W},${cy + BOX_D / 2 + BOX_H} ${cx},${cy + BOX_D + BOX_H}`;
  // Right vertical face
  const rightFace = `${cx},${cy + BOX_D} ${cx + BOX_W},${cy + BOX_D / 2} ${cx + BOX_W},${cy + BOX_D / 2 + BOX_H} ${cx},${cy + BOX_D + BOX_H}`;

  const topFill = layer.owned ? 'var(--metador-raised)' : 'var(--metador-surface)';
  const leftFill = layer.owned
    ? 'color-mix(in srgb, var(--metador-primary) 12%, var(--metador-surface))'
    : 'var(--metador-surface)';
  const rightFill = 'var(--metador-bg)';
  const edge = layer.owned ? 'var(--metador-primary)' : 'var(--metador-border)';
  const edgeW = layer.owned ? 1.75 : 1.25;

  return (
    <g>
      {/* Right face (darkest) */}
      <polygon points={rightFace} fill={rightFill} stroke={edge} strokeWidth={edgeW} strokeLinejoin="round" />
      {/* Left face (mid) */}
      <polygon points={leftFace} fill={leftFill} stroke={edge} strokeWidth={edgeW} strokeLinejoin="round" />
      {/* Top rhombus (lightest) */}
      <polygon
        points={`${topBack} ${topRight} ${topFront} ${topLeft}`}
        fill={topFill}
        stroke={edge}
        strokeWidth={edgeW}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function StackSection() {
  const reducedMotion = useReducedMotion();
  const dy = reducedMotion ? 0 : 16;

  // Render top layer first visually (highest on screen) → reverse the array so
  // index 0 (apps) sits at the top, sui at the base.
  const rendered = [...LAYERS].reverse();

  return (
    <section
      id="stack"
      aria-labelledby="stack-heading"
      style={{
        position: 'relative',
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-bg)',
        borderTop: '1px solid var(--metador-border)',
        overflow: 'hidden',
      }}
    >
      <div className="metador-field" aria-hidden="true" />

      <div
        style={{
          position: 'relative',
          zIndex: 'var(--metador-z-base)',
          maxWidth: 1120,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: dy }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
          style={{ textAlign: 'center', marginBottom: 'var(--metador-space-12)' }}
        >
          <p className="metador-eyebrow" style={{ marginBottom: 'var(--metador-space-4)' }}>
            The stack
          </p>
          <h2
            id="stack-heading"
            className="metador-display"
            style={{
              fontFamily: 'var(--metador-font-display)',
              fontSize: 'clamp(2.5rem, 3vw + 1rem, 3.5rem)',
              lineHeight: 1.05,
              color: 'var(--metador-text)',
              letterSpacing: '-0.02em',
              maxWidth: '22ch',
              marginInline: 'auto',
            }}
          >
            One small layer we own. The rest is the chain.
          </h2>
        </motion.div>

        {/* Iso diagram + labels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'var(--metador-space-12)',
            alignItems: 'center',
          }}
        >
          {/* The hand-authored isometric SVG */}
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: DURATIONS_S.hero, ease: EASE_ENTER }}
            aria-hidden="true"
          >
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              width="100%"
              height="auto"
              role="presentation"
              style={{ display: 'block', overflow: 'visible' }}
            >
              {rendered.map((layer, i) => (
                <IsoBox key={layer.id} layer={layer} cy={40 + i * (BOX_H + LAYER_GAP)} />
              ))}
            </svg>
          </motion.div>

          {/* Layer legend — mono caps labels (bottom→top order for reading) */}
          <ul
            style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--metador-space-2)' }}
            aria-label="Metador stack layers, base to top"
          >
            {[...LAYERS].reverse().map((layer, i) => (
              <motion.li
                key={layer.id}
                initial={{ opacity: 0, y: dy }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: DURATIONS_S.base,
                  ease: EASE_ENTER,
                  delay: reducedMotion ? 0 : i * STAGGER_S,
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--metador-space-1)',
                  padding: 'var(--metador-space-4)',
                  borderLeft: `2px solid ${layer.owned ? 'var(--metador-primary)' : 'var(--metador-border)'}`,
                  backgroundColor: layer.owned ? 'var(--metador-surface)' : 'transparent',
                  borderRadius: 'var(--metador-radius-md)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--metador-font-mono)',
                    fontSize: 'var(--metador-text-sm)',
                    fontWeight: 'var(--metador-weight-medium)',
                    letterSpacing: '0.08em',
                    color: layer.owned ? 'var(--metador-primary)' : 'var(--metador-text)',
                  }}
                >
                  {layer.title}
                  {layer.owned && (
                    <span
                      style={{
                        marginLeft: 'var(--metador-space-2)',
                        fontSize: 'var(--metador-text-2xs)',
                        letterSpacing: '0.12em',
                        color: 'var(--metador-primary)',
                      }}
                    >
                      METADOR OWNS THIS
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontSize: 'var(--metador-text-sm)',
                    color: 'var(--metador-muted)',
                  }}
                >
                  {layer.sub}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
