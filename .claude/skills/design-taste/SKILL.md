---
name: design-taste
description: Taste enforcement for Metador UI. Use when building or reviewing any visual surface — fires on generic AI-slop styling, token violations, weak hierarchy, or trading-UI anti-patterns. Adapted in spirit from Leonxlnx/taste-skill (attribution; rewritten for Metador).
---

# Design Taste (Metador)

## The bar
Hyperliquid/Linear-grade: dense, calm, dark, intentional. A screen should
look like it was designed by one opinionated person, not assembled.

## Procedure when judging a surface
1. Squint test: is there exactly one focal point and a clear reading order?
2. Token audit: every color/space/radius from design-system. One-off = veto.
3. Number audit: ALL numerics tabular mono, right-aligned in tables,
   consistent decimals per asset. Money is typography's first citizen here.
4. Density check vs benchmark screenshot: we run dense-but-breathing;
   padding inflation reads amateur, cramming reads desperate.
5. Hierarchy by weight/size/color-step — never by adding boxes in boxes.
6. Motion: does it explain a state change or orient in space? If neither,
   delete it. 150–250ms, ease-out, transform/opacity only.
7. Metador identity present: policy card, budget meter, activity feed, REVOKE
   are hero elements — if a screen has them and hides them, veto.

## Instant-veto list (AI-slop tells)
- Default Tailwind palette colors (indigo-500/blue-600) anywhere.
- Flat `shadow-md` on cards; gradient-on-everything; glassmorphism blur soup.
- Emoji as icons in product UI. Centered hero text on data screens.
- Three different border radii on one screen; mixed icon sets.
- `transition-all`; spinners where skeletons belong; toasts for non-events.
- Buttons that look clickable but aren't focusable (a11y failure = taste
  failure).

## When it fires
State the violation, the rule it breaks, and the minimal fix — then iterate
within the Design Loop (≤3) or escalate to the design agent's veto.
