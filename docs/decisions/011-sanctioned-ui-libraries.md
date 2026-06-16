# ADR-011 — Sanctioned UI libraries (supersedes CLAUDE.md §10 single-animation rule)

- **Status:** ACCEPTED (founder override, 2026-06-17).
- **Tier:** M (tooling/design-system policy).

## Context

`CLAUDE.md §10` named **Motion (motion.dev) as the single animation library**, with
anime.js "only via ADR." The full-site refactor needs more polish sources for the
landing while keeping the trading app fast and disciplined.

## Decision

Authorize these UI sources, each subject to the conditions below:

- **shadcn/ui + Radix** — primitives (dialog, dropdown, popover, tooltip, tabs,
  segmented control, command palette). Scaffold, then port into `packages/ui`.
- **21st.dev & vibecodecomponents.com** — heroes, bento grids, feature/marquee/stat
  sections, cards. **Landing (`apps/web`) first.**
- **Spline** (`@splinetool/react-spline`) and **three** — landing hero 3D only, lazy
  behind a static poster (LCP < 2.5s). **Banned in the trading app.**
- **anime.js** — landing timeline/scroll flourishes (`apps/web` only). **Motion stays
  the default** for React/app state animation; anime.js is the landing-flourish layer.
  This is the ADR §10 calls for.
- **Apache ECharts** — analytics charts in `apps/app` (green series, dark grid, Inter
  tabular labels), tree-shaken + lazy. `lightweight-charts` stays for the
  candle/order-book terminal.
- **cmdk** (⌘K), **Lenis** (landing smooth scroll).

## Conditions (non-negotiable)

1. **Re-theme everything** to the green `--metador-*` tokens + Inter before shipping.
   No default themes (no shadcn zinc), no foreign fonts, no raw hex / arbitrary
   Tailwind — `/design-review` token compliance must pass.
2. **License-check** each source before shipping; record any attribution needs.
3. **Scope discipline:** flashy libs (Spline, anime.js, gallery sections) on the
   **landing**; the trading app stays GPU-light (dense tables, minimal motion). Never
   paste gallery components into data tables.
4. Shared components get ported into `packages/ui`; apps compose, never fork.

## Consequences

Supersedes the §10 "single animation library" constraint (Motion remains the app
default). Future sessions and `/design-review` treat these as approved, so they are not
flagged — provided the re-theme + license conditions are met.
