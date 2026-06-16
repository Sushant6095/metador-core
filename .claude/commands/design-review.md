---
description: Visual review of a screen against tokens and its benchmark screenshot. Run side-by-side, not from memory. Includes the divergence check. Design agent's verdict is binding.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [route or component]
---

Review: $ARGUMENTS — side by side against its benchmark artifact from
docs/research/refs/ (screenshot at matching viewport). Output table:
item · PASS/FAIL · evidence.

## Checklist
1. TOKENS ONLY: zero raw hex / arbitrary Tailwind values in the diff
   (grep `#[0-9a-fA-F]{3,6}` and `\[\d+px\]` in app code).
2. HIERARCHY: one primary action per screen; reading order survives squint
   test; numbers in tabular mono.
3. STATES: loading, empty, error all designed (not just present).
4. BENCHMARK PARITY: information density and alignment quality not visibly
   worse than the benchmark screenshot at 390 and 1440.
5. MOTION: transform/opacity only; durations/easings from DESIGN.md#motion;
   no decorative motion without design signoff; 60fps under DevTools perf.
6. LAYOUT STABILITY: live updates (prices, feed rows) cause zero layout
   shift; CLS < 0.05 on the route.
7. A11Y: keyboard path through the primary flow; visible focus; AA contrast
   (check token pairs).
8. DIVERGENCE CHECK: primary hue family differs from every benchmark;
   display typeface differs; screenshot of ours next to closest reference
   reads as two different brands. Required before token freeze and on every
   new surface.
9. KEEL IDENTITY PRESENT: policy card / budget meter / activity feed / revoke
   treated as hero elements where they appear, not buried.

VERDICT: SHIP / ITERATE (≤3 design-loop iterations) / VETO (escalate).
