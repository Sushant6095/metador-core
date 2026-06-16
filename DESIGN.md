# DESIGN.md — Metador

> **STATUS: PROVISIONAL FREEZE 2026-06-11 — pending founder ratification
> (BOOTSTRAP Phase F gate).** These tokens, faces, and motion values are the
> design agent's proposal. They are buildable-against now, but they are NOT
> final until the founder ratifies in the decision log. Treat any change after
> ratification as a token-freeze amendment (founder-gated).

Inputs: `PRODUCT.md` (positioning, Maya & Leo, the structural-safety thesis),
`docs/research/refs/PRINCIPLES.md` (cross-site synthesis), the three
`patterns.md` captures, and the prototype's starting-hypothesis tokens
(`docs/archive/keel-bundle/keel-ui-prototype.html`). Governed by the Reference
Extraction Protocol (CLAUDE.md §8): we ship measurements and principles, never
their fonts, palettes, copy, or assets.

---

## Brand thesis

**Metador feels like a precision instrument you can trust with your money because
you can see exactly what it can and cannot do.** It is calm, dark, dense, and
honest — a navigation instrument, not a casino. The name is nautical: a keel is
the structural spine that keeps a vessel upright and on course no matter the
weather. Metador the product is the structural spine that keeps depositor funds
safe no matter what happens to the leader's key. The brand makes that structure
*visible*.

**Color world — warm metal on cold dark.** Every benchmark in our space lives
in the same place: mint/teal/green accent on cold near-black (Hyperliquid app,
forest-green-and-mint on the Foundation site). That cold-on-cold, green-family
signature is *theirs*. **Ours is the opposite temperature: a warm brass/amber
primary on a cold, near-black slate.** Brass reads as calibrated brightwork — a
ship's fittings, an instrument needle, a signal flare — the warmest possible
distance from their mint. The canvas stays disciplined and dark (a trading
terminal's home), but the one hue that carries action and brand is *warm*, so
Metador and Hyperliquid read as two different brands the instant you see them side
by side. Up/down semantics use Metador's own values (convention demands red/green
for market direction) but they are *semantic only* — never the brand hue, never
decorative. They are also held numerically distinct from Hyperliquid's signature
pair: their buy-green is `rgb(31,166,125)` and their salmon-rose is
`rgb(237,112,136)` — two halves of a teal/green→rose signature that is *theirs*.
Metador's success is a **leaf-green off the teal axis** (`#4CB944`, OKLCH H=142.2°;
dE2000 ≥ 15 vs both their green and their mint) and Metador's danger is a **true
red-orange** (`#FF4D3E`, OKLCH H=29°; dE2000 16.5 vs their rose, where most venues
use plain red — their pink-rose is an identity marker we refuse to reproduce).
There is no teal in Metador.

**Type direction — editorial spine, engineered numbers.** Two-face logic
(borrowed as a *principle* from the Foundation site, not their faces): an
expressive **display serif** carries all brand voice; a precise **neutral sans**
does all UI and body; a **true mono** sets every numeral. Their serif is Teodor;
ours is **Fraunces** — an old-style optical serif with soft, almost wonky
terminals that read warm and human, deliberately unlike Teodor's high-contrast
cut. Their sans is Inter; ours is **Geist** — a sharper, more mechanical
neo-grotesque. The display face appears on the web surfaces and on *app moments*
(page titles, the REVOKE headline) — never inside a data row. Inside the app,
hierarchy comes from size + color + the mono/sans split, never from heavy
weights. Numbers are always tabular mono. Always.

**Voice.** Plain, exact, never hyped. We state mechanisms, not outcomes:
"This vault can trade only SUI/USDC, up to $500/day, and you can revoke it in
one click." No APY promises, no "to the moon," no fear-mongering. The claim is
always disciplined: *funds cannot be stolen; losses are capped by your ceiling*
— never "you can't lose money." Confidence is expressed through restraint:
one weight, lots of alignment, exact unrounded numbers.

**What no benchmark has — safety made visible (the brand's core).** These four
elements are Metador's identity. They are not borrowed; they are the column the
screener lacks:
1. **The plain-English policy card** — the four walls (budget, scope, expiry,
   revocability) written as a human sentence, not a settings panel.
2. **The budget meter** — a live, depleting bar of spent-vs-ceiling; the wall
   you can watch.
3. **The live activity feed** — every policy-checked action, including every
   *rejected* one, streaming in real time. The rejections are the proof.
4. **REVOKE — the designed, theatrical, irreversible-feeling moment.** This is
   the demo's emotional peak. Deep red, deliberate, weighty; a flip you feel.
   It is the one place the calm interface raises its voice. Spec in #motion.

Everything else in this document — the dark calm, the hairline depth, the
tabular numerals, the restrained motion — exists to make those four elements
feel authoritative.

---

## Tokens (the freeze proposal)

All tokens carry the **`--metador-*`** prefix. They live **only** in
`packages/design-system`; both apps consume them. No raw hex, no arbitrary
Tailwind values in app code (CLAUDE.md §1). **Dark is the product's home**; the
light ramp is defined for completeness and the web's relief sections, but the
app ships dark-first.

### Color — dark (home)

Contrast ratios computed against the stated background (sRGB, WCAG 2.1). All
text and muted pairs clear AA-normal (≥ 4.5:1); large-text-only pairs flagged.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--metador-bg` | `#0A0E14` | Base canvas — cold near-black slate, cooler & a hair darker than benchmarks | — |
| `--metador-surface` | `#111722` | Panels, cards, the data plane | — |
| `--metador-raised` | `#1A2230` | Elevated surface (modals, inputs, hover fills) | — |
| `--metador-border` | `#27313F` | Hairline dividers / surface strokes (the default depth) | — |
| `--metador-text` | `#ECEFF4` | Primary text — softened white, never pure | 16.78:1 on bg |
| `--metador-muted` | `#8A97A8` | Secondary text / labels / column headers | 6.51:1 on bg |
| `--metador-faint` | `#5C6675` | De-emphasized / disabled (large-text & non-text only) | 3.33:1 on bg (AA-large) |
| `--metador-primary` | `#F2A516` | **Brass — the brand & interactive hue.** CTAs, active state, brand mark | 9.37:1 on bg |
| `--metador-primary-bright` | `#FFC24B` | Hover / glow / emphasis step of brass | 12.04:1 on bg |
| `--metador-primary-deep` | `#B97908` | Pressed / deep brass / small-text accent on light | — |
| `--metador-on-primary` | `#0A0E14` | Text/icon ON a brass fill (= bg) | 9.37:1 on primary |
| `--metador-success` | `#4CB944` | Semantic up / positive / "live" — Metador's own leaf-green (OKLCH H=142.2°, off the teal/mint axis) | 7.67:1 on bg |
| `--metador-warn` | `#DB7E2D` | Caution / near-ceiling budget / expiring soon — burnt orange, hue-separated from brass; **always paired with an icon** | 6.48:1 on bg |
| `--metador-danger` | `#FF4D3E` | Semantic down / negative / error — true red-orange (OKLCH H=29°, L=0.671) | 5.88:1 on bg |
| `--metador-revoke` | `#E11D2A` | **The REVOKE red** — deep, arterial, used nowhere else | 4.06:1 on bg (AA-large); text ON it = pure white |
| `--metador-on-revoke` | `#FFFFFF` | Text on a revoke fill — **pure white required** | 4.76:1 on revoke |

Rules:
- **Brass is the only brand hue.** Teal is killed (the prototype's `#2DD4BF` does
  not exist in Metador — it was Hyperliquid's family). Sui-blue is not a brand color.
- `--metador-success` / `--metador-danger` are **semantic only** (market direction,
  pos/neg PnL, live status). They never decorate. Both clear the divergence gate
  (dE2000 ≥ 12 vs Hyperliquid's `rgb(31,166,125)` buy-green and `rgb(237,112,136)`
  salmon-rose) — re-checked by the section-8 table on every surface.
- `--metador-warn` (burnt orange `#DB7E2D`, OKLCH H=56.9°) is **hue-separated from
  brass** `--metador-primary` (H=74.5°, dE2000 ≈ 14.3) so a near-ceiling budget
  warning is never misread as brand/CTA emphasis on the budget meter. Warn is
  **always accompanied by an icon** (never color alone) so it is unambiguous.
- `--metador-danger` (red-orange, OKLCH H=29°, L=0.671) and `--metador-revoke`
  (`#E11D2A`, H=25.6°, L=0.582) are deliberately kept apart: danger sits lighter
  and is reusable for any negative/error state; revoke is darker, arterial, and
  single-use. They must not be confused.
- `--metador-revoke` is reserved exclusively for the REVOKE moment and the revoked
  state. Seeing this red anywhere = something irreversible just happened. On a
  revoke fill, use `--metador-on-revoke` (pure white, 4.76:1), **not** `--metador-text`
  (which is large-text-only on this red).
- Surface depth = `bg → surface → raised`, each a luminance step, separated by
  `--metador-border` hairlines. Not shadow (see Shadows).

### Focus, overlay, skeleton & state tints — dark

These are required for keyboard navigability (CLAUDE.md §4), modals, loading,
and the signature feed/meter states. Apps must use these tokens — a hardcoded
`rgba()` for any of them is a `/design-review` failure.

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--metador-ring` | `#F2A516` | Focus ring color (brass) — visible focus on every interactive element | 9.37:1 on bg / 8.70:1 on surface / 7.73:1 on raised (all ≥ 3:1 non-text) |
| `--metador-ring-width` | `2px` | Focus ring stroke | — |
| `--metador-ring-offset` | `2px` | Gap between element and ring (on dark) | — |
| `--metador-overlay` | `rgba(6,9,14,0.62)` | Modal / dialog backdrop scrim (cooled, below the near-black bg) | — |
| `--metador-skeleton-base` | `#141B27` | Skeleton placeholder base (≈ surface, a hair warmer) | — |
| `--metador-skeleton-sheen` | `#1F2937` | Skeleton shimmer highlight (≈ raised) | — |
| `--metador-tint-success` | `rgba(76,185,68,0.12)` | Positive row/banner fill (live, confirmed) | — |
| `--metador-tint-warn` | `rgba(219,126,45,0.12)` | Near-ceiling budget warn fill (with icon) | — |
| `--metador-tint-danger` | `rgba(255,77,62,0.12)` | Rejected-action row / error banner fill | — |
| `--metador-tint-revoke` | `rgba(225,29,42,0.14)` | The persistent terminal "Capability revoked" feed row | — |

Rules:
- **Focus ring is mandatory** on every interactive element (Button, Tabs,
  AddressPill, Modal controls, links): a `--metador-ring-width` brass outline at
  `--metador-ring-offset`. `:focus-visible` only — never a focus style on mouse
  click that wasn't keyboard-driven. The ring is non-text and clears 3:1 against
  bg, surface, and raised.
- **`--metador-overlay`** renders every modal/dialog backdrop, including the REVOKE
  confirm. `backdrop-filter: blur()` is **not permitted** (it is neither a
  transform nor opacity and is GPU-expensive on dense surfaces) — the scrim is a
  flat opacity fill only; this is an explicit exemption note for the motion rules.
- **State tints** (`--metador-tint-*`) are the surface fills for the live activity
  feed rows (rejected = danger tint, revoked terminal = revoke tint), the budget
  meter near-ceiling state (warn tint + icon), and confirmed-positive banners
  (success tint). 12–14% alpha keeps them legible on the dark canvas without
  competing with the foreground semantic text/icon.

### Color — light ramp (web relief sections; dark-first overall)

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--metador-bg` (light) | `#F7F5F0` | Warm paper, not stark white (pairs with brass) | — |
| `--metador-surface` (light) | `#FFFFFF` | Cards on paper | — |
| `--metador-raised` (light) | `#FBF9F4` | Elevated tint | — |
| `--metador-border` (light) | `#CFC7B6` | Hairline dividers / surface strokes on paper — **required to render Card/Table/PolicyCard hairlines** | 1.54:1 on bg (non-text divider) |
| `--metador-text` (light) | `#1A1F29` | Primary text | 15.15:1 on bg |
| `--metador-muted` (light) | `#5A6472` | Secondary | 5.51:1 on bg |
| `--metador-faint` (light) | `#8B93A1` | De-emphasized / disabled (large-text & non-text only) | 2.96:1 on bg (non-text) |
| `--metador-primary` (light) | `#B97908` | Brass deepened for legibility (small-text accent) | 3.32:1 on bg → reserve brass *fills* for large elements; use deep for inline text |
| `--metador-primary-bright` (light) | `#8F5C04` | Hover / pressed deepening of brass on paper | 5.20:1 on bg |
| `--metador-success` (light) | `#147346` | Positive — deepened to clear AA-normal (small PnL text) | 5.40:1 on bg |
| `--metador-warn` (light) | `#8F5410` | Caution / near-ceiling — burnt orange on paper (with icon) | 5.60:1 on bg |
| `--metador-danger` (light) | `#C8303E` | Negative | 4.88:1 on bg |
| `--metador-revoke` (light) | `#B5121D` | Revoke on light | 6.28:1 on bg |
| `--metador-on-primary` (light) | `#FFFFFF` | Text/icon on a brass fill (large elements) | 3.62:1 on `#B97908` (AA-large; fills only) |
| `--metador-on-revoke` (light) | `#FFFFFF` | Text on a revoke fill | 6.84:1 on `#B5121D` |

Light-mode note: on warm paper, luminous brass is AA-large only for small text, so
inline brass text uses `--metador-primary-deep`/`#B97908`; brass *fills* (buttons,
bars) carry `--metador-on-primary` (white, 3.62:1) and are large enough to pass
AA-large. Light success is deepened to `#147346` (5.40:1) so positive PnL — which
is typically small text — clears AA-normal, not just AA-large. The app does not
use light mode in v1 — this ramp exists for web storytelling sections.

### Typography

Two-face system + mono. All open-license; named with role, license, and fallback.

| Token | Family | License | Role | Fallback stack |
|---|---|---|---|---|
| `--metador-font-display` | **Fraunces** | SIL OFL 1.1 (Google Fonts) | Brand voice: web hero/section titles, app page titles, the REVOKE headline. **Not Teodor**; warm old-style optical serif. | `Fraunces, "Iowan Old Style", Georgia, "Times New Roman", serif` |
| `--metador-font-text` | **Geist Sans** | SIL OFL 1.1 (Vercel) | All UI and body. Diverges from Inter — sharper, more mechanical neo-grotesque. | `"Geist Sans", "Inter var", -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--metador-font-mono` | **Geist Mono** | SIL OFL 1.1 (Vercel) | **Every numeral on money/market surfaces**, addresses, code, wallet chips, the order book. | `"Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |

> Font loading per CLAUDE.md/perf: subset, `font-display: swap`, preload only the
> critical display weight + the text-regular weight. Mono loaded where data renders.

**Modular scale — ratio 1.25 (major third), anchored at 16px.** Inherited from the
benchmark range (~1.20–1.25 mid, widening to ~1.5 at the display end). The size
ladder is **strictly monotonic** so token names map 1:1 onto Tailwind v4's
`--text-*` ladder without inverting the ecosystem order (a named token never
renders smaller than the next-larger name).

| Token | px | Typical use | Line-height |
|---|---|---|---|
| `--metador-text-2xs` | 12 | Micro-labels, table headers, tiny mono | 1.25 (15px) |
| `--metador-text-xs` | 13 | Dense data cells, micro-captions | 1.4 |
| `--metador-text-sm` | 14 | Data cells, secondary labels, captions | 1.25 (≈17px) |
| `--metador-text-base` | 16 | Body, primary readouts | 1.5 (24px) |
| `--metador-text-lg` | 20 | Card titles, sub-headings | 1.4 |
| `--metador-text-xl` | 25 | Section sub-heads | 1.3 |
| `--metador-text-2xl` | 31 | App page title (H1) | 1.2 |
| `--metador-text-3xl` | 39 | Web section title | 1.1 |
| `--metador-text-4xl` | 49 | Web hero secondary | 1.05 |
| `--metador-text-5xl` | 64 | Web hero headline (display serif, set solid) | 1.0 |

Scale derivation: 16 is the anchor; ×1.25 climbs 20, 25, 31, 39, 49, ~61→64 (top
step rounded for a clean display size). **The 13px and 14px steps are off-scale
app-density exceptions, not modular-scale members** — they exist only to tier
dense data tables on the trading surface and are placed monotonically (12 → 13 →
14 → 16) so `2xs < xs < sm < base` holds by name.

**Weight tokens:** `--metador-weight-regular: 400` (workhorse), `--metador-weight-medium: 500`
(emphasis / active), `--metador-weight-semibold: 600` (display titles, CTA labels only).
No 700+ in data. Hierarchy is size + color + face, not weight.

**Numeral rule (law):** every numeral that represents money, a price, a size, a
percentage, a count, a date, or any market/ledger value is set in `--metador-font-mono`
with `font-variant-numeric: tabular-nums lining-nums`. Numeric table columns are
right-aligned. This is not optional and not surface-specific — it is the trading
product's spine. Marketing display numbers on web may use the display face for effect,
but any *real* number is mono+tabular.

### Spacing — 4px base, 8px workhorse

`--metador-space-*`. Scale: **4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96**. Inherited
directly from the benchmark consensus (4px sub-grid, 8px the single most frequent
gap, 24px section separation in apps, larger gaps on the site).

| Token | px | Use |
|---|---|---|
| `--metador-space-1` | 4 | Sub-grid, icon/label tightening |
| `--metador-space-2` | 8 | **Workhorse** — default gap, row padding |
| `--metador-space-3` | 12 | Grouping within a component |
| `--metador-space-4` | 16 | Card padding, control spacing |
| `--metador-space-6` | 24 | Section separation (app) |
| `--metador-space-8` | 32 | Block spacing |
| `--metador-space-12` | 48 | Web sub-section gaps |
| `--metador-space-16` | 64 | Web section gaps |
| `--metador-space-24` | 96 | Web hero / large narrative gaps |

App data rows use `space-2` (8px) vertical padding for density; the web reserves
`space-12`+ for the airy storytelling rhythm. Same scale, opposite ends.

### Radii — `--metador-radius-*`

Inherited app range (5–12px, 8px workhorse), one larger step for web. **No full
pills** (the Foundation site's 60px pill is their signature).

| Token | px | Use |
|---|---|---|
| `--metador-radius-xs` | 4 | Chips, tags, the tx-hash chip (AddressPill) |
| `--metador-radius-sm` | 6 | Buttons, inputs, small controls |
| `--metador-radius-md` | 8 | **Workhorse** — cards, panels, the policy card |
| `--metador-radius-lg` | 12 | Larger cards, modals |
| `--metador-radius-xl` | 18 | Web hero cards only (the one larger step) |
| `--metador-radius-full` | 999 | Status dots & avatars ONLY — never pill buttons |

### Shadows — layered, low-opacity, hue-tinted

Default depth is hairline + value step (per consensus). Real shadows are reserved
for floating layers and *mean* "this floats." Tints are cool to sit on the dark
canvas; the REVOKE shadow is warm-red to feel like heat.

| Token | Value | Use |
|---|---|---|
| `--metador-shadow-none` | `none` | Default for in-plane surfaces (use border instead) |
| `--metador-shadow-raised` | `0 1px 2px rgba(4,7,12,.4)` | Subtle lift for hover on cards |
| `--metador-shadow-float` | `0 12px 28px -8px rgba(6,10,20,.55), 0 2px 6px rgba(6,10,20,.4)` | Dropdowns, popovers, toasts |
| `--metador-shadow-modal` | `0 24px 56px -12px rgba(4,7,12,.7), 0 4px 12px rgba(4,7,12,.5)` | Modals / the REVOKE confirm |
| `--metador-glow-primary` | `0 0 24px -4px rgba(242,165,22,.45)` | Brass glow — CTA emphasis, web hero relief (use sparingly) |
| `--metador-glow-revoke` | `0 0 32px -2px rgba(225,29,42,.5)` | REVOKE moment only — warm-red heat bloom |

### Z-layers — `--metador-z-*`

| Token | Value | Layer |
|---|---|---|
| `--metador-z-base` | 0 | Canvas / data plane |
| `--metador-z-elevated` | 10 | Sticky headers, raised panels |
| `--metador-z-floating` | 100 | Dropdowns, popovers, tooltips |
| `--metador-z-modal` | 1000 | Modals, the REVOKE confirm dialog |
| `--metador-z-toast` | 2000 | Transaction toasts (always on top) |

---

## #motion

Built in **Motion (motion.dev)** only (CLAUDE.md §10). **Transform and opacity
only — 60fps.** Never animate width/height/top/left/margin/padding/border/
font-size (layout-bound, off the compositor). Motion exists for a reason: state
change, spatial orientation, or feedback. Decorative motion needs design-agent
signoff. All motion respects `prefers-reduced-motion` (cut to instant or a
≤80ms opacity fade).

### Duration tokens — `--metador-duration-*`

Inherited from the benchmark ranges (app feedback ~120–180ms; site ambient
multi-second). The ladder:

| Token | ms | Use |
|---|---|---|
| `--metador-duration-fast` | 120 | Hover, active, focus, tab-underline, color-flash on data change |
| `--metador-duration-base` | 200 | Toasts in, dropdowns, small state transitions |
| `--metador-duration-slow` | 320 | Modal enter, page-section transitions, card expand |
| `--metador-duration-hero` | 520 | Web hero reveals, individual REVOKE sequence beats |
| `--metador-duration-ambient` | 6000 | Web hero ambient loop base (decoupled from scroll, eased) |

`--metador-duration-ambient` is a single pinned value (6000ms). Longer ambient loops
are **per-instance Motion overrides**, not token values — the token gives the base;
a specific scene that needs a slower loop sets its own duration in its Motion call.

App data freshness target: **< 100ms perceived** — instant updates + color-flash
are the cockpit's real "motion," not easing curves.

### Skeleton (loading) — `--animate-skeleton`

Skeleton placeholders use the `--metador-skeleton-*` colors (above) with an
**opacity-only** pulse (honors the transform/opacity rule — no animated gradient
position, no layout-bound properties). Authored in Tailwind v4's `--animate-*`
namespace with a paired `@keyframes`:

```css
@theme {
  --animate-skeleton: skeleton-pulse 1.4s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
```

The base fills with `--metador-skeleton-base`; the pulse breathes between the base and
the `--metador-skeleton-sheen` highlight via opacity, never a moving sheen position.

### Easing tokens — `--metador-ease-*`

| Token | cubic-bezier | Use |
|---|---|---|
| `--metador-ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things appearing (ease-out expo — decisive arrival) |
| `--metador-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving (ease-in — quick departure) |
| `--metador-ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric state changes (hover, tab) |

**Spring — TS export, not a CSS token.** A spring config is not a CSS-consumable
value and Motion cannot read it from a custom property, so it ships as a typed
constant from `packages/design-system`, consumed directly by Motion:

```ts
// packages/design-system — motion springs (Motion API)
export const springMeter = { type: 'spring', stiffness: 180, damping: 22 } as const;
```

Use `springMeter` for budget-meter fills and depleting bars (a settling, physical
feel). Note: `damping: 22` is Motion's raw damping **coefficient**, not a ratio —
there is no `0.8` ratio here; pair it with the stated `stiffness` as-is.

### Choreography rules

- **Enter** with `--metador-ease-enter`; **exit** with `--metador-ease-exit`. Most app
  state changes use `--metador-ease-standard` at `--metador-duration-fast`.
- **Stagger** lists/feeds at **40–60ms** per item, **max 8 items** animated; beyond
  8, the rest appear instantly (no long cascades on a money screen).
- **Layout stays still; only data moves.** On trading surfaces, numbers tick/flash
  on update (a 120ms color-flash toward success/danger then back to text), the
  activity feed slides one new row in from the top (translateY + opacity), the
  budget meter springs to its new fill. Nothing slides the layout around balances.
- **What animates:** opacity (reveals, feed rows), transform translateY/scale
  (entrances, hovers ≤2px lift, the meter), the brass underline on active tabs,
  the data color-flash, the web hero ambient loop (one slow eased element per
  section), count-up on stat numbers entering view.
- **What NEVER animates:** layout geometry on data surfaces, anything decorative on
  the cockpit, more than one ambient element per web section, parallax stacks,
  `transition: all`, font-size, or any money value's *position* while it updates
  (it flashes color in place; it never jumps).

### REVOKE moment — choreography spec (the demo's emotional peak)

REVOKE is the one place the calm interface raises its voice. It must feel weighty,
deliberate, and irreversible. All animation is transform/opacity. Reduced-motion =
instant state swap with the copy intact. Budgets are **per beat**, not a single
total — the honest end-to-end duration is ~1.2–1.5s of motion plus the user's own
hold time and the on-chain confirmation wait (which is not a fixed animation).

1. **Arm (intent).** On clicking Revoke, a `--metador-z-modal` confirm dialog enters
   over a `--metador-overlay` scrim (scale 0.96→1, opacity 0→1, `--metador-ease-enter`,
   **`--metador-duration-slow` = 320ms**) under `--metador-shadow-modal`. The confirm
   button is `--metador-revoke` fill with `--metador-on-revoke` (pure white) text and the
   display face on the headline — "This cannot be undone." **Friction mechanism is
   hold-to-confirm** (committed, not optional): the user presses and holds the
   confirm button for **800ms** while a brass→revoke fill sweeps the button to 100%;
   releasing early cancels with no side effect. (Type-to-confirm is explicitly *not*
   used — hold-to-confirm is faster to film and reads as deliberate on stage.)
2. **Commit (the flip).** On hold-complete the revoke tx is submitted. **On
   on-chain success:** the vault's status badge crossfades to **REVOKED** in
   `--metador-revoke`; a brief `--metador-glow-revoke` heat bloom pulses once (opacity
   0→0.5→0 over **`--metador-duration-hero` = 520ms**) behind the badge; the budget
   meter desaturates and locks; the policy card stamps a REVOKED overlay.
3. **Settle (irreversible).** The action surfaces (Trade/Delegate buttons) fade to
   disabled (`--metador-faint`), and a new **terminal** row lands at the top of the live
   activity feed — "Capability revoked · irreversible" on a `--metador-tint-revoke`
   fill in revoke red. The feed row does not auto-dismiss; the red persists. The
   interface returns to calm, but the state is permanently changed and visibly so.

**Failure path (funds-path moment — required).** Between Arm-complete and
Commit-success the on-chain revoke can fail or be rejected. While the tx is
in flight the confirm button enters a loading state (label "Revoking…",
`--animate-skeleton` is *not* used here — a brass spinner on the button). If the
wallet **rejects** the signature, the dialog stays open, returns to its armed-idle
state, and shows a muted inline note ("Signature cancelled — nothing changed").
If the tx **fails on-chain** (abort), the dialog shows a `--metador-tint-danger`
banner with the human-readable reason via `docs/abort-codes.md`, the badge does
**not** flip, and no terminal feed row is written — the only state change is a
normal rejected-action row in the feed. The REVOKED flip (beat 2) fires only on
confirmed success; nothing about the irreversible visual language appears until
the chain confirms.

The emotional design: arming feels heavy (the 800ms hold + modal weight), the flip
feels like heat (the single warm-red bloom on a cold canvas), and the aftermath
feels *settled and permanent* (desaturation, the persistent terminal feed row). It
is the only moment Metador uses the revoke red, and the only moment it glows warm-red.

---

## Divergence self-check (CLAUDE.md §8 — must PASS before freeze)

| Axis | Hyperliquid Trade | Hyperliquid Vaults | Hyper Foundation site | **Metador** | Verdict |
|---|---|---|---|---|---|
| **Primary hue family** | Mint-teal `~rgb(80,210,193)` on cold near-black | Mint-teal `~rgb(80,210,193)` on near-black | Bright mint `rgb(151,252,228)` on deep forest green | **Warm brass/amber `#F2A516`** on cold near-black slate | **PASS** — opposite temperature (warm vs cold), opposite hue family (orange-yellow vs green-teal). No teal anywhere in Metador. |
| **Semantic up/down pair** | Buy-green `rgb(31,166,125)` + salmon-rose `rgb(237,112,136)` | Same buy-green + salmon-rose | (marketing greens) | **Success `#4CB944`** (OKLCH H=142.2°) + **danger `#FF4D3E`** (OKLCH H=29°) | **PASS** — numeric gates met: success dE2000 **15.4** vs their `rgb(31,166,125)` and **23.4** vs their `rgb(80,210,193)` mint; danger dE2000 **16.5** vs their `rgb(237,112,136)` rose. Both clear the **≥ 12** gate vs *both* HL signature values. `/design-review` re-runs this row on every surface. |
| **Display typeface** | None (single sans) | None (single sans) | **Teodor** (high-contrast serif) + Inter | **Fraunces** (warm old-style optical serif, SIL OFL) + **Geist** sans | **PASS** — distinct serif character (soft optical vs high-contrast Teodor); sans diverges from Inter (Geist). |
| **Numerals** | Tabular-feeling sans | Tabular-feeling sans | Non-tabular marketing sans | **True mono** (Geist Mono), tabular everywhere | **PASS** — engineered mono numerals exceed all three. |
| **Canvas read** | Cold dark blue-green slate | Cold dark blue-green slate | Warm deep-green immersive | Cold near-black slate `#0A0E14` (cooler, no green tint) | Shared *darkness*, diverged *hue* — base is neutral-cold, not green-tinted. |
| **Signature move** | Latency-as-motion, mint CTA | TVL hero number, mint accent | Morphing green field, serif gravitas | **Safety made visible** (policy card / budget meter / live feed / theatrical REVOKE) + warm-metal accent | **PASS** — Metador's signature elements have no analog in any benchmark. |
| **Overall brand read** | "Cold green pro exchange" | "Cold green screener" | "Calm green foundation" | "Warm-brass precision safety instrument" | **PASS** — a stranger reads two different brands at a glance: warm vs cold, brass vs mint, Fraunces vs Teodor. |

All axes PASS. The freeze is divergence-clean and on the legally-safe line: Metador
ships its own faces (open-license), its own palette (warm family, distinct values),
and its own signature surfaces — never their assets, copy, or hues.

> **Founder acknowledgment at ratification (non-blocking):** divergence on
> typeface hangs on the *display* face (Fraunces vs Teodor — different
> construction class). The *body* sans is Geist, an Inter-class neo-grotesque;
> the benchmark sans is Inter. This is intentional (we asked for a near-match
> with a different character, not a different category) and acceptable because
> the display face carries the typographic divergence — but the founder should
> consciously sign off on Geist-near-Inter at the Phase F gate.

---

## What ships where

- **Tokens live once, in `packages/design-system`.** Both `apps/web` and `apps/app`
  consume them via the token layer (CSS custom properties + Tailwind config bound to
  the same `--metador-*` vars). No app-local colors, fonts, spacing, radii, or motion
  values — ever.
- **No raw hex, no arbitrary Tailwind values in app code** (CLAUDE.md §1). A diff
  introducing a literal color, a one-off `font-size`, or a hardcoded duration in an
  app is wrong by definition and fails `/design-review` (token compliance).
- **Shared components** consuming these tokens live in `packages/ui`; apps compose,
  never fork.
- **Motion** is implemented with Motion (motion.dev). Durations are authored here in
  ms; Motion's JS API takes **seconds**, so `packages/design-system` exposes numeric
  *second* constants alongside the CSS vars (no string-parsing layer), plus the
  `springMeter` spring config (above). `lightweight-charts` for candles/NAV;
  Spline/Three.js on the web hero only (lazy, behind a static poster), banned from
  the trading app.
- **Tailwind v4 mapping (so other agents build against it correctly):** colors,
  radii, shadows, weights, and easings map 1:1 onto `@theme` namespaces
  (`--color-*`, `--radius-*`, `--shadow-*`, `--font-weight-*`, `--ease-*`); use the
  `@theme inline` pattern (raw `--metador-*` in `:root`, aliased as `--color-keel-*`)
  so the dark/light ramps reusing the same names actually theme-switch. **Tailwind
  v4 has no `@theme` namespace for z-index or transition-duration** — `--metador-z-*`
  and `--metador-duration-*` stay plain vars consumed via `z-(--metador-z-modal)` /
  `duration-(--metador-duration-fast)`; do not expect `z-modal`/`duration-fast`
  utilities for free. The 4px spacing ladder uses explicit `--spacing-*` entries
  (closed ladder — no off-ladder steps like `p-5`=20px).
- **`/design-review`** judges every screen side-by-side against its benchmark
  screenshot and re-runs the divergence check on every new surface. **The design
  agent holds visual veto.** Nothing ships over that objection except by founder call.

---

> Reminder: this is a **PROVISIONAL FREEZE**. The brass primary, the Fraunces +
> Geist + Geist Mono faces, the contrast-verified ramps, and the REVOKE
> choreography are the design agent's proposal under the Design God charter. The
> founder ratifies at the BOOTSTRAP Phase F gate; only then do these tokens become
> the immutable freeze.
