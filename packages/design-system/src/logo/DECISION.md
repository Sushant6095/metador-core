# Logo decision — Metador mark

**Verdict date:** 2026-06-12
**Decided by:** design agent (Design God charter — visual veto / final call)
**Render evidence:** `/tmp/keel-logo-judge.html` → `/tmp/keel-logo-judge.png`
(all 3 concepts × 16/32/64/160px × 4 colorways), refinement confirmed via
`/tmp/keel-logo-refined.html` → `/tmp/keel-logo-refined.png`.

---

## Winner: **A · keel-spine** (`concept-keel-spine.svg`)

A naval body-plan midship section — deck beam, topsides, turn of the bilge,
deadrise sweep to the centerline apex, with the keel blade descending as a
true structural fin. One continuous engineered stroke.

### Why it wins

Judged on the six criteria:

- **16px legibility — PASS (only concept that does).** The cup-with-fin
  silhouette holds at favicon size in every colorway. This is the bar for an
  app icon, and it is decisive.
- **Instrument-precision character — strong.** Single-weight engineered
  stroke, clean single-join corners, a machined square-cut blade tip. Reads
  as a measured naval object, not a soft brand blob.
- **"Metador" story — most literal and honest.** It is an actual keel
  cross-section, not a metaphor borrowed from another domain. The name and
  the mark are the same thing.
- **Divergence — clean.** Does not read as a generic drop, blob, or
  typographic K. Distinct from every benchmark (Hyperliquid, Suilend, Typus,
  Kai, Bluefin). A stranger reads a specific instrument, not a fintech glyph.
- **Optical balance — good after refinement (see below).**
- **Memorability — high.** A specific, ownable silhouette.

### What I refined on the winner

Fixed the optical issues seen in the first render — the bottom apex read
blunt/heavy and the keel blade looked like a stub tacked under the hull:

1. **Blade grows from the apex, not under it.** Both bilge sweeps now meet on
   the centerline at `(32,46)` and the blade starts there — structural
   continuity instead of an appended tail.
2. **Lengthened the blade** (`46→58`) so it reads as a real fin keel running
   the draft, not a nub.
3. **Square-cut (butt) cap on the blade tip**, against the round caps of the
   hull, so the tip stays a sharp machined point and does not blob into the
   apex at 16px.
4. **Wider deck beam** (`12/52 → 11/53`) and **straighter topsides before the
   bilge turn** (`34→32`) for a steadier optical base and a clean quarter-turn
   bilge instead of a slumped curve.

Stroke weight stays at 5 on the 64 grid — verified legible at 16px without
clogging the interior, so no weight change was needed.

---

## Runner-up note

**B · gyro-armature** is the most beautiful at hero size and the most
"precision instrument" of the three — genuinely gimbal/sextant-grade at
64–160px. It is held in reserve as a candidate for an animated hero or loading
mark where large size is guaranteed. It is **not** the primary mark because it
collapses into a muddy blob at 16px (crossing ellipses + needle fill in), which
disqualifies it as a favicon/app icon, and the gyroscope reads more
"aerospace/navigation" than "keel" specifically.

**C · k-monogram** is rejected: at every size it reads as a plain typographic
capital K. The intended naval semantics (blade, sheer line, bilge turn, rivet)
are invisible — the rivet vanishes by 32px. A generic-K read fails the
divergence check outright.

---

## Refinement round — waterline ticks (2026-06-12)

**Render evidence:** `/tmp/keel-logo-refined-3.png` (final), with
`-1`/`-2` capturing the two rejected attempts.

### The flag (accepted)

The orchestrator flagged a perception risk on the winning mark: the closed
hull + centre blade silhouette reads as a **wine glass / goblet** (and as a
**funnel/filter** UI icon) at a glance. For a "trust us with your money"
brand, a "container that drains to a point" is a story-killer, and the funnel
collision is a common interface glyph. On review of the 160px hero I agreed —
the read was unambiguous and had to be fixed. The keel semantics were the
*intent*; the goblet was the *default reading*.

### What I tried (3 iterations, last one ships)

1. **Ticks high (y=26), outside the flanks.** Failed: at stroke 5 the 8px gap
   to the deck beam (y=18) closed up optically, so the ticks fused with the
   rim and read as **trophy / pan-balance handles** — arguably worse than the
   goblet for a money brand. (`-refined.png`, first render.)
2. **Open body-plan section** — horizontal waterline across the top, open-U
   hull below, flat keel-line, fin through it. Failed harder: the
   bar-over-U-with-stem read as the **Greek letter Φ (phi)** — a typographic
   glyph, which fails the divergence check the same way the rejected
   k-monogram did. (`-refined-2.png`.)
3. **WINNER — original closed hull + blade, ticks LOW at y=33.** Placed the
   ticks at the widest point of the bilge (where a real waterline crosses a
   hull section), just outside the flanks (2..8 / 56..62), 15px clear below
   the deck beam. This reframes the curve as **"hull submerged below the
   waterline"** — the universal naval body-plan convention. Goblet and funnel
   reads both break (neither has waterline marks at mid-height); no trophy
   fusion (ticks are nowhere near the rim); not a Φ. (`-refined-3.png`.)

### Final path data

```
<path d="M11 18 L53 18 L52 32 Q50 41 32 46 Q14 41 12 32 Z" />        <!-- hull -->
<path d="M32 46 L32 58" stroke-linecap="butt" />                      <!-- blade -->
<path d="M2 33 L8 33" stroke-linecap="butt" />                        <!-- waterline tick L -->
<path d="M56 33 L62 33" stroke-linecap="butt" />                      <!-- waterline tick R -->
```

The hull and blade are **unchanged** from the panel-winning mark — the
refinement is purely additive (two ticks). Single-weight stroke 5,
currentColor, butt-cap instrument ticks against the round hull caps, viewBox
0 0 64 64, all preserved.

### Size behaviour (per constraint)

- **16px:** ticks fade to faint nubs — accepted; the hull+blade favicon holds
  exactly as the approved original did.
- **32px+:** ticks clearly present, nautical read unambiguous in all four
  colorways.

Propagated to: `packages/ui/src/logo/MetadorLogo.tsx` (MetadorMark JSX),
`apps/app/app/icon.svg`, `apps/web/app/icon.svg`.
