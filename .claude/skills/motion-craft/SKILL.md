---
name: motion-craft
description: Motion system discipline for Metador. Use when adding or reviewing any animation — durations, easings, enter/exit patterns, scroll choreography, live-data transitions. Motion (motion.dev) is the only animation library.
---

# Motion Craft

## Tokens (DESIGN.md#motion is the source; these are the defaults)
- fast 150ms / base 200ms / slow 300ms / hero 500ms. Ease-out for enters,
  ease-in for exits, spring(0.8) for meters and counters.
- Stagger: 40–60ms for list rows; never stagger more than 8 items.

## Patterns
- Activity feed: new row slides in (translateY -8px -> 0) + brief background
  pulse using a token color at 18% alpha. Never re-animate existing rows.
- Budget meter: width animates spring-style; passing 80% flips to the hot
  gradient over the SAME duration (one motion, two properties).
- REVOKE: the page's red state change is allowed to be theatrical — 300ms,
  full surface acknowledgment. It's the demo's emotional peak by design.
- Numbers count-up ONLY on first mount, never on poll updates (layout calm
  beats delight).
- Route transitions: < 200ms perceived; prefer content crossfade over
  layout slides in the app.

## Hard rules
- transform/opacity only. Animating width/height/top = veto (except the
  budget meter width, which is the one sanctioned exception — it's cheap
  and isolated).
- 60fps verified in DevTools performance on a mid-tier profile.
- Decorative motion (ambient float, gradient shimmer) requires design-agent
  signoff with a written reason.
- prefers-reduced-motion honored: all non-feedback motion collapses to
  instant state changes.

## Anti-patterns
- transition-all. Springs on exits. Scroll-jacking in the app (allowed only
  in the landing hero choreography, and only if the captured benchmark
  pattern justifies it). Animation as apology for slow data.
