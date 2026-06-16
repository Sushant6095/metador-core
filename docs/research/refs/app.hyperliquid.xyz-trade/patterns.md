# Patterns — Hyperliquid Trade (benchmark for apps/app cockpit; latency feel, density)

Source: https://app.hyperliquid.xyz/trade · captured 2026-06-11 · measured at 390 / 768 / 1440.
Note: the trade surface is a fixed, non-scrolling cockpit — scroll captures are ~identical to full;
all density lives in one viewport. Measurement files anonymize their face as `OurFont`.

## Type system
- Single sans-serif throughout (anonymized `OurFont`, system-ui fallback stack). No display/serif
  pairing — a trading terminal, not a marketing page. One mobile leak showed `Inter` (likely a
  fallback render), suggesting the real face is an Inter-class neo-grotesque.
- Brutally tight scale, not a ratio cascade. Two sizes carry ~95% of all text: ~12px (701 nodes @1440)
  for data/labels and ~16px (519) for primary readouts. A thin tail at 13/14/18/20px for the symbol
  header and headings only. Effective ratio ~1.33 between the two anchors, but it reads as a binary
  (data tier vs label tier) rather than a typographic scale.
- Weight is near-monotone: 400 dominates (1221 of 1225 nodes @1440); only ~4 nodes at 500. Hierarchy
  comes from color and size, almost never from weight. This is deliberate — bold would add visual
  noise to a number-dense grid.
- Line-heights are compact and many-valued (15px on 12px text → ~1.25; 23/24px on 16px → ~1.4–1.5;
  31/34px reserved for the symbol price header). The 15px-on-12px lockup is the density workhorse.
- Numeric treatment: prices, sizes, order-book ladders are visibly column-aligned and monospaced-feeling;
  tabular figures are implied by the clean decimal alignment across the book and rows (treat as
  tabular-nums even though the family is sans). This is the single most important typographic rule here.

## Color world
- Signature family: **mint-teal on near-black**. Backgrounds cluster at very dark desaturated
  blue-greens — base panel ~rgb(15,26,31), a near-twin ~rgb(15,26,30), gridlines/dividers ~rgb(27–39,
  36–48, 41–53). The whole canvas is one cold dark slate, not pure black.
- Text ramp is a 4-step gray-green: pure white (primary readouts/active), a soft sage ~rgb(210,218,215)
  (secondary), a muted sage-gray ~rgb(148,158,156) (tertiary/labels), and flat gray ~rgb(128,128,128)
  (de-emphasized). An off-white ~rgb(246,254,253) tints large headings cool, not warm.
- Accent = teal in two values: a bright mint ~rgb(80,210,193) for interactive/brand (Connect button,
  active links, the "auto" toggle) and a deeper green ~rgb(31,166,125) for the buy/long semantic.
- Semantic pair is the only saturated color on screen: green ~rgb(31,166,125) = buy/long/up,
  rose ~rgb(237,112,136) = sell/short/down. These appear as both text and as solid button fills
  (green Buy block, the price-ladder bid/ask coloring). Color carries meaning, never decoration.
- Role split is strict: teal = "the app / you can act here"; green-vs-rose = "market direction / your side".
  No third decorative hue anywhere. ~13 distinct foreground colors total — a very tight palette for
  this much information.

## Spacing & density
- Base step is small and consistent: 8px and 10px dominate (10px=99, 8px=38 samples @1440), with 4/5/12px
  as the half/quarter and next-up steps. Mobile leans harder on 8px (60 samples) — the grid tightens, not
  loosens, on small screens. Read it as a 4px sub-grid with 8/10px as the working unit and rare 16/24/32px
  for section gaps.
- Padding rhythm is tight and uniform inside data rows (the order book and position table use minimal
  vertical padding to pack ~30+ price levels above the fold). Generous gaps are reserved only for the top
  symbol bar and the order-ticket panel.
- Density per viewport: at 1440 a single screen holds the symbol/stats bar, a full candlestick chart +
  volume sub-pane, a complete two-sided order book with cumulative depth shading, the trade ticket, and a
  positions/balances table — five+ live regions, zero scrolling. This is maximal information per pixel.

## Surfaces & depth
- Radii are gentle: 8px is the workhorse (panels, buttons), 5px for smaller chips, 50% for avatars/dots,
  with 12/14px rare. Nothing is sharp-cornered, nothing is pill-round — a calm, slightly-rounded terminal.
- Depth comes from value steps, not shadow. Panels sit on the base via a ~1px lighter border / hairline
  divider (~rgb(39,48,53)) and a barely-lighter fill, not elevation. Exactly one box-shadow exists in the
  whole capture (rgba(9,20,66,0.25) 0 20px 32px -8px) — a single floating element (dropdown/tooltip/modal),
  proving shadows are an exception, never ambient.
- Layering strategy: flat tiled panels separated by hairlines, with the order-book depth bars and the
  green/rose fills providing the only "color depth." Overlays (announcements card on mobile) get the lone
  shadow + a slightly elevated dark fill. Calm, dark, dense — depth is informational, not skeuomorphic.

## Layout & IA
- 1440: classic three-zone terminal — center chart (largest cell), right rail split into order book (top)
  + trade ticket (bottom), bottom strip = positions/balances/open-orders tabs, top = symbol + a horizontal
  stat bar (mark price, 24h change, funding, OI, volume). Global nav is a thin top bar of text links
  (Trade/Vaults/Portfolio/Staking/Referrals/Leaderboard/More), no left sidebar.
- 768/390: the three columns collapse into a tabbed single column — Chart / Order Book / Trades as the
  primary tab row, with a secondary tab row for Balances/Positions/Outcomes/Open Orders/TWAP below. The
  symbol + mark price + change move to a sticky header; Connect is the one bright-teal CTA.
- Above the fold (desktop): everything actionable — price, chart, book, ticket, positions. Nothing
  important is below a scroll. Mobile prioritizes price → chart → tabbed depth/trades, ticket reached via tab.
- IA capture found no nav-link or heading outline (app is canvas/JS-rendered, not semantic-heading driven) —
  a note for our own a11y: we should keep real semantic landmarks where they did not.

## Motion & interaction
- Stack: Next.js + React + styled-components + TradingView (charting embedded, not built). No GSAP/Framer/
  Motion detected — there is no scroll-choreography layer because there is nothing to scroll.
- Motion is data-driven, not decorative: numbers tick/flash on update, the order book re-renders rows live,
  the chart streams. The "animation" is sub-100ms data freshness and color-flash feedback on price change —
  latency feel IS the motion design. Interaction states (hover on rows/links, active tab underline, the teal
  CTA) are the visible affordances; transitions are short and functional (state-change feedback only).
- Implication: in a cockpit, perceived speed > animated flourish. They invest in instant updates and a
  green status dot ("live") rather than easing curves.

## Trust signals
- A live status dot (green) on the chart header signals a connected, real-time feed.
- Mark price, 24h change, funding rate, open interest, and volume are all on the stat bar at once — full
  market context with no clicks, which reads as "nothing hidden."
- The order book shows two-sided depth with cumulative shading and a visible spread row — transparency of
  the market microstructure is itself a confidence signal.
- Restraint earns trust: monotone weight, one accent family, exact decimal alignment, no marketing chrome.
  The interface looks like an instrument, so the numbers feel authoritative.
- Explicit risk surface in the ticket (liquidation price field) keeps the downside visible before action.

## What Keel transfers (principles in our words)
- Binary type tiering over a scale cascade: one data size (~12px) + one label/readout size (~16px), tight
  ~1.25 line-height on the data tier. Let size+color carry hierarchy; keep weight near-monotone on dense grids.
- Tabular/column-aligned numerics everywhere money or market data appears — already our law (CLAUDE.md);
  this confirms decimal alignment is the backbone of a trustworthy ledger/book.
- Calm-dark, value-step depth: hairline borders + barely-lighter fills instead of ambient shadow; reserve a
  single elevation shadow for true floating elements (toasts, modals, the REVOKE confirm).
- Strict color-role discipline: one interactive/brand hue, plus a two-color directional semantic pair, and
  nothing decorative. Map cleanly to Keel — but our brand hue must NOT be teal/green (divergence, below).
- Maximal-context-no-scroll cockpit at desktop; tabbed single-column collapse at ≤768. Everything actionable
  above the fold.
- Latency-as-motion: invest in instant live updates + a live indicator + color-flash on change rather than
  decorative animation on trading surfaces. Decorative motion stays on the landing, per our motion rules.
- 8/10px working unit on a 4px sub-grid; tight row padding for data density, generous gaps only for header
  and the action panel.

## What Keel must NOT take (their identity markers)
- The teal/green hue family (mint ~rgb(80,210,193) + green ~rgb(31,166,125)) is Hyperliquid's signature.
  Keel's primary hue family must differ at a glance — pick a non-teal interactive accent and a distinct
  directional pair that still reads green/red-ish only insofar as up/down convention demands, in our own values.
- Their typeface (Inter-class neo-grotesque) — name it, then license or choose an open near-match with a
  different character for Keel's display face; do not inherit their exact family.
- The near-black blue-green canvas values, their copy, TradingView's chart chrome, and any verbatim CSS.
- Keel's differentiators have no analog here and must lead our cockpit: the plain-English policy card,
  the budget meter, the live activity feed, and the red REVOKE moment. Borrow their density and calm, not
  their face.
