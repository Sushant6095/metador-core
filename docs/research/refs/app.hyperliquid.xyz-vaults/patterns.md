# Patterns — Hyperliquid Vaults (benchmark for apps/app marketplace+vault detail)

Source: https://app.hyperliquid.xyz/vaults · captured 2026-06-11 · measured at 390/768/1440.
Analytical notes only. No values below are prescriptions for Keel — see final section.

## Type system
- One face does everything: a humanist sans (their bundle aliases it `OurFont`, falling
  through `system-ui` → Segoe/Roboto). Single family, no display/body pairing. The brand
  voice is "the data is the design," not typographic personality.
- Scale is tight and utilitarian, anchored low. Dominant body/cell size ~12px; secondary
  ~14px; section labels and key figures ~16px; page title alone jumps to ~28–34px. Effective
  ratio between the working tiers is small (~1.15–1.3); only the H1 breaks rank. There is no
  rich modular scale — two or three sizes carry ~95% of glyphs.
- Weight range is almost flat: ~99% at 400, a sprinkle of 500. No bold. Hierarchy is built
  from color and size, not weight — a deliberate low-contrast, instrument-panel feel.
- Line-heights are compressed for density: cell text ~15px on 12px (≈1.25), body ~21–24px,
  micro-labels as low as 10px. The big numbers get ~31–38px leading to breathe.
- Numeric treatment: figures (TVL, APR, deposits) are heavily right-aligned in columns and
  read as monospaced-rhythm even within the sans — strong implication of tabular-nums /
  lining figures so digits column-align. Currency and % live inline with the number.

## Color world
- Signature hue family: **mint-teal on near-black**. A single bright cyan-green
  (~rgb(80,210,193)) is the only saturated accent, sitting on a very dark desaturated
  blue-green base (~rgb(15,26,31) / a near-black ~rgb(4,6,12)). Cool, marine, calm.
- Roles:
  - Background: near-black teal-tinted base; cards/surfaces a hair lighter
    (~rgb(15,26,30) → elevated ~rgb(27,36,41)). Layering is by tiny luminance steps, not hue.
  - Primary text: off-white (~rgb(246,254,253)) and pure white for emphasis figures.
  - Muted/secondary text & labels: desaturated slate-grey (~rgb(135,140,143) /
    rgb(148,158,156)) — used for column headers, addresses, "Total Value Locked" label.
  - Accent / CTA: the mint-teal — fills the primary "Connect" button (dark text on teal),
    underlines active nav, draws the sparkline highlights. Scarce by design.
  - Semantic: green (~rgb(31,166,125)) for positive APR, rose-red (~rgb(237,112,136)) for
    negative APR. Gain/loss is the only place a second/third hue is allowed.
- Net effect: a near-monochrome dark surface where the single teal accent + red/green
  semantics carry all meaning. Almost no chrome, no gradients on surfaces.

## Spacing & density
- Base step reads as a 4px grid with **8px as the workhorse** (by far the most frequent
  gap), 12px and 16px for grouping, 24px for section separation. Tight, consistent, no
  arbitrary one-off paddings.
- Density is high and increases with viewport: the 1440 table shows ~10+ vault rows above
  the fold across 7 columns (Vault, Leader, APR, TVL, Your Deposit, Age, Snapshot) with row
  padding around 8px — a screener, not a card gallery.
- Mobile (390) collapses the same data into a stacked, lower-density list; the wide table is
  a desktop-first artifact. 768 is an intermediate widen of the same table.
- Radii are restrained: ~8px is the near-universal corner (buttons, inputs, cards),
  occasional 10–12px. Nothing pill-shaped except by content width.

## Surfaces & depth
- Flat, quiet layering. Surfaces separate by ~1 luminance step and thin hairline borders
  (muted slate at low alpha), not by shadow.
- Exactly one real shadow observed in the whole page: a soft elevated drop
  (`rgba(9,20,66,0.25) 0 20px 32px -8px`) — a cool navy-tinted, large-offset, soft shadow
  reserved for a single floating element (the Announcements popover). Shadow = "this floats
  above everything," used once, so it means something.
- Depth model: base canvas → table/card surface (slightly lighter) → one floating popover
  (the only thing that casts). No nested elevation soup.

## Layout & IA
- Desktop (1440): top horizontal nav bar (logo, Trade/Portfolio/Earn/Vaults/Staking/
  Referrals/Leaderboard/More, then Connect + locale + settings on the right). Below: page
  title "Vaults," a TVL hero stat, a full-width search + filter dropdowns (category, time
  window e.g. 30D), then two grouped tables — **Protocol Vaults** then **User Vaults** — with
  sortable columns and a trailing inline sparkline per row. Pagination ("Rows per page",
  "1–0 of N") at table foot.
- Above the fold on desktop: nav, title, the single big TVL number, search/filters, and the
  first ~10 vault rows. The hero is a *number*, not a banner.
- Mobile (390): hamburger + logo bar, big "Vaults" title, full-width primary Connect button,
  TVL card, search, two stacked filter chips, then the section lists. Same IA, linearized.
- The Announcements popover is a persistent, dismissible bottom-right card — operational
  notices live in chrome, not in the data plane.

## Motion & interaction
- No JS animation library in the bundle. Stack is Next.js + React + **styled-components** +
  an embedded **TradingView** widget. Motion is CSS transitions on hover/active states and
  whatever TradingView renders internally for the sparklines/charts.
- Implied interactions: column header sort toggles, dropdown filters (category + time
  window), row hover highlight, search-as-filter, paginate. The row sparkline is a live
  micro-chart, not a static image — the data itself animates/updates rather than the layout.
- Discipline: layout is still; only data refreshes. Calm-under-money — nothing slides or
  bounces around a screen showing balances.

## Trust signals
- Lead with aggregate proof: a single large **Total Value Locked** figure is the hero — the
  number is the credibility.
- Radical transparency per vault: leader address (truncated hash), APR (signed, color-coded),
  TVL, your own deposit, age in days, and a performance sparkline — all visible in one row
  before any click. Negative APR is shown plainly in red, not hidden.
- Separation of **Protocol Vaults** vs **User Vaults** sets a trust tier (first-party vs
  community) without editorializing.
- Precise, unrounded currency (e.g. $313,716,013.75) signals "real ledger, not marketing."
- Governance/operational honesty surfaced in the Announcements popover (delistings, votes).

## What Keel transfers (principles in our words)
- Near-monochrome dark canvas + one disciplined accent; let red/green semantics be the only
  other colors. Calm, instrument-panel restraint.
- Hierarchy from size + color, not weight; keep working type to ~2–3 sizes on a tight scale.
- Tabular/lining figures, right-aligned numeric columns — money columns must digit-align.
- A 4/8px spacing grid; ~8px workhorse; 24px between sections; uniform ~8px radii.
- Screener-grade density on desktop: many rows, 7-ish columns, inline sparkline, sortable
  headers, time-window + category filters, foot pagination. Linearize gracefully to mobile.
- Lead the surface with one aggregate proof number, then per-row radical transparency.
- Shadow used once, meaningfully (floating layer only); everything else separates by
  luminance + hairline border. Layout stays still; only data updates.
- This is exactly where Keel's brand DOES more than the benchmark: their row shows
  leader/APR/TVL; ours must add the **policy card, budget meter, and a REVOKE affordance** —
  safety made visible is our column the screener lacks.

## What Keel must NOT take (their identity markers)
- Their teal hue family (~rgb(80,210,193) on ~rgb(15,26,31)). Keel's primary hue must read as
  a different brand at a glance — diverge the accent family and the base tint.
- Their typeface (the `OurFont` humanist sans) — name it, then license/choose an open
  near-match later; do not ship a system-ui clone of their stack.
- Their exact surface/shadow tokens, copy ("Total Value Locked," section names), the
  Announcements pattern verbatim, the TradingView sparkline asset, logo, and any
  styled-components CSS lifted 1:1.
