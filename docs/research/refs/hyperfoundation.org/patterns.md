# Patterns — Hyper Foundation main site (benchmark for apps/web storytelling/motion)

Source: https://hyperfoundation.org · captured 2026-06-11 · React (bundled), 48 net requests.
IA/heading extraction came back empty (client-rendered React; nav is in-canvas/JS), so
structure below is read from screenshots + computed-style frequency tables.

## Type system
- Two faces. Body/UI = a neutral grotesk (their stack names Inter w/ system fallbacks) carrying
  ~98% of nodes (394–426 of ~440). Display = a serif (they license "Teodor"; Georgia/Garamond
  fallback) used only for hero/section titles — ~16–19 nodes total. So: serif headlines on a
  sans body. The serif does ALL the brand-voice lifting; the sans never tries to be expressive.
- Weight discipline is extreme: at 390/768 effectively a single weight (400 only). At 1440 just
  300 + 400. No bold anywhere — hierarchy comes from SIZE and the serif/sans switch, not weight.
- Scale is anchored at a 16px base (the overwhelming mode at every viewport). Steps observed at
  1440: 16 → 20 → 24/28 → 35 → 55 → 60 → 90. That's a loose ~1.25 ratio in the mid-range
  widening to large jumps (≈1.5×) at the display end — body sits tight, headlines leap. Mobile
  compresses the top end (hero ~30–55px vs 90px desktop).
- Line-height: body locked at 24px on 16px text (1.5). Display tracks ~1.0 (60/60, 90/90,
  55/55) — headlines set solid, near zero leading. A clean two-mode rhythm: airy body, dense
  display.
- Numeric treatment: stat counters (0.07s, 2,086,179, 200,000, $11B) render in the SAME sans
  as body, not a mono — no visible tabular-nums lining; numbers are presentation, not a live
  data grid, so alignment isn't engineered. (Relevant: this is the gap Keel must close — our
  trading numerals are tabular mono; theirs are marketing numerals.)

## Color world
- Signature = mint/aqua-teal on a near-black forest green. Two anchors:
  background `rgb(7,39,35)` / `rgb(2,35,30)` (almost-black deep teal, the canvas) and the
  accent `rgb(151,252,228)` — a bright mint that appears as fill, glow, and the lone shadow.
- Text is almost never pure white: dominant is `rgba(255,255,255,0.92)` (351–377 nodes) — a
  softened white that reads warm against the green and avoids harsh contrast. Pure white
  `rgb(255,255,255)` is reserved for a few emphasis spots only.
- Mid-greens do structural work: `rgb(51,153,140)` (39 nodes) = muted teal for secondary text/
  links/labels; `rgb(15,57,51)` / `rgb(25,56,51)` / `rgb(35,82,76)` = elevated surface tints
  (cards, the stack platform) sitting just above the canvas.
- A second light world exists for "soft" sections (Community first., footer): near-white mint
  tints `rgb(219,251,246)` / `rgb(237,255,252)` / `rgb(245,254,253)` as backgrounds with dark
  teal text — an inverted palette used to PACE the scroll (dark immersive → light calm → dark).
- Roles: deep teal = immersion/canvas; mint accent = energy, CTA glow, the brand mark; softened
  white = readable body; muted teal = labels/secondary; pale mint = relief/breathing sections.

## Spacing & density
- Section padding is generous and large-stepped: recurring 40 / 50 / 60 / 90 / 100px block
  spacing, with hero/section gaps reaching 130–250px. This is a low-density storytelling page,
  not a data surface — lots of air, one idea per viewport.
- Component-internal rhythm uses a small step family: 6 / 8 / 9 / 13 / 16 / 20 / 24 / 32px
  (6px is the single most frequent gap — tight icon/label pairing). Reads as an ~8px-ish grid
  loosened by hand, not a rigid 4px scale.
- Density per viewport: desktop shows ~1 narrative beat above the fold (hero headline + 2 CTAs
  over animated field); the stat block is the densest moment and still only 4 numbers. Mobile
  stacks everything single-column with the same big inter-section gaps preserved.

## Surfaces & depth
- Radii are large and friendly: 60px is the dominant radius (pill CTAs, the rounded nav bar,
  big cards), with 12/14/22/37px for smaller chips. Nothing is sharp-cornered; the whole site
  is soft-edged.
- Borders are nearly invisible — depth comes from tonal surface stacking (canvas → +tint card
  → brighter element), not stroke. Cards are a slightly lighter teal on the dark field.
- Shadows: essentially one in the whole capture — `rgb(151,252,215) 0 0 20px 5px`, a colored
  mint GLOW (not a drop shadow). Depth language = luminosity/bloom around accent elements, plus
  the morphing gradient haze behind the hero. Very little Material-style elevation.
- Layering strategy: a full-bleed animated background plane, a fixed/pinned content layer on
  top, and the rounded nav as a floating "pill" detached from the page edges.

## Layout & IA
- Single long-scroll narrative, centered column (no persistent sidebar). Above the fold @1440:
  floating rounded nav (logo left; Stats / Docs / Ecosystem + a mint "Launch App" CTA right) →
  serif hero headline ("The Blockchain To House All Finance") → sub-paragraph → two pill CTAs
  (Start Trading / Start Building) over the live gradient field.
- Scroll order: Hero → "The Flagship Application" (product card with screenshot + 4 feature
  rows: Live, Transparent, Up to 40x leverage, Seamless, each a line-icon + title + one line) →
  "The Hyperliquid Stack" (isometric 3D layer diagram in a 4-slide carousel w/ dot pagination
  + side arrows) → 4 stat counters → light "Community first." manifesto section → big CTA
  repeat → oversized "Hyperliquid" serif wordmark footer.
- Mobile: hamburger replaces the nav links; identical section order, single column, carousel
  preserved (dots + arrow). Hero type drops ~2 steps.

## Motion & interaction
- No named JS animation lib in the bundle dump (React only); motion is the React app's own
  WebGL/canvas + scroll logic, not a tag-along library. Treat their TIMINGS as the reference,
  build ours in Motion (motion.dev) per stack.
- Hero: a continuously morphing organic green gradient/blob field behind pinned headline. Scroll
  shots 03 vs 08 show the blob reshaping and the logo mark recoloring while text stays fixed —
  i.e. a slow ambient loop (multi-second, eased) decoupled from scroll, plus the headline likely
  holding via pin. Calm, never frenetic.
- Stack section: an isometric 3D diagram (labeled towers — Spot, Perps, Vaults, Governance,
  Oracles, HyperBFT, HyperEVM…) presented as a CAROUSEL — 4 dots, left/right chevrons; advancing
  swaps the explanatory caption beneath. Interaction = manual stepped storytelling, not autoplay.
- Stat counters almost certainly count up on scroll-into-view (standard for this layout).
- CTAs are pills with the mint glow as the hover/active affordance.
- Discipline to copy: motion is slow, ambient, and purposeful — one moving thing per section,
  eased, decorative-but-restrained. No parallax soup.

## Trust signals
- Hard numbers framed as proof, not promises: 0.07s block time, 2,086,179 users, 200,000 max
  TPS, $11B daily volume — concrete operational metrics, no APY/earnings language.
- A real product screenshot (the exchange UI) shown early — "here is the working thing."
- "Community first." manifesto + token framing positions it as ecosystem/foundation, lending
  institutional calm. Restraint itself reads as confidence: one weight, lots of space, no hype
  color, serif gravitas.

## What Keel transfers (principles in our words)
- Two-face system: an expressive DISPLAY face does all brand voice; a neutral workhorse does all
  UI/body. Hierarchy from size + face-switch, not from piling on weights.
- A dark, immersive single-hue canvas with ONE high-energy accent reserved for action/brand,
  plus softened-white body text (not pure white) for calm contrast.
- Scroll PACING by alternating dark-immersive and light-calm sections — rhythm as a trust tool.
- Storytelling structure: hero claim → show the real product → explain the architecture
  (stepped/manual, not autoplay) → prove with concrete operational numbers → manifesto → CTA.
- Motion budget: one slow eased ambient element per section; manual stepped reveals for complex
  diagrams; count-up stats on enter. Restraint over spectacle.
- Numbers-as-proof framing (operational metrics, zero earnings promises) — fits our claim
  discipline cleanly.

## What Keel must NOT take (their identity markers)
- Their hue family. Mint-on-forest-green `(151,252,228)` / `(7,39,35)` is THEIR signature —
  Keel's primary must be a different family entirely (per §8 divergence check).
- The "Teodor" serif and Inter pairing as-is — name the role (display serif + neutral sans),
  then license/choose our own faces; a stranger must read Keel and Hyperliquid as two brands.
- Their isometric 3D stack illustration, the blob/gradient hero scene, the line-icon set, logo,
  wordmark, screenshots, and any copy ("House All Finance", "Community first.").
- Their near-zero-weight, near-no-data aesthetic wholesale: Keel's trading surfaces are DENSE
  and tabular-mono — we borrow their landing calm for apps/web only, not the app. And unlike
  them, our numerals are engineered tabular data, not marketing display.
