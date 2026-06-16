---
description: Run the reference lab against a benchmark URL — screenshots, scroll video, computed-style measurements, stack detection, IA map. Output to docs/research/refs/<site>/.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: [url]
---

Run a full capture of: $ARGUMENTS (Capture Loop, KAIOS §9).

## Procedure
1. Derive <site> slug from the URL; create docs/research/refs/<site>/.
2. For each viewport 390 / 768 / 1440 run packages/reference-lab:
   - capture.ts: full-page screenshot; stepped scroll shots every ~800px
     (600ms settle); one slow programmatic scroll recorded as video;
     Playwright trace.
   - styles.ts: computed-styles walk -> measurements.json (font stacks,
     every size/weight/line-height in use, color frequency table, spacing
     samples, radii, shadows).
   - stack.ts: script-tag + network detection (three, Spline, motion/framer,
     GSAP, lenis…) -> stack.md.
   - flows.ts: nav link graph, page tree, headings outline -> ia.md.
3. Manual pass for what scripts miss (easing feel, sequencing, hover/modal
   behavior) -> interactions.md.
4. Write patterns.md for the site: principles in OUR words, numbers as
   reference data. Then update cross-site PRINCIPLES.md.

## Verify (per target)
Screenshots exist at all 3 viewports · scroll video plays ·
measurements.json non-empty · stack.md names the actual animation library.

## Binding constraint
Reference Extraction Protocol (CLAUDE.md §8): capture everything, ship
nothing of theirs. patterns.md contains principles and measurements only —
no copied copy, no asset downloads into app code, ever.
