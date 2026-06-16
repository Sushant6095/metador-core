# ADR-008 — Rebrand: Keel → Metador

- **Status:** ACCEPTED (founder directive, 2026-06-15).
- **Tier:** L (identity change touching every surface). Plan + audit:
  `docs/research/metador-rebrand-plan-2026-06-15.md`.

## Context
Founder strategic rebrand. **Brand replacement, not a product replacement** —
the product (consumer terminal on DeepBook Margin), architecture, roadmap,
money-safety rules, ADRs, and DeepBook integration are unchanged. Only the
identity changes: **Keel → Metador**, and a new logo (a **charging bull**)
replaces the keel-spine mark. Palette (brass `#F2A516` on slate), typography
(Fraunces + Geist + Geist Mono), and the design system are unchanged.

## Decision
1. Canonical product identity is **Metador** across all current + future work.
2. Mechanical rename (executed via scoped codemod on branch `rebrand/metador`):
   - packages `@keel/*` → `@metador/*` (8) + root `keel` → `metador`;
   - tokens `--keel-*` → `--metador-*` (89 defs, 190 consumers) and `keel-`
     classes → `metador-`;
   - identifiers `Keel*`/`KEEL_*` → `Metador*`/`METADOR_*` (`KeelLogo`→`MetadorLogo`,
     `KEEL_EVENTS`→`METADOR_EVENTS`, etc.);
   - page titles `Keel — …` → `Metador — …`; domain string → `metador.app`
     (**provisional** — final domain TBD by founder).
3. New logo: original **charging-bull** SVG mark (`MetadorMark`), brass on slate;
   `MetadorLogo` lockup + both `icon.svg` favicons regenerated. Original art.
4. **Analytics continuity preserved:** only the TS registry identifier moved
   (`METADOR_EVENTS`); event string VALUES (`page_view`, `wallet_connected`, …)
   are unchanged, so PostHog history is intact.

## Preserved (historical accuracy — NOT renamed)
- `docs/decisions/*` historical content (incl. ADR-007) — a one-line rebrand
  note was appended; wording preserved.
- `mind/journal/*`, `mind/state.md` history, past `WORKLOG.md` lines.
- `contracts/keel_core/**` — shelved Move; on-chain identifiers (`agent_mandate`)
  and verified testnet object IDs untouched. (Optional dir-rename later, with care.)
- Analytics event string values; brand-neutral env vars (`NEXT_PUBLIC_APP_URL`).

## Consequences / open
- Verification after codemod: typecheck 8/8, lint 8/8, test 8/8 — all green;
  `--keel-`/`@keel/` residuals only in regenerated `.next`/`.turbo` caches.
- **Open (founder):** confirm the production domain (placeholder `metador.app`);
  Phase F (domain + 301 redirects + OG/SEO + Vercel project + CI) pending that.
- `.claude/skills/keel-product` → `metador-product` (skill identity).
