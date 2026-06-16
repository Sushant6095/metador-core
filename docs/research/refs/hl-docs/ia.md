# Docs IA — Hyperliquid GitBook (benchmark)

Source: https://hyperliquid.gitbook.io/hyperliquid-docs · captured 2026-06-11 · 1440/768/390
Extraction note (CLAUDE.md §8): we lift IA structure, ordering logic, page skeleton,
and progressive-disclosure patterns. We take none of their copy, diagrams, the
mint accent, or the Inter/IBM-Plex pairing. GitBook is the platform, not the bar —
the bar is "Hyperliquid docs clarity," rebuilt as Keel.

## Nav tree (reconstructed, with depth)

Three navigation planes:
1. **Top tabs** (content spaces): `Hyperliquid Docs` · `Builder Tools` · `Support` — depth 0, content switchers, 3 items.
2. **Left sidebar** (the doc tree) — the real IA. Depth caps at **3**.
3. **Right rail** ("ON THIS PAGE") — per-page TOC, mirrors h2/h3, depth 2.

Left-sidebar tree (group → page → sub-page):

- **About Hyperliquid** (landing group, expanded by default) — depth 3
  - Hyperliquid 101 for non-crypto audiences
  - Core contributors
- Onboarding ▸ (collapsed group) — depth 2
- HyperCore ▸ — depth 2+
- HyperEVM ▸ — depth 2+
- Hyperliquid Improvement Proposals (HIPs) ▸ — depth 2
- Trading ▸ — depth 2+
- Validators ▸ — depth 2
- Referrals — depth 1 (leaf)
- Points — depth 1 (leaf)
- Historical data — depth 1 (leaf)
- Risks — depth 1 (leaf)
- Bug bounty program — depth 1 (leaf)
- Audits — depth 1 (leaf)
- Brand kit — depth 1 (leaf)
- **— FOR DEVELOPERS —** (uppercase section divider, not clickable)
  - API ▸ — depth 2+

Counts: **1 default-open landing group + ~13 sidebar entries + 1 dev group under 1 divider.**
Top-level sidebar groups (excluding leaves): ~8. Leaf pages at root: 7. Max nesting depth: **3**.
Pattern: concept-heavy areas nest (chevrons); policy/reference items stay flat leaves.

## Section ordering principle

Reading order is **orientation → onboarding → architecture → mechanics → governance →
reference/trust → developers**. Concretely: identity ("About / 101") first so a
newcomer self-selects; "Onboarding" second as the action path; the engine layers
(HyperCore, HyperEVM) next as the conceptual spine; "Trading" as the primary verb;
then governance (HIPs, Validators); then a trust/reference tail (Risks, Audits, Bug
bounty, Brand kit) that you arrive at, not start at. Developers are walled off last
behind an uppercase divider — humans first, integrators last. Footer "Next" pager
encodes the same linear spine for sequential readers.

## Progressive disclosure

- **Group collapse is the primary disclosure tool.** Only the landing group is open;
  everything else is a chevron the reader expands on intent. Sidebar shows breadth
  without dumping depth.
- **Uppercase dividers** ("FOR DEVELOPERS") partition audiences without adding a click.
- **Page reveal**: title → 1–2 sentence plain-English intro (h3 "What is X?") →
  short technical section (h3 "Technical overview") → one explanatory diagram → done.
  Complexity ramps top-to-bottom on a single page; the diagram lands after the prose,
  rewarding the scroll rather than gating it.
- **Right-rail TOC** ("ON THIS PAGE") lists only h2/h3, scroll-spies the active heading
  (mint highlight), and lets long pages be skimmed without re-scrolling the tree.
- **Footer pager** ("Next ▸ Hyperliquid 101…") plus "Last updated N days ago"
  give linear continuity and freshness signal at page end.

## Page anatomy (the repeated skeleton)

1. **Title** — h1, large (~36px), single line.
2. **Inline page actions** — small "Copy" affordance top-right of content.
3. **Intro** — one short paragraph, 14–16px body, ~20px line-height, no jargon.
4. **Heading rhythm** — h3 subheads ("What is X?", "Technical overview"); short
   paragraphs between; 2–4 sections per page, not a wall.
5. **Diagram / figure** — one focal visual mid-page, full content-width, on a
   tinted panel; carries the conceptual weight prose can't.
6. **Callouts / code** — IBM Plex Mono reserved for code and inline technical tokens
   (mono used sparingly — 3 of 227 type runs); body stays sans.
7. **Footer** — "Next" pager card (full-width, chevron-right) + "Last updated" stamp.
   Three-column shell at 1440: tree (left) · content (center, capped measure) · TOC (right).

## What Keel's docs transfer (structure + ordering) — and what they must NOT take

Transfer the **skeleton and ordering logic**, in Keel's own voice and palette:

- **Welcome** — identity-first landing group, open by default (their "About"). Plain
  "What is Keel?" + "How safety is enforced" before anything technical.
- **Concepts** — the conceptual spine (vaults, the four walls, shares/NAV, the crank),
  nested group, expanded on intent. One diagram per page, after the prose.
- **For Savers** — the onboarding/action path (deposit → follow → withdraw), early,
  human-first, leaf or shallow group.
- **For Leaders** — cockpit/strategy mechanics, parallel to "Trading," nested.
- **Risk & Safety** — trust tail (Risks, Audits, Bug bounty), arrived-at not led-with —
  but elevated higher than HL's because safety-made-visible is Keel's brand.
- **Roadmap** — flat leaf in the trust tail (their "Points/Historical" register).
- **Developers** — walled last behind an uppercase divider; humans before integrators.

Adopt: max depth 3; collapse-by-default groups; uppercase audience dividers;
title→plain-intro→detail→diagram page ramp; right-rail scroll-spy TOC; "Next" pager;
"Last updated" stamp; mono reserved for code only.

Do NOT take: their copy, the "Hyperliquid Stack" diagram or any figure, the mint
(rgb(151,252,228)) accent, the Inter + IBM Plex Mono pairing, "Powered by GitBook"
chrome, or section names verbatim. Keel reads as its own brand beside this page.

---

## Raw capture

Crawler reached only the landing page; tree below reconstructed from `shots/1440-full.png`.

Nav links:
- [Hyperliquid Docs](/hyperliquid-docs)
- [Hyperliquid Docs](/hyperliquid-docs)
- [Builder Tools](/hyperliquid-docs/builder-tools)
- [Support](/hyperliquid-docs/support)

Headings outline:
- h1: About Hyperliquid
    - h3: What is Hyperliquid?
    - h3: Technical overview
