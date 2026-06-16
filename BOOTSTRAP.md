# BOOTSTRAP — build Keel from an empty folder (v3.1)

Run once, as KAIOS, under the rules of `CLAUDE.md` (KAIOS v3.1). Phases are
sequential. Every phase ends with its verify gate passing and a journal
entry. If a verify gate fails 3 attempts: record what happened in the journal
and ask the founder. Do not start visual polish before Phase F freezes tokens.

**Gate-clock compression.** G1 submission is June 21. Targets: Phases A–D
within 2 days · Phase E first-pass parallel to D · Phase F freeze by June 13
· Phase G by June 14 · Phase H (the spike) runs FIRST, tonight, out of order
— nothing else matters if it fails. The full Phase E capture of all
benchmarks completes during G2; G0 captures only app.hyperliquid.xyz
(Vaults + Trade) and hyperfoundation.org.

## Phase H′ — Protocol spike (runs first, tonight)
From the existing runbook (imported artifact): publish `agent_mandate` to
testnet, place a policy-gated **spot** order on SUI/DBUSDC (or DEEP/SUI for
the fee-free path), reproduce all three demo aborts (over-budget,
wrong-pool, key-leak withdraw refusal), log every tx digest.
NOTE v3.1: the spike is SPOT vaults, not margin — DECIDE-001 is closed and
margin is G4. The margin-manager spike text from v3 moves to G4 entry.
If evaluating DECIDE-004: attempt the same trade through a Privy Sui wallet
and record whether the `MoveCall` signs.
**Verify:** spike reproducible from a clean checkout; known-answer tests for
NAV/shares/budget-debit math pass (`sui move test`). G0 cannot exit without
this.

## Phase A — Skeleton
1. Init monorepo: pnpm workspaces + Turborepo, TS strict base config,
   ESLint + Prettier, Vitest, Playwright, CI workflow (typecheck/lint/test;
   Move job: `sui move test`).
2. Create the full tree from `CLAUDE.md §11`, including `apps/web`,
   `apps/app` (Next.js App Router), `contracts/keel_core` (seeded from
   `agent_mandate`), `services/cranker`, all packages, `/mind`, `/docs`,
   `/.claude/{agents,commands,skills}`.
3. Seed `PRODUCT.md` (≤1 page: vision, target user, non-goals, gate roadmap),
   `ARCHITECTURE.md` (system map = the 6 mermaid diagrams, imported),
   `DESIGN.md` (stub), `WORKLOG.md`, `docs/abort-codes.md` (from spike).
**Verify:** `pnpm build` green across the workspace; CI passes on first push.
**Gate:** founder reviews `PRODUCT.md` before Phase B.

## Phase B — The Mind
1. Create `mind/state.md` (snapshot template: gate / open tasks / blockers /
   next 3 actions), `mind/journal/` with today's file, `mind/lessons.md`.
2. Configure hooks — **check current Claude Code hooks docs for the exact
   schema before writing config; do not write it from memory:**
   - `PostToolUse`: append `timestamp · tool · target` to today's journal.
   - `SessionStart`: surface `mind/state.md`.
3. Write `.claude/commands/journal.md` (refresh state + journal on demand).
**Verify:** one trivial edit → hook appended a journal line and `state.md`
reflects reality.

## Phase C — Skill curation
1. Clone and read: `mattpocock/skills`, `Leonxlnx/taste-skill`,
   `safishamsi/graphify`, `FlorianBruniaux/claude-code-ultimate-guide`
   (mine for setup patterns, not skills). Browse skills.sh for matches.
2. Adoption rubric — all five or it doesn't come in: (a) maps to a recurring
   Keel task, (b) concrete procedures, not vibes, (c) license permits
   adaptation — keep attribution header, (d) trigger description precise and
   ≤ ~400 chars, (e) worth its permanent context cost.
3. Author the Keel-custom set from `CLAUDE.md §6` — including
   `sui-move-expert` (ACTIVE: DECIDE-001 closed = we own contracts).
   `risk-math` and `deepbook-expert` get the most care — they guard money.
4. Enforce the cap: ≤12 active. Archive rejects with one-line reasons in
   `docs/research/skill-curation.md`.
**Verify:** trigger-test two skills (`design-taste` on a deliberately ugly
component; `risk-math` on a float-based PnL calc — both must fire and object).

## Phase D — Agents & commands
1. Write `.claude/agents/{product,design,frontend,protocol,growth}.md` with
   frontmatter (name, description, tools, model per `CLAUDE.md §6` — opus on
   product/design, sonnet on builders). Each body: charter, what it reads
   before acting, what it owns, what it must never touch, when it escalates.
   `protocol` additionally owns `contracts/keel_core` and `services/cranker`.
2. The `design` agent body includes the Design God charter and the Reference
   Extraction Protocol verbatim.
3. Write `.claude/commands/{ux-review,design-review,arch-review,risk-review,
   capture,journal,ship}.md`. Reviews are checklists with pass/fail items.
   `/design-review` includes the divergence check. `/risk-review` includes:
   bigint-only, dryRun shown, four-walls coverage, failure modes enumerated,
   known-answer tests present (liquidation items activate at G4).
**Verify:** smoke-invoke every agent on a trivial task in its domain; run
`/ship` against a stub and confirm it fails for the right reasons.

## Phase E — Reference Lab + capture runs
Build `packages/reference-lab` (Playwright + TS).
G0 targets: `app.hyperliquid.xyz` (Vaults + Trade), `hyperfoundation.org`.
G2 targets: `hyperscreener.asxn.xyz/home`, GitBook bar, Sui-native set
(suilend.fi, typus.finance/vault, kai.finance/vaults, trade.bluefin.io).
motion.dev/examples bookmarked for the motion system.
Per target, per viewport (390 / 768 / 1440):
1. `capture.ts` — full-page screenshot; stepped scroll shots (~800px,
   600ms settle); video of one slow programmatic scroll (records
   scroll-triggered animation); Playwright trace.
2. `styles.ts` — computed styles walk: font stacks, every size/weight/
   line-height, color frequency table, spacing samples, radii, shadows →
   `measurements.json`.
3. `stack.ts` — detect libraries from script tags + network (three, Spline,
   motion/framer, GSAP, lenis…) → `stack.md`.
4. `flows.ts` — nav link graph, page tree, headings outline → `ia.md`.
5. Manual pass (Claude in Chrome / devtools) for what scripts miss: easing
   feel, sequencing, hover states, modal behavior → `interactions.md`.
Output to `docs/research/refs/<site>/`; design agent writes `patterns.md`
per site + cross-site `PRINCIPLES.md`. Extraction Protocol governs everything.
**Verify (G0 scope):** both targets — screenshots at all 3 viewports, scroll
video plays, `measurements.json` non-empty, `stack.md` names their actual
animation library.

## Phase F — Brand thesis, tokens, motion system
1. `design` agent writes the brand thesis (1 page in `DESIGN.md`): what Keel
   feels like, voice, color world, type direction — explicitly positioned
   against the benchmarks ("their teal-on-dark is theirs; ours is…"). The
   thesis names what no benchmark has: safety made visible (policy card,
   budget meter, REVOKE as a designed moment). Display + text typefaces from
   licensed or open foundries.
2. Freeze tokens in `packages/design-system` (CSS vars + typed TS export):
   color, type scale, spacing grid, radii, shadows, z-layers — informed by
   `measurements.json`, passing the divergence check. (The prototype's token
   set is the starting hypothesis, not the answer.)
3. Primitives in `packages/ui`: Button, Card, Stat, Table (dense, numeric,
   tabular-nums), Modal, Toast, Tabs, Skeleton, Chart shell — plus Keel
   natives: PolicyCard, BudgetMeter, ActivityRow, AddressPill.
4. Motion system in `DESIGN.md#motion`: duration/easing tokens, enter/exit
   patterns, scroll choreography spec — from motion.dev study, implemented
   with Motion only.
**Verify:** `/kitchen-sink` renders every primitive in light/dark;
`/design-review` passes including divergence check.
**Gate:** founder approves brand thesis + tokens before Phase G.

## Phase G — App shells
1. `apps/app` FIRST (G1 is the product): app layout, nav, wallet connect
   (dapp-kit, testnet), vault marketplace skeleton on the dense Table/Card
   primitives, vault-detail + cockpit skeletons per the prototype contract.
2. `apps/web`: hyperfoundation-grade shell — hero (static poster now, Spline
   slot behind lazy boundary), section rhythm per captured choreography.
   Skeleton only in G0; polish is G2.
3. Wire PostHog via `packages/analytics`; first events: `page_view`,
   `wallet_connected`, `vault_viewed`, `deposit_started`, `waitlist_joined`.
4. GitBook space: structure only (content G3).
**Verify:** both apps run; web shell meets LCP < 2.5s / CLS < 0.05 locally;
wallet connects on testnet; events visible in PostHog.

## Close-out
1. Rewrite `mind/state.md`; promote first entries to `lessons.md`.
2. Decision log: record DECIDE-001 as CLOSED (with evidence links);
   DECIDE-002 proposed; open DECIDE-003/004/005 with a recommendation each.
3. Present the founder a summary: what exists, what's verified, what's
   blocked on him. Stop.
