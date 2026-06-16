# ADR-010 — Hyperliquid-aligned identity: green palette + Inter (founder override)

- **Status:** ACCEPTED (founder override, 2026-06-17). Supersedes the divergent
  brass/Fraunces identity.
- **Tier:** L (brand + design-system change; no funds-path code touched).

## Context

The prior identity (ADR/DESIGN era) mandated a *divergent* brass-on-dark palette and
a Fraunces display serif, with `CLAUDE.md §8`, the `DESIGN.md` Divergence Self-Check,
and `PRINCIPLES.md §5` all requiring Metador to read as a different brand from
Hyperliquid at a glance — partly as a legal-safety line. The founder has now chosen
to **align** Metador's palette and typography with the Hyperliquid family for a
familiar, peer-grade trading aesthetic.

## Decision

1. **Palette → green.** Primary `#50d2c1` (mint/teal) on the existing cold near-black
   neutrals; success `#1fa67d`, danger `#ed7088` (salmon), warn `#ff8c00` (orange
   series). Hard red `#e11d2a` kept ONLY for the REVOKE moment. No brass/amber
   anywhere except `--metador-warn`. Light ramp uses a darker green `#0f9c78`.
2. **Type → Inter.** Inter for display, UI, body, and **numerals** (tabular-nums,
   not monospace — HL convention). A real monospace (`JetBrains Mono`, new token
   `--metador-font-code`) is retained ONLY for addresses, tx hashes, and code.
   Fraunces and Geist are dropped.
3. **Logo stays original.** A new geometric "M"-with-keel-point monogram replaces the
   bull; we do **not** copy Hyperliquid's mark. See
   `packages/design-system/src/logo/DECISION.md`.

## What this supersedes

- **`CLAUDE.md §8`** (Reference Extraction — "never ship a palette indistinguishable
  from theirs / their fonts"): superseded for palette + type. The asset rules still
  hold — we ship no Hyperliquid logo, image, font file, or verbatim CSS; the mark
  stays original. The legal-safety rationale is accepted as a founder risk decision.
- **`DESIGN.md` Divergence Self-Check** and **`PRINCIPLES.md §5`**: the "must differ
  from Hyperliquid" mandate is retired; replaced by a brand-*consistency* check.
- **`/design-review` checklist item 8**: divergence → brand-consistency (done).

## Consequences

- All token-compliant surfaces re-skin to green automatically (single source of truth
  in `tokens.css`); `/design-review` no longer self-vetoes on hue.
- Numerals across the app shift from monospace to Inter tabular; addresses/code keep
  real mono via `--metador-font-code`.
- Per-screen passes apply `font-code` to any remaining address/hash spots that still
  use the numeric `font-mono` utility.

## Verification

`pnpm typecheck && pnpm lint && pnpm test` green (8/8 each, 48 tests). Both apps render
green + Inter with zero brass; screenshot-verified at 1440 + 390.
