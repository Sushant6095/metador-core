---
name: reference-capture
description: Operate Metador's reference lab. Use when capturing a benchmark site (screenshots, scroll video, computed styles, stack detection) or synthesizing patterns from captures. Pairs with the /capture command.
---

# Reference Capture

## Per-target procedure (viewports 390 / 768 / 1440)
1. capture.ts — full-page shot; stepped scroll shots every ~800px with 600ms
   settle (animations need time to fire); one slow programmatic scroll
   recorded as video (this is how scroll choreography gets studied);
   Playwright trace for timing truth.
2. styles.ts — walk computed styles on a DOM sample: font stacks, every
   font-size/weight/line-height in use, color frequency table, spacing
   samples between siblings, radii, shadows -> measurements.json.
3. stack.ts — script tags + network requests -> detect three/Spline/motion/
   GSAP/lenis/chart libs -> stack.md.
4. flows.ts — nav graph, page tree, headings outline -> ia.md.
5. Manual pass (devtools): easing FEEL, sequence order, hover/focus states,
   modal behavior -> interactions.md. Scripts can't capture judgment.
6. patterns.md — principles in OUR words ("stats animate on first viewport
   entry only, ~400ms stagger 60ms") with measurements as evidence.

## Synthesis
After ≥2 targets: update cross-site PRINCIPLES.md — what repeats is a
pattern, what's unique is their identity (and therefore off-limits).

## Binding constraint
Reference Extraction Protocol (CLAUDE.md §8). Captures live in
docs/research/refs/ only. Nothing captured ever enters apps/ or packages/ —
no assets, no copy, no verbatim CSS. Measurements and principles only.

## Anti-patterns
- Screenshotting logged-out walls and calling it a capture (use real flows).
- Recording 4K video of the whole site when one scroll pass answers it.
- Copying a hex straight from measurements.json into a token (divergence
  check exists precisely to catch this).
