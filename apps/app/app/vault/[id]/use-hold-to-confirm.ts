'use client';

import * as React from 'react';

/**
 * Hold-to-confirm interaction (DESIGN.md #motion REVOKE beat 1, "Arm").
 *
 * The user presses and holds; `progress` ramps 0→1 over `holdMs`; on reaching
 * 1 `onComplete` fires once. Releasing (pointer up / leave / blur / Escape /
 * key up) before completion resets to 0 with NO side effect — "release cancels"
 * is the committed friction mechanism.
 *
 * Reduced-motion: the caller decides; this hook always reports honest progress.
 * The progress drives a transform/opacity sweep (the brass→revoke fill), never
 * a layout property.
 *
 * Implemented with requestAnimationFrame against a wall-clock start so a busy
 * main thread cannot stall the ramp; cleans up rAF + listeners on unmount.
 */
export interface HoldToConfirm {
  progress: number; // 0..1
  holding: boolean;
  /** Spread onto the hold target (button). */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onKeyUp: (e: React.KeyboardEvent) => void;
    onBlur: () => void;
  };
  /** Imperatively reset (e.g. when the dialog re-opens). */
  reset: () => void;
}

export function useHoldToConfirm(
  holdMs: number,
  onComplete: () => void,
  enabled = true,
): HoldToConfirm {
  const [progress, setProgress] = React.useState(0);
  const [holding, setHolding] = React.useState(false);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number | null>(null);
  const completedRef = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = React.useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
  }, []);

  const reset = React.useCallback(() => {
    stop();
    completedRef.current = false;
    setHolding(false);
    setProgress(0);
  }, [stop]);

  const tick = React.useCallback(
    (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / holdMs, 1);
      setProgress(p);
      if (p >= 1) {
        if (!completedRef.current) {
          completedRef.current = true;
          stop();
          setHolding(false);
          onCompleteRef.current();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [holdMs, stop],
  );

  const begin = React.useCallback(() => {
    if (!enabled || completedRef.current) return;
    setHolding(true);
    startRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [enabled, tick]);

  const cancel = React.useCallback(() => {
    if (completedRef.current) return; // already fired — keep at full
    stop();
    setHolding(false);
    setProgress(0);
  }, [stop]);

  React.useEffect(() => () => stop(), [stop]);

  return {
    progress,
    holding,
    reset,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        begin();
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onBlur: cancel,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!holding) begin();
        }
      },
      onKeyUp: (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') cancel();
      },
    },
  };
}
