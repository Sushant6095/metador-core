# Patterns — Hyperscreener (screener density benchmark)

Source: hyperscreener.asxn.xyz/home · captured 2026-06-11 (390/768/1440).
Capture caveat: the headless crawl landed on the **dashboard home** (KPI strip +
dual chart panes). Mobile shots (390/768) caught the React hydration spinner —
the app renders client-side. So measured values below come from the 1440
dashboard shot + the computed-style frequency tables (which span the whole DOM,
not just charts). Pure table routes (Perp Overview, Liquidations, Comparison)
were not in the screenshot set; their density is inferred from the same type/grid
system the home page proves. Extraction is measurements + structure + principles
only — no assets, copy, fonts, or palette cross over (CLAUDE.md §8).

## Density system (THE deliverable)
- **Type scale is brutally narrow.** Three sizes carry ~99% of all text nodes:
  16px/24lh (body + most cells, ~83% of nodes), 12px/18lh (labels, chip text,
  axis ticks), 14px/20lh (secondary). KPI hero numbers = 60px/60lh. Section
  titles 24px/32lh. One 36px, one 10px — rounding errors. **Two real weights:**
  400 (everything) + 300 (the italic display logotype/serif accents); 500 is a
  rare nudge (~20 nodes). No bold. Hierarchy comes from **size + color**, not
  weight.
- **Row-height proxy = the line-box rhythm.** Data rows inherit the 16px/24px
  text box, padded vertically by the 8px/12px spacing band → expect **~40px data
  rows** (24 line + ~8 top + ~8 bottom) for the standard cell, and a **~32px
  compact row** if padding drops to 4px. The KPI cards confirm the macro rhythm:
  label 16px → 20px gap → value 60px inside a ~95px-tall card.
- **Cell font sizes:** primary cell 16px; dense numeric/secondary cell 14px;
  column-header + unit/label text 12px. So a tightened screener table would read
  12px headers over 14px numeric cells.
- **Header treatment:** column/section labels are **12px, low-contrast grey**
  (oklch 0.708 ≈ mid-grey, ~50 nodes) sitting above near-white values
  (oklch 0.985 / pure white). Headers do not shout — they recede; the number is
  the hero. KPI labels ("Total Users" etc.) use this exact label/value pattern.
- **Vertical padding rhythm:** the spacing histogram is a clean ladder —
  3px (hairline, 62×), 4px, 8px, 12px, 16px (the workhorse, 120×+), then jumps
  to 20/22/24/40px for section gaps. Inside data clusters everything lives in
  the **4–12px band**; **16px** separates fields within a card; **24–40px**
  separates sections/panes. Compound `8px 16px` = the standard chip/button pad
  (tight vertical, roomy horizontal).
- **Visible per viewport @1440 (counted on shot):** 4 KPI cards across one
  ~50px-tall strip; 2 chart panes side by side; the left rail shows **~22 nav
  rows** (5 group headers + 17 links) in the first ~860px of height. The data
  surface is 2-up panes, not a single wide table, on home.
- **Visible per viewport @390:** single column, hamburger-collapsed rail. The
  4-up KPI strip stacks to 1-up; chart panes stack. (Inferred — shot was a
  loader.)
- **Data-points-per-screen estimate:** @1440 the home view exposes ~4 KPIs +
  ~2 charts each carrying 5 series toggles + dual Y-axes ≈ **~30 discrete data
  affordances above the fold**. A tightened table at 40px rows in the ~860px
  content height = **~21 rows visible**; at the 32px compact row ≈ **~26 rows**.
  @390 that drops to **~8–10 rows** before scroll.

## Table anatomy
- **Alignment rule (standard fintable, confirmed by KPI layout):** identifier /
  text columns flush **left**; all numerics (price, volume, %, USD) flush
  **right** so decimal places stack and the eye scans a clean column edge.
- **Numeric formatting (read off the shot):** large magnitudes abbreviated with
  suffix — `1.20M`, `4.35T`, `360.00B`, `6.00T`; currency prefixed `$372.19B`;
  fixed **2 decimals** on abbreviated values; thousands separators on raw axis
  labels. Signed/colored deltas use the green family for positive (the brand
  green rgb(81,166,145)) and an orange accent (rgb(255,140,0)) for the
  highlighted/cumulative series. Units sit in the axis title, not repeated per
  tick.
- **Sort indicators:** not visible on the home capture; the type system implies
  a 12px grey header that would carry a caret on the active sort column.
- **Sticky elements:** the **left nav rail is fixed** (persists through scroll;
  scroll-00 ≈ scroll-01 in the chart region). For tables, expect a **sticky
  header row**; first-column freeze is the convention for the wide perp tables
  though unconfirmed here.

## Filter / sort UI
- **Per-pane filter chips:** each chart pane has a row of toggle chips
  (BTC / ETH / SOL / HYPE / Others) — pill outline, 12px label, `8px 16px` pad,
  2–6px radius. A "Cumulative / Total" series toggle + a "Deselect all" reset sit
  on a second chip row.
- **Multiselect collapse:** a `"4 coins selected ▾"` dropdown summarizes the
  active chip set — chips for quick toggles, dropdown for the full list. Good
  density pattern: show the common 4 inline, hide the long tail behind a count.
- **Time-range segmented control:** `D / W / M / Y` top-right of each pane,
  active state boxed (M highlighted). Per-pane, not global.
- **Global controls:** a "Search address ⌘K" combobox top-center and a
  light/dark toggle in the header.
- **Mobile collapse:** rail → hamburger; search shrinks to an icon; pane
  controls wrap. (Inferred from header at 768/390.)

## Stat presentation (KPI cards)
- Four equal cards in a horizontal strip, separated by **thin vertical
  dividers** (not boxed cards — divider-delimited columns). Each: small grey
  **12–16px label** on top, **60px near-white value** below, ~20px between them.
  Zero chrome — no icon, no card border, no shadow (shadows table is empty at
  1440). Pure label/number contrast. This is the density lesson: **strip the
  card, keep the number huge.**

## Explanation → action flow
- The page leads with **aggregate trust numbers** (Total Users, Volume,
  Deposits, Withdrawals) → then **interactive breakdowns** (per-coin, per-range
  charts the viewer drives) → and the only persistent CTA is **"Trade on … ·
  Save 4%"** pinned top-right in the brand green. So: orient with totals →
  let the user interrogate the data → convert to the venue. Data is the
  argument; the CTA is always one glance away but never interrupts.

## What Keel's /screener transfers (principles, our words)
- Narrow type scale: ~3 sizes do all the work; hierarchy from **size + color**,
  not weight. Numbers near-white, labels mid-grey 12px.
- ~40px standard data row / ~32px compact; vertical padding lives in the
  4–12px band, 16px between fields, 24–40px between sections.
- Right-align all numerics, left-align identifiers; abbreviate magnitudes
  (K/M/B/T) at fixed 2 decimals; units in the header, not every cell.
- Divider-delimited KPI strip with oversized values, no card chrome.
- Inline chips for the common few + count-dropdown for the long tail; per-pane
  D/W/M/Y segmented range; sticky header + fixed nav.
- Flow: totals → drillable data → ever-present single CTA.

## What it must NOT take (CLAUDE.md §8)
- **Palette:** their teal-green (rgb 81,166,145) + orange (255,140,0) on near-
  black is the Hyperliquid family — Keel's primary hue must read as a different
  brand at a glance. Use our tokens.
- **Fonts:** "Overused Grotesk" + "Libre Baskerville" are theirs — license our
  display face / pick an open near-match per protocol.
- No logos, no "Hyperliquid"/"ASXN" marks or watermark, no copy strings, no
  verbatim CSS. We ship the *measurements and structure* above, nothing else.
