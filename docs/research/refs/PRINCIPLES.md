# PRINCIPLES.md — cross-site synthesis (reference lab)

Status: synthesis of three captured benchmarks · 2026-06-11 · feeds the DESIGN.md
provisional freeze. Per CLAUDE.md §8, everything here is **measurement, IA, pattern,
and principle in our own words** — no benchmark fonts, palettes, copy, or assets cross
into Keel. Values are recorded as *ranges and ratios Keel inherits*, never as
"use this hex."

Sources synthesized:
- `hyperfoundation.org/patterns.md` — main-site storytelling/motion benchmark (apps/web).
- `app.hyperliquid.xyz-trade/patterns.md` — cockpit density/latency benchmark (apps/app).
- `app.hyperliquid.xyz-vaults/patterns.md` — marketplace/screener benchmark (apps/app).

(Sui-convention benchmarks — Suilend, Typus, Kai, Bluefin — are captured during G2 and
will extend this file; v1 synthesis is the Hyperliquid family + the Foundation site.)

---

## 1. Where all benchmarks AGREE (the inherited consensus)

These are the patterns every surface converges on. Keel adopts the *principle*, not the
values.

### 1.1 Calm-dark, near-monochrome canvas
All three sit on a very dark, desaturated base and let **one accent + a directional
semantic pair** carry every bit of color meaning. The trade cockpit runs ~13 distinct
foreground colors total for an extremely information-dense screen. There is no decorative
third hue anywhere. **Principle Keel inherits:** one brand/interactive hue, one
up/down semantic pair, nothing decorative. Restraint is the trust signal.

### 1.2 Hierarchy from size + color, almost never from weight
- Foundation: effectively one weight on mobile (400), 300+400 at desktop. No bold.
- Trade: 1221 of 1225 nodes at weight 400; ~4 at 500.
- Vaults: ~99% at 400, a sprinkle of 500.
**Principle:** keep weight near-monotone (one workhorse + one emphasis step). Build
hierarchy from *type size and color*, not from stacking weights. Bold is noise on a
number grid.

### 1.3 Depth by luminance step + hairline, not shadow
Every benchmark separates surfaces with a ~1-step-lighter fill and a thin low-alpha
border. Each app surface contains **exactly one** real box-shadow in the whole capture,
reserved for a single floating element (popover/dropdown/modal). The Foundation site's
only "shadow" is a colored *glow* (bloom), not Material elevation.
**Principle:** value-step + hairline is the default depth language. A real drop-shadow is
an exception that *means* "this floats" — reserve it for toasts, modals, and the REVOKE
confirm.

### 1.4 Tabular / column-aligned numerics are the backbone of trust
On both app surfaces, prices, sizes, TVL, APR, and order-book ladders are visibly
decimal/column-aligned and read as monospaced-rhythm even within a sans family. Precise
unrounded currency ("$313,716,013.75") is itself the credibility signal. (The Foundation
*site* is the counter-example — its big marketing numbers are NOT tabular, because they're
presentation, not a live ledger. That gap is exactly what Keel must close on its app.)
**Principle:** every numeral on a money/market surface is tabular and digit-aligned.
Keel goes further than the apps by setting them in a true mono.

### 1.5 Motion is restrained and purposeful
- Apps: **no JS animation library at all.** Motion is data-driven — numbers tick/flash on
  update, books re-render live, sparklines refresh. Layout stays *still*; only data moves.
  Latency feel (<100ms freshness) IS the motion design.
- Site: motion is one slow, eased, ambient element per section (a multi-second morphing
  field), manual stepped reveals for complex diagrams, count-up stats on enter. Never
  frenetic, never parallax-soup.
**Principle:** on trading surfaces, invest in instant updates + a live indicator +
color-flash on change, not decorative easing. On the landing, one slow ambient element per
section. Decorative motion needs a reason.

### 1.6 Trust = transparency + concrete numbers, never promises
All three lead with proof: a single aggregate hero number (TVL), per-row radical
transparency (leader address, signed/color-coded APR shown even when negative), a green
"live" status dot, full market context with no clicks ("nothing hidden"), the explicit
risk field (liquidation price) kept visible before action. Zero APY/earnings language;
operational metrics framed as proof.
**Principle:** lead each surface with one aggregate proof number, then per-row radical
transparency. Show the downside plainly. This maps cleanly onto Keel's claim discipline
("losses capped, never absent").

### 1.7 Desktop-dense, mobile-linearized; everything actionable above the fold
Both apps pack maximal context into one non-scrolling desktop viewport (cockpit = 5+ live
regions; vaults = ~10 rows × 7 columns) and collapse to a tabbed/stacked single column at
≤768. Real semantic landmarks were *absent* in their canvas/JS renders — a note Keel
treats as an a11y obligation, not a pattern to copy.
**Principle:** screener/cockpit density on desktop, graceful tabbed linearization at
≤768, everything important above the fold — but with real semantic HTML where they had
none.

---

## 2. Where benchmarks DIFFER (and what that tells Keel)

| Axis | Foundation site | Trade cockpit | Vaults screener | Keel's read |
|---|---|---|---|---|
| **Type system** | Two faces: expressive serif display + neutral sans body | Single sans, no display | Single sans, no display | App = single workhorse + mono; **site = adds a display face** for voice. Keel runs one system across both: display face appears on web + on app *moments* (the REVOKE, page titles), never in data rows. |
| **Scale** | Rich-ish cascade, ~1.25 mid widening to ~1.5 at display end, anchored ~16px | Binary tier (~12 data / ~16 readout), ratio ~1.33 reads as 2 tiers not a scale | Tight utilitarian ~1.15–1.3, only H1 (~28–34) breaks rank | Keel needs BOTH: a true modular scale for web storytelling AND a tight binary data/label lockup for the app. One scale, two usage modes. |
| **Radii** | Large + friendly: 60px pills dominant, 12–37 for chips | Gentle 8px workhorse, 5px chips, nothing pill | Restrained ~8px near-universal, occasional 10–12 | App is calm/squared (~8–10px); site can go larger. Keel: small radii in app, one larger step allowed on web cards/CTAs — but **not** their 60px pill (too "their brand"). |
| **Density** | Low — one narrative beat per viewport, 130–250px section gaps | Maximal — 5+ live regions, zero scroll | High — screener, 7 cols, ~8px row padding | Keel inherits *both poles*: airy web, dense app. Same spacing scale, opposite ends. |
| **Color temperature** | Warm-ish dark (deep forest *green*) + bright mint | Cold dark blue-green slate + mint | Cold dark blue-green + mint | All three are **cold + green/teal-accented.** This is the opening: Keel goes the opposite temperature on the accent (warm) to read as a different brand instantly. See §3. |
| **Surface affordance** | Tonal bloom/glow around accent | Hairline + value step only | Hairline + value step only | App = hairline discipline (copy it). Web = one restrained glow permitted as relief, in Keel's own hue. |

**The key divergence opportunity:** the three benchmarks differ on type-richness, radii,
and density — but they *agree* on cold-dark + teal/green/mint accent. That agreement is
their shared family signature, and therefore the exact axis Keel must leave.

---

## 3. The measured ranges Keel inherits (the freeze inputs)

Recorded as ranges/ratios. DESIGN.md picks Keel's exact values inside these envelopes,
with hue/face deliberately diverged.

### Type scale
- **Anchor:** ~14–16px base across benchmarks (apps anchor ~12–14 data / 16 readout; site
  anchors 16).
- **Ratio:** mid-range **~1.20–1.25**, widening to **~1.5** at the display end (site only).
  Keel inheritance: a **~1.25 modular scale** spanning 12 → 64px, with the data/label tier
  living as a tight **12/14 + 16** lockup (the app's binary tiering inside the same scale).
- **Line-height:** two-mode — **~1.25** on dense data text, **~1.5** on body, **~1.0–1.05**
  on display headlines set solid.
- **Weight:** workhorse 400 + one emphasis step (500–600). No heavy/black in data.
- **Numerals:** tabular/lining everywhere on money surfaces — Keel upgrades the implied
  tabular-sans to a *true mono* for all numerals.

### Spacing
- **Sub-grid:** 4px. **Working unit:** 8px (the single most frequent gap on every app
  surface); 10px common on the cockpit.
- **Grouping:** 12 / 16px. **Section separation:** 24px (app) up to 40–100px+ (site).
- Keel inheritance: **4px base, 8px workhorse**, scale 4/8/12/16/24/32/48/64/96; tight row
  padding (8–10px) for app density, large section gaps reserved for web.

### Radii
- Range across benchmarks: **5 → 12px** in the apps (8px workhorse), up to 60px pills on
  the site. Keel inheritance: **6–12px in the app** (8px workhorse, 12px on cards),
  one larger step (~16–20px) permitted on web hero cards — **no full pills** (theirs).

### Shadows
- Apps: exactly one soft, large-offset, cool-tinted drop (`~0 20px 32px -8px @ ~0.25`
  alpha) for the single floating layer. Site: one colored *glow/bloom*.
- Keel inheritance: **layered, low-opacity, hue-tinted** shadows; default depth is
  hairline + value step; a real shadow only on floating/modal/toast/REVOKE layers.

### Motion durations (timings observed/implied — build in Motion per stack)
- App feedback transitions: **short, functional, ~120–180ms** (hover/active/tab, color-
  flash on data change). Data freshness target **<100ms** perceived.
- Site ambient loops: **multi-second, eased**, decoupled from scroll; count-up stats on
  enter; manual stepped diagram reveals (no autoplay).
- Keel inheritance: a **fast/base/slow/hero** ladder roughly **120 / 200 / 320 / 520ms**,
  ease-out on enter, ease-in on exit, a gentle spring for meters; stagger **40–60ms**, max
  8 items. (Exact tokens in DESIGN.md #motion.)

---

## 4. What no benchmark has — Keel's whitespace to own

None of the three has any of the following, because none of them enforce safety
structurally — they *promise* it or assume custody:
- A **plain-English policy card** ("This vault can trade only SUI/USDC, up to $X/day,
  expires in N days, revocable any time").
- A **budget meter** showing spent-vs-ceiling as a live, depleting bar.
- A **live activity feed** of every policy-checked action (and every *rejected* one).
- **REVOKE** as a designed, theatrical, irreversible-feeling moment — the demo's emotional
  peak.

These are not borrowed patterns. They are Keel's identity and its column the screener
lacks. **Safety made visible is the brand.** Every other principle above is in service of
making these four elements feel authoritative, calm, and trustworthy.

---

## 5. Divergence mandate (carried into DESIGN.md)

The benchmarks' shared signature is **mint/teal/green accent on cold near-black**. Therefore:
- Keel's **primary hue family must NOT be teal/mint/green.** The prototype's #2DD4BF teal
  is Hyperliquid's exact family — it is **killed** as an accent (demoted to nothing; up/down
  semantics use Keel's own values). The prototype's Sui-blue #4DA2FF is a crypto-default and
  is also moved off the primary slot.
- The **display face must NOT be Teodor** (their licensed serif) and must read distinct
  from it; the text face should diverge from Inter where possible; numerals require a mono.
- A stranger seeing Keel beside Hyperliquid must read **two different brands** — achieved
  by inverting the accent *temperature* (warm vs their cold) and choosing a warmer,
  more editorial display face. Exact choices and PASS justification live in
  `DESIGN.md` → Divergence self-check.
