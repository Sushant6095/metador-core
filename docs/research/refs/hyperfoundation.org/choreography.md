# Choreography — hyperfoundation.org (measured) → Keel home build contract

Captured 2026-06-11/12. Sources: 1440 frame archive (113 frames, 80px steps, y0→y8906),
390 frame archive (39 frames, y0→y3004, scrollHeight 3848), 4 founder key-moment shots,
choreography-*.json (jq), two 1440×900 hero webms (ffmpeg 1fps), patterns.md, measurements-1440.json.
Protocol: principles + numbers ship; their copy/assets/palette/faces never.

> **Capture caveat (load-bearing).** The 1440 frame archive AND both 1440 webms are a
> **hero-stuck render**: the WebGL hero canvas filled the viewport for the entire scroll and
> the section layout never advanced — nav reads as a green top-flush bar, no pill, and the
> headline sits at fixed Y from y0 to y8906. choreo `scrollHeight`=9806 but frames cap at 8906.
> The **390 capture rendered correctly** (real white-pill nav, real section flips) and the **4
> founder shots** are the true desktop sections. So: HERO PIN + AMBIENT FIELD = read from 1440
> frames/video; SECTION MAP + WORLD-FLIPS + PiP = read from 390 frames + founder shots. Numbers
> below are tagged with their source.

## 1. Section map

**Desktop (founder shots + 390 ratios scaled to a ~9806px doc; 7 sections):**

| # | Section | Bg world | Content (one line) |
|---|---|---|---|
| 1 | Hero | **dark** teal canvas | floating white pill nav · serif hero claim · sub-para · two pill CTAs over a morphing green field |
| 2 | Flagship App | **pale-mint** | centered eyebrow + serif title · large product screenshot (exchange UI) · then 4 feature rows (line-icon + title + one line): Low fees / Transparent / 40x leverage / Seamless |
| 3 | The Stack | **dark** | serif "The [brand] Stack" · isometric 3D layer diagram · 4-dot carousel + side chevrons · caption block bottom-left swaps per slide |
| 4 | Stat band | **dark** | 4 count-up stats in one tinted rounded card (block time / users / max TPS / daily volume) |
| 5 | Community manifesto | **pale-mint** | concentric-contour line bg · two-line setup + giant serif "Community first." |
| 6 | Token CTA | **pale-mint** | serif mixed-weight paragraph + small line + two pill CTAs (repeat of hero CTAs) |
| 7 | Footer | **pale-mint → dark** | top is pale; oversized serif wordmark spans full width; dark base strip with social icons + legal columns |

**390 (measured, scrollHeight 3848 ≈ 9.86 vh of 390-wide; same 7 sections, single column):**
H ≈ y0–520 · Flagship+features ≈ y520–2150 · Stack ≈ y2150–2450 · Stats ≈ y2450–2640 ·
Community ≈ y2640–2960 · Token CTA ≈ y2960–3230 · Footer ≈ y3230–3848. Hero type drops ~2
steps (90→~48px); carousel + dot pagination preserved; nav links collapse to a hamburger.

## 2. The hero pin

- **Measured pin length (1440 frame archive):** hero held full-viewport across **every** frame
  y0→y8906 — i.e. ≥ **9.9 vh** in the stuck capture. True-site reading (390 + founder shots):
  the hero is a **~1.0–1.3 vh** beat with a *continuously looping* field; treat the pin as a
  deliberate **~1 viewport hold while the ambient loop runs**, NOT a multi-screen scrolljack.
  **Build target: pin ≈ 100vh** (one held screen), release on the next section, not 9 screens.
- **What evolves during the hold (1440 video, 1fps):** a single mint blob is the only mover.
  Loop character: round droplet → **peanut/bowtie** pinch (their logo silhouette) → blob drifts
  off-center while soft **bokeh orbs** bloom and pass diagonally (lower-left brightest, top-right
  darkest) → orbs recede, blob re-centers and re-rounds. Drift is slow, eased, **multi-second**
  (est. 6–12s full cycle), decoupled from scroll. Color stays within one hue (mint on forest);
  luminosity shifts, not hue. The small in-headline logo mark recolors on the same clock.
- **Release mechanics:** the next section (pale Flagship) **arrives in normal document flow** —
  it scrolls up over/after the held hero. No transform on the hero exit, no parallax; the pale
  world simply slides into frame and the dark hero leaves the top. Hard handoff, no crossfade.

## 3. Nav

- **Static pill — confirmed.** choreo 1440: nav.height=900 (full-viewport overlay layer),
  background constant `rgb(7,39,35)`, `backdropFilter:none`, `boxShadow:none` across all 41
  sampled steps. No recolor, no shrink, no transform on scroll.
- **Geometry (founder shots @1440 / 390 frames):** floating rounded **pill** detached from page
  edges, ~**16–20px** inset from top and sides; pill height ~**56–64px**; **borderRadius 60px**
  (measurements: 60px is the dominant radius). Logo left; links + one filled CTA right (390:
  links collapse to a hamburger). Pill is opaque white-ish on light sections, dark on the hero —
  it **inverts with the section world** but never animates the change on scroll.

## 4. Ambient motion inventory

- **Hero field** — one WebGL/canvas blob + bokeh orbs, slow eased loop (est. 6–12s), the page's
  primary continuous motion. One moving thing.
- **Stack carousel** — manual stepped (dots + chevrons), NOT autoplay; advancing swaps caption.
- **Stat counters** — count-up on enter-view (one-shot, not a loop).
- **Footer device thumbnail (PiP)** — static image, not animated.
- Everything else is still. **Motion budget = exactly one ambient element, in the hero only.**

## 5. The PiP thumbnail

- **Trigger range:** appears once the hero scrolls away — present in Flagship (§2), faintly in
  Stack (§3), and Footer (§7) founder shots; absent on the hero itself. Reads as a persistent
  **floating scroll-companion / return-to-hero affordance** that lives bottom-right for the
  whole post-hero scroll.
- **Position:** fixed **bottom-right**, ~16–24px inset.
- **Size:** small device card, ~**110×70px** (rounded ~12px).
- **Content:** a miniature of the hero/app (dark device showing the green hero or exchange UI) —
  a live "where you came from" mirror.

## 6. Transitions between worlds (dark↔pale)

- Flips are **hard section edges in normal flow**, no overlap/crossfade. 390-measured edges:
  Hero(dark)→Flagship(pale) at **~y520**; Flagship(pale)→Stack(dark) at **~y2150**; Stack(dark)
  →[Stats dark, same world]; Stats(dark)→Community(pale) at **~y2640**; CTA(pale)→Footer at
  **~y3230** where Footer itself ramps pale-top → dark-base inside one section.
- Rhythm = **dark → pale → dark(×2 beats) → pale(×2 beats) → dark base**: immersion, relief,
  immersion, calm, close. Pacing is the trust device; the world-flip carries the page.

## 7. WHAT THE PAGE DOES NOT DO (negative findings — build constraints)

- **No DOM enter-reveals.** Zero scroll-triggered computed-style changes on 140 tracked elements
  at 3 viewports. Content arrives by normal flow only.
- **No nav transform / recolor on scroll** (bg/shadow/blur constant; it inverts by section, set
  per-section, not animated).
- **No parallax stacks, no pinned multi-screen scrolljack** (the true hero is ~1 screen), **no
  named animation lib** (CRA React only — no GSAP/Framer/Lenis), no CSS keyframe section anims.
- **Numbers are marketing numerals** (same sans, no tabular alignment) — the gap Keel closes.
- Composition + one pinned ambient canvas carry the entire page. Restraint is the craft.

## 8. KEEL TRANSLATION — the build contract (our tokens/#motion, our voice)

Stack: Next.js + Motion (motion.dev). Transform/opacity only, 60fps, `prefers-reduced-motion`
= instant or ≤80ms fade. Faces: **Fraunces** display, **Geist** sans. World-flip light ramp:
dark `--keel-bg #0A0E14` ↔ paper `#F7F5F0`. **Deliberate divergence from their static page:**
we add ONE restrained `whileInView` stagger per narrative section (40–60ms/item, **max 8**,
`--keel-ease-enter`, opacity+translateY ≤16px, one-shot) — disciplined reveal, not parallax soup.
**Divergence check:** brass-on-slate ≠ their mint-on-forest; Fraunces ≠ Teodor; a 3D brass
instrument ≠ their blob field. Two different brands at a glance.

| # | Section | Height | Bg world | Motion spec (tokens) | Content slot (PRODUCT.md) |
|---|---|---|---|---|---|
| 1 | **Hero** | 100vh, sticky pin (one held screen — NOT 9) | dark `--keel-bg` | **DIVERGE: scroll-linked brass armature.** A 3D/SVG nautical-instrument (keel/sextant) armature rotates on `useScroll` progress 0→1 over the pin; layered ambient idle loop `--keel-duration-ambient 6000` (eased, decoupled). Headline+CTAs `--keel-duration-hero 520` opacity-rise on load, `--keel-ease-enter`. No hue shift, luminosity only. | Hero claim: *"Strategy vaults that cannot run off with your money."* Fraunces headline · Geist sub · brass primary CTA + ghost secondary. |
| 2 | **Custody problem → Four walls** | ~140vh | pale paper | World-flip hard edge. One `whileInView` stagger (≤8 rows, 50ms, translateY 16→0 + opacity). Four-walls cards reveal as the single stagger. | The custody problem stated plainly, then the four chain-enforced walls (budget / scope / expiry / revocation) as four cards. |
| 3 | **Safety made visible (feed)** | ~110vh | dark `--keel-surface` | Live activity feed: new row slides in translateY+opacity `--keel-duration-base 200`; data color-flash 120ms on change. Budget meter `springMeter` fill. Layout never moves. | The live policy card + budget meter + activity feed — Keel's brand moment no benchmark has. |
| 4 | **Proof stat band** | ~60vh | dark | **Count-up on enter** (one-shot, `--keel-ease-enter`), **tabular mono numerals** (`font-variant-numeric: tabular-nums`) — our divergence from their marketing numerals. One tinted card. | Operational proof: vaults secured · capped exposure · zero custodial incidents · cranks run. No APY. |
| 5 | **Maya + Leo** | ~120vh | pale paper | World-flip. Two-up; one stagger per persona reveal (≤8, 60ms). Optional 1 ambient drift on a portrait. | Maya (follower, copy-trades safely) + Leo (leader, runs a vault under policy) narrative. |
| 6 | **Red-team teaser** | ~90vh | dark, ramps toward `--keel-revoke` accent | Restrained until interaction; teaser of the **REVOKE** beat (hold-to-confirm 800ms, badge crossfade to REVOKED, `--keel-glow-revoke` bloom 520ms). Links to full demo. | "Try to steal the funds — you can't." The red REVOKE as emotional peak. |
| 7 | **Builders band** | ~80vh | dark `--keel-surface` | Logos/cards static; single stagger on enter (≤8, 40ms). Manual stepped if a diagram is used (their carousel pattern, our content). | DeepBook / Sui ecosystem + builder credibility. Stepped, not autoplay. |
| 8 | **Waitlist + giant wordmark footer** | ~90vh | pale → dark base (in-section ramp) | World ramp inside the section (pale top → dark base). Waitlist input: focus ring `--keel-ring` brass, CTA hover lift ≤2px `--keel-duration-fast 120`. | Waitlist capture + oversized **Fraunces "Keel" wordmark** (pattern transfer, our face) + socials/legal on dark base. |

Optional: a Keel **PiP scroll-companion** bottom-right post-hero (their pattern, our content — a
mini live-feed or vault-status chip), ~110×70px, fixed, appears after §1.
