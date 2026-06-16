# Elevation Spec — home page → Hyperliquid grade

**Status:** build contract. Verdict to clear: "looks like a child's site."
**Bar:** hyperfoundation.org (founder-shots/) — full-bleed immersive field,
white/ink-dominant editorial serif, ONE accent moment, atmospheric depth.
**Constraint:** token freeze holds (brass/slate/Fraunces stay). The failure is
DEPLOYMENT, not palette. Divergence rules bind: no mint, no organic blob, two
distinct brands. This spec touches only `apps/web` + `apps/web/fonts.ts`.

---

## 1. HERO REDESIGN — kill the split, go full-viewport

1.1 **Layout.** Delete the two-column grid (`HeroSection.tsx` L92-262) and the
    `ArmatureSlot` object-card. Hero is a single full-viewport (`100vh`,
    `100svh` mobile) layer stack. No card, no border, no `--keel-surface` box
    around the instrument. Content is one left/center-anchored column,
    `max-width: 60ch`, vertically centered, padded `--keel-space-16`.
1.2 **Z-layers (back→front):** (z0) `--keel-bg` base; (z1) atmosphere gradients
    §2; (z2) the armature canvas as full-bleed background (`position:absolute;
    inset:0`), NOT a sibling column; (z3) depth-fog + bottom vignette
    (`linear-gradient(transparent 40%, var(--keel-bg) 92%)`) so type sits on
    calm ground; (z4) content; z4 uses `--keel-z-elevated`.
1.3 **Armature as monumental instrument.** Rebuild `ArmatureScene.tsx`:
    - Scale to `1.2–1.6× viewport height`, anchored off-center RIGHT and
      partially cropped out of frame (camera offset / group `position.x ≈ +1.4`).
      It is a backdrop, not a mascot.
    - Render as **precision wireframe**: replace `MeshStandardMaterial` solids
      with thin-line treatment — `WireframeGeometry` + `LineBasicMaterial`, or
      tube radius dropped to `0.006–0.010` (currently 0.045, the "squiggle").
      Lines read 1–2px.
    - **High tessellation:** torus segments `16→64`, tubular `80→220`. Add a
      second concentric graticule ring with tick marks (short radial line
      segments every 15°) so it reads naval-blueprint, not doodle.
    - **Dim brass, one highlight:** base lines at brass `30–45%` intensity
      (`opacity 0.32`, `--keel-primary-deep`); exactly ONE edge/meridian line
      at `--keel-primary-bright` full strength as the catch-light. No emissive
      bloom on the body.
    - **Depth fog:** `scene.fog = new THREE.Fog(bg, near, far)` so far lines
      recede — the instrument has volume, the doodle did not.
    - Keep: ≤6° pointer parallax, ~40s revolution, dispose-on-unmount,
      pause-on-hidden, reduced-motion = canvas never mounts.
1.4 **Content.** Eyebrow (caps, `--keel-faint`, `letter-spacing .14em`) →
    headline → subline (`--keel-muted`, `max 46ch`) → CTAs. Headline target
    `clamp(72px, 6.5vw + 1rem, 112px)` at 1440 (current 5xl/64px is too
    small for full-bleed); white dominant (`--keel-text`); brass on **at most
    one word** (§3). Staggered opacity-rise keeps current timing.
1.5 **Poster.** `ArmaturePoster.tsx` is a static SVG of the SAME wireframe
    composition (same crop, same off-right anchor, same single bright meridian,
    same fog vignette baked as gradient) — served as the no-JS / reduced-motion
    / pre-hydration frame so first paint already reads expensive.

## 2. ATMOSPHERE SYSTEM — whole page, token-only

2.1 Add `apps/web/app/atmosphere.css` (imported in `layout.tsx`). Three reusable
    utilities, all `position:absolute; pointer-events:none; inset:0`:
2.2 `.keel-field` — layered radials from primary, very low alpha:
    `radial-gradient(60% 50% at 78% 30%, rgba(var(--keel-primary-rgb),0.05), transparent 70%)`,
    plus a second cool falloff `radial-gradient(80% 60% at 15% 90%, rgba(var(--keel-primary-rgb),0.025), transparent 75%)`.
    Light sections override alphas to `≤0.03`.
2.3 `.keel-grain` — SVG `feTurbulence` noise (`baseFrequency .9`, fractalNoise)
    as data-URI background, `opacity: 0.035` (≤0.04 cap), `mix-blend-mode:
    overlay`, fixed. One node, reused; gives the flat slate tooth.
2.4 **Glow-bleed seams.** At each section boundary, a `120px` tall absolutely-
    positioned band: `linear-gradient` fading `rgba(var(--keel-primary-rgb),0.04)`
    → transparent, so dark→light and section→section seams bleed instead of
    hard-cutting (the current slabs hard-cut).
2.5 **Raised surfaces.** Every card/panel uses `--keel-raised` + `--keel-border`
    + `--keel-shadow-float` (currently flat, shadowless). Hover lifts to
    `--keel-shadow-modal`. This is the layering the diag flagged as "zero depth."

## 3. AMBER BUDGET — max 2 brass instances per viewport

3.1 **Per viewport, brass appears at most twice.** Hero viewport's two: (a) the
    single headline accent word, (b) the primary CTA fill. Everything else
    (logo wordmark, sublines, eyebrows, secondary CTA) is `--keel-text`/`muted`
    /`faint` — NOT brass. Fixes "amber crayon-overuse."
3.2 **Logo de-saturated:** wordmark `--keel-text`; only the mark glyph may keep
    a brass fill, and it counts as zero against budget only if no other brass is
    in the nav row (nav CTA is brass → logo goes neutral).
3.3 **Headline accent:** brass on ONE word maximum, the load-bearing verb
    (e.g. "can't run off"→ accent only "run off" is still 2 words; tighten to a
    single semantic word). Never brass two phrases in one headline.
3.4 **Section eyebrows** (`STRUCTURAL SAFETY`, `FOR SAVERS`…) drop from brass to
    `--keel-faint` caps. Card titles in §5 use `--keel-text`, not brass.

## 4. TYPE SHARPENING — Fraunces editorial-sharp

4.1 **Root cause:** `fonts.ts` enables `['opsz','SOFT','WONK']` and lets them
    default soft/wonky → the "playful" render. Fix the axis config:
    ```ts
    export const fraunces = Fraunces({
      subsets: ['latin'], display: 'swap', variable: '--font-fraunces',
      axes: ['opsz', 'SOFT', 'WONK'], weight: 'variable',
    });
    ```
    Then PIN the variation in display CSS, not the loader default:
    `font-variation-settings: 'opsz' 144, 'SOFT' 0, 'WONK' 0;`
    `font-weight: 560;` (display) / `600` (hero). opsz→max=high-contrast
    editorial; SOFT 0 + WONK 0 kills the crayon feel.
4.2 Add a `.keel-display` class (atmosphere.css or a typography.css) carrying the
    variation-settings + `font-weight:560` + `letter-spacing:-0.03em` on large
    headlines (`≥4xl`). Hero h1: weight 600, `-0.03em`, `line-height: 0.98`.
4.3 **Scale up section titles:** "The four walls" etc. from 3xl → `clamp(40px,
    3vw+1rem, 56px)`. They currently read like sub-heads; make them anchors.
4.4 **Eyebrows:** `--keel-text-xs`, caps, `letter-spacing: 0.16em`,
    `--keel-faint`, `font-weight:500` (mono optional for the engineering read).

## 5. SECTION DEPTH — 7 flat slabs → composed frames

5.1 **Hero** (dark): full-bleed wireframe + `.keel-field` + `.keel-grain` +
    bottom vignette. (§1)
5.2 **Custody problem** (dark): `.keel-field` shifted left; a single dim brass
    rule/underline marks the tension; raised quote panel on `--keel-raised`.
5.3 **Four walls** (light relief): `data-theme='light'`; cards become raised
    surfaces (`--keel-surface` + float shadow), eyebrow `--keel-faint`, titles
    `--keel-text` (drop the brass), Wall-4 keeps `--keel-revoke` as the sole
    color signal (the one allowed exception — it's the brand's red moment).
    Glow-bleed seam at the dark→light entry (§2.4).
5.4 **Value props** (light): two raised panels with float shadow + hairline
    divider rows; bullet dots `--keel-faint`, not brass. Asymmetric column
    widths (55/45) to break the twin-slab symmetry the diag flagged.
5.5 **Activity feed** (dark): the brand surface — `.keel-field` + grain, feed
    rows on `--keel-raised`, live tick is the ONE brass element (budget §3),
    tabular mono numerals.
5.6 **Red team** (dark, deepest): darkest ground (pure `--keel-bg`, no field
    glow — let it go quiet), `--keel-revoke` as the only chroma; this is the
    valley before the CTA. Grain stays for tooth.
5.7 **Waitlist** (dark→close): re-introduce `.keel-field` glow rising from
    bottom as the resolution; primary CTA is the viewport's single brass.

---
**DoD for the rebuild:** LCP <2.5s, CLS <0.05; armature reads as a precision
instrument at 1440 and degrades to poster at 375/reduced-motion; ≤2 brass per
viewport verified per section; `/design-review` side-by-side vs founder-shots;
divergence check (warm brass vs mint, Fraunces sharp vs Teodor) re-confirmed.
