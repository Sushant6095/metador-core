/**
 * Metador design tokens — typed TS surface (single source of truth for both apps).
 *
 * PROVISIONAL FREEZE 2026-06-11 — pending founder ratification (BOOTSTRAP
 * Phase F gate). These values are buildable-against now but are NOT final
 * until the founder ratifies in the decision log. Treat any post-ratification
 * change as a token-freeze amendment (founder-gated).
 *
 * CSS custom properties live in `./tokens.css`. This module exposes the
 * values Motion needs that a CSS custom property cannot carry: Motion's JS
 * API takes durations in SECONDS (CSS authors them in ms) and cannot read a
 * spring config or easing tuple from a custom property (DESIGN.md #motion,
 * "What ships where").
 */

/**
 * PROVISIONAL — see the freeze note above. Flips to `true` only when the
 * founder ratifies the token freeze at the BOOTSTRAP Phase F gate.
 */
export const TOKENS_FROZEN = false;

/**
 * Cubic-bezier easing tuple consumable directly by Motion's `ease` option.
 * Mirror of `--metador-ease-*` in tokens.css.
 */
export type EaseTuple = readonly [number, number, number, number];

/**
 * Motion durations in SECONDS (Motion's JS API takes seconds; CSS authors ms).
 * Mirror of `--metador-duration-*` in tokens.css:
 *   fast 120ms · base 200ms · slow 320ms · hero 520ms · ambient 6000ms.
 */
export const DURATIONS_S = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  hero: 0.52,
  ambient: 6,
} as const;

/** Ease-out expo — decisive arrival (things appearing). `--metador-ease-enter`. */
export const EASE_ENTER: EaseTuple = [0.16, 1, 0.3, 1];

/** Ease-in — quick departure (things leaving). `--metador-ease-exit`. */
export const EASE_EXIT: EaseTuple = [0.4, 0, 1, 1];

/** Symmetric state changes (hover, tab). `--metador-ease-standard`. */
export const EASE_STANDARD: EaseTuple = [0.4, 0, 0.2, 1];

/**
 * Budget-meter spring (Motion API). `damping: 22` is Motion's raw damping
 * COEFFICIENT, not a ratio — pair it with `stiffness` as-is. Use for
 * budget-meter fills and depleting bars (a settling, physical feel).
 */
export const springMeter = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
} as const;

/**
 * The CSS variable names emitted by `next/font` that `tokens.css` references.
 * Apps must register exactly these `variable` names on the font loaders and
 * apply the resulting classes to `<html>` so `--metador-font-*` resolve.
 */
export const METADOR_FONT_VARS = {
  display: '--font-fraunces',
  text: '--font-geist-sans',
  mono: '--font-geist-mono',
} as const;
