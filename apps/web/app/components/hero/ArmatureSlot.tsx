'use client';

/**
 * BENCHED 2026-06-12 (landing premium pass, founder build-list #1): no longer
 * imported by the hero. The hero now uses HeroComposition.tsx (graded dark
 * video/Spline slot). Kept as the mount shell for the benched ArmatureScene;
 * re-wire only on founder call.
 *
 * ArmatureSlot — full-bleed background shell for the Three.js ArmatureScene.
 *
 * Elevation-spec §1.2: the armature is a full-bleed background layer
 * (position:absolute; inset:0), NOT a sibling column. The card box
 * (border, rounded rect, max-width:480) is removed per the spec.
 *
 * Contracts:
 * - next/dynamic ssr:false
 * - Mounts scene only after requestIdleCallback (fallback setTimeout 200ms)
 *   AND only if !prefers-reduced-motion
 * - Until loaded: ArmaturePoster is visible (CLS 0 — both layers share the same
 *   position:absolute inset:0 inside the hero's position:relative container)
 * - Crossfade from poster → scene via Motion opacity (DURATIONS_S.slow)
 * - No border, no background box, no maxWidth constraint — fills the hero fully
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import { ArmaturePoster } from './ArmaturePoster';

// Lazy-load Three.js — heavy, client-only, never SSR
const ArmatureScene = dynamic(
  () => import('./ArmatureScene').then((m) => ({ default: m.ArmatureScene })),
  { ssr: false },
);

export function ArmatureSlot() {
  const prefersReducedMotion = useReducedMotion();
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let cancelled = false;

    function scheduleMount() {
      if (cancelled) return;
      setSceneReady(true);
    }

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(scheduleMount, { timeout: 2000 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    } else {
      const id = setTimeout(scheduleMount, 200);
      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    }
  }, [prefersReducedMotion]);

  // Both poster and scene occupy the same position:absolute inset:0 layer.
  // The hero section wraps them in position:relative so they fill it fully.
  return (
    <>
      {/* Poster — always rendered as the base; fades out once scene is ready */}
      <motion.div
        style={{ position: 'absolute', inset: 0, zIndex: 2 }}
        animate={{ opacity: sceneReady ? 0 : 1 }}
        transition={{
          duration: DURATIONS_S.slow,
          ease: EASE_ENTER,
        }}
      >
        <ArmaturePoster />
      </motion.div>

      {/* Scene — fades in above poster once idle callback fires */}
      {sceneReady && (
        <motion.div
          style={{ position: 'absolute', inset: 0, zIndex: 2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: DURATIONS_S.slow,
            ease: EASE_ENTER,
          }}
        >
          <ArmatureScene />
        </motion.div>
      )}
    </>
  );
}
