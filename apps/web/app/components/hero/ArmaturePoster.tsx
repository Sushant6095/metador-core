'use client';

/**
 * BENCHED 2026-06-12 (landing premium pass, founder build-list #1): no longer
 * imported by the hero. Kept as the static poster for the benched
 * ArmatureScene. The new hero is HeroComposition.tsx (graded dark slot). Do
 * not delete — this is the fallback hero asset, re-wired only on founder call.
 *
 * ArmaturePoster — static SVG of the new wireframe armature composition.
 *
 * Matches ArmatureScene's new elevation-spec §1.3/§1.5 geometry:
 * - Same off-right crop and anchor (SVG viewBox skewed right).
 * - Thin strokes (1–2px) for the wireframe rings, not thick solids.
 * - High-detail ellipses with dashed/segmented appearance via stroke-dasharray.
 * - Graticule tick marks every 15° (24 ticks around outer ring).
 * - ONE bright meridian arc at --metador-primary-bright full strength.
 * - Fog vignette baked as a radial gradient overlay (dark edges, bright center).
 * - Dim brass body lines at opacity 0.32.
 *
 * CLS-zero: occupies position:absolute inset:0 in the full-bleed hero container,
 * same as the live canvas — no layout shift on scene mount.
 */

interface ArmaturePosterProps {
  className?: string;
}

export function ArmaturePoster({ className }: ArmaturePosterProps) {
  // Tick marks — 24 radial ticks at 15° intervals on the graticule ring
  const TICK_COUNT = 24;
  const OUTER_R = 310; // outer ring SVG units (graticule)
  const TICK_LEN = 18; // tick length in SVG units
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x1: OUTER_R * cos,
      y1: (OUTER_R * sin) * 0.52, // yRatio 0.52 for the graticule ellipse
      x2: (OUTER_R - TICK_LEN) * cos,
      y2: ((OUTER_R - TICK_LEN) * sin) * 0.52,
    };
  });

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {/*
       * Full-bleed SVG. ViewBox is 1400×900 matching landscape hero proportions.
       * The armature center is anchored at ~x=950 (off-right) so it partially
       * crops out of frame at the right edge — same as ArmatureScene position.x=+1.4.
       */}
      <svg
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Fog vignette: dark edges fade in from all sides, armature center bright */}
          <radialGradient id="fogVignette" cx="68%" cy="50%" r="55%" fx="68%" fy="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="75%" stopColor="transparent" />
            <stop offset="100%" stopColor="var(--metador-bg)" stopOpacity="0.85" />
          </radialGradient>

          {/* Bottom ground vignette — type sits on calm dark ground */}
          <linearGradient id="groundFog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="40%" stopColor="transparent" />
            <stop offset="100%" stopColor="var(--metador-bg)" stopOpacity="0.94" />
          </linearGradient>

          {/* Brass glow filter for the meridian catch-light */}
          <filter id="brassGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle atmosphere glow behind armature */}
          <radialGradient id="atmoGlow" cx="68%" cy="50%" r="40%">
            <stop offset="0%" stopColor="var(--metador-primary)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Atmosphere glow layer */}
        <rect width="1400" height="900" fill="url(#atmoGlow)" />

        {/* All armature geometry centered at (950, 450) — off-right anchor */}
        <g transform="translate(950, 450)">

          {/* Graticule ring — outermost, thin, dim, slightly tilted */}
          <ellipse
            cx="0" cy="0"
            rx={OUTER_R}
            ry={Math.round(OUTER_R * 0.52)}
            fill="none"
            stroke="var(--metador-primary)"
            strokeWidth="1"
            opacity="0.18"
            strokeDasharray="4 6"
            transform="rotate(-12)"
          />

          {/* Graticule ticks — 24 at 15° intervals */}
          <g transform="rotate(-12)" opacity="0.28">
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1} y1={t.y1}
                x2={t.x2} y2={t.y2}
                stroke="var(--metador-primary)"
                strokeWidth="1"
                opacity="0.7"
              />
            ))}
          </g>

          {/* Outer primary ring — high detail, dim brass body */}
          <ellipse
            cx="0" cy="0"
            rx="248"
            ry="154"
            fill="none"
            stroke="var(--metador-primary-deep)"
            strokeWidth="1.5"
            opacity="0.32"
            strokeDasharray="3 4"
            transform="rotate(-18)"
          />

          {/* Secondary outer ring detail lines (wireframe latitude lines) */}
          <ellipse
            cx="0" cy="0"
            rx="248"
            ry="154"
            fill="none"
            stroke="var(--metador-primary-deep)"
            strokeWidth="1"
            opacity="0.18"
            strokeDasharray="1 8"
            transform="rotate(12)"
          />

          {/* Inner ring — smaller, steeply tilted (~70° in 3D) */}
          <ellipse
            cx="0" cy="0"
            rx="168"
            ry="96"
            fill="none"
            stroke="var(--metador-primary-deep)"
            strokeWidth="1.5"
            opacity="0.32"
            strokeDasharray="3 4"
            transform="rotate(72)"
          />

          {/* Inner ring detail */}
          <ellipse
            cx="0" cy="0"
            rx="168"
            ry="96"
            fill="none"
            stroke="var(--metador-primary-deep)"
            strokeWidth="1"
            opacity="0.14"
            strokeDasharray="1 8"
            transform="rotate(92)"
          />

          {/* Metador spine — thin vertical line, dim */}
          <line
            x1="0" y1="-340"
            x2="0" y2="340"
            stroke="var(--metador-primary-deep)"
            strokeWidth="1"
            opacity="0.28"
          />

          {/* ONE bright meridian catch-light — the single bright element (§1.3) */}
          <ellipse
            cx="0" cy="0"
            rx="252"
            ry="155"
            fill="none"
            stroke="var(--metador-primary-bright)"
            strokeWidth="2"
            opacity="1.0"
            transform="rotate(-18)"
            filter="url(#brassGlow)"
            style={{ mixBlendMode: 'screen' }}
            // Only the top-right arc is bright: circumference ≈ 1291px,
            // show ~200px and hide the rest via dasharray.
            strokeDasharray="200 1091"
            strokeDashoffset="-320"
          />

          {/* Centre node — small brass point at armature heart */}
          <circle
            cx="0" cy="0"
            r="4"
            fill="var(--metador-primary)"
            opacity="0.55"
          />
        </g>

        {/* Fog vignette overlay — gives the instrument depth and edges */}
        <rect width="1400" height="900" fill="url(#fogVignette)" />

        {/* Ground fog — content column sits on calm dark ground */}
        <rect width="1400" height="900" fill="url(#groundFog)" />
      </svg>
    </div>
  );
}
