# Keel — Mind State
Snapshot: 2026-06-13 · app premium-consistency sweep COMPLETE (parity app 100%, REVOKE choreography live) · keel_core ported · risk-review closed

## App parity sweep (founder STEP 3) — DONE
- parity app 18/18 = 100% PASS (marketplace rebuilt to screener density grammar).
- Shared DataTable primitive in @keel/ui codifies the won grammar (40px/13px/12px/mono-right, mono flag, sortable aria-sort, toolbar); marketplace + cockpit consume it.
- REVOKE choreography to DESIGN.md #motion spec on /vault/[id] owner view: Arm (modal, 800ms hold-to-confirm, brass→revoke sweep, release-cancels) → Commit (badge crossfade + single 520ms heat bloom + meter desaturate/lock + policy stamp) → Settle (actions disabled + persistent terminal feed row). Reduced-motion = instant. Failure paths wired: ?revoke=abort (tint-danger banner, no flip) / ?revoke=reject ("Signature cancelled" note). Mock state flip; real PTB TODO left in RevokeDialog for G1.
- Async states reachable: vault ?loading=1 skeleton, cockpit ?demo=1 leader view, DataTable skeleton/empty.
- Numerals law audited app-wide; token-grep gate clean; vault_revoked event added to registry.
- Shots: docs/research/keel-shots/app-parity/round-{1,2,3}/ (+ revoke armed/holding/settled/abort/reject).

## Gate
G0→G1 · 9 days to submission (June 21) · DECIDE-002 stretch: mainnet by 21st
(condition 2: testnet E2E green by June 14 — keel_core port done, spike still
needs the faucet)

## Done this sprint (all gates green: 9/9 typecheck·lint, 47 TS + 61 Move tests, build 3/3)
- PHASE 1 deep capture: choreo instrumentation (multi-speed scrolls, per-
  scrollY style deltas, frames) → choreography.md (their hero = pinned
  canvas + ambient loop, NO DOM reveals, static pill nav — composition
  carries); hyperscreener density (~40px rows) → patterns.md; GitBook IA
  (depth 3, 8 groups) → hl-docs/ia.md. Capture artifact documented (1440
  headless render hero-stuck; 390 + founder shots = ground truth).
- ORIGINAL LOGO: keel-spine mark (hull section + keel blade + waterline
  ticks after goblet-read veto round) — KeelMark/KeelLogo in ui, both navs,
  favicons.
- PHASE 2: web home rebuilt per contract — three.js brass gyroscopic
  armature hero (lazy behind same-instrument poster, reduced-motion safe),
  stat band count-up, custody-problem → four walls → live feed → Maya/Leo →
  red-team teaser → builders band → waitlist → full-bleed Fraunces wordmark
  footer. Design Loop 1 iteration; panel: divergence PASS (decisive), perf
  PASS (LCP/CLS in budget, three deferred); 7 review fixes applied.
- PHASE 3: apps/docs 22-file GitBook tree + root .gitbook.yaml +
  SETUP-GITBOOK.md (5 founder steps). Claim-discipline audited; 4 accuracy
  fixes applied (BM-ownership story now exact).
- PHASE 4: /screener — 16 mock vaults, 42px rows / 15 rows@1440 (density
  independently pixel-verified), URL-state sort/filter/density, nav link.
  6 review fixes applied (incl. 390 collision blocker + filter logic bug).
- keel_core G1 PORT: vault.move (shares ledger, deposit/withdraw, locked
  TradeCap, revoke) + shares.move (pure math, Maya 1,000→1,108 known-answer)
  + delegate.move + dca.move (permissionless tick, walls re-checked).
  61/61 sui move test. Spike modules UNTOUCHED — runbook still valid.
- Dev-overlay lockfile warning fixed via outputFileTracingRoot (both apps).

## Risk Loop — CLOSED (CLEAN_WITH_ESCALATION)
- Pass 1: 2 CRITICAL (deposit phantom mint; DCA cross-vault drain) + 4
  HIGH + 5 MEDIUM. All 11 fixed; 73/73 Move tests; abort codes 33/34/35.
- Pass 2 verified every fix in code; caught one false fix-claim (spike
  u64 add — ruled correct scope, office-hours item).
- ESCALATION → ADR-006 (PROPOSED): deposit custody model. G1 self-vaults
  = safe (no theft path). G2 third-party deposits BLOCKED until
  DepositCap-in-vault (DeepBook primitive exists) is implemented +
  risk-reviewed. Founder decides; put on OtterSec/OpenZeppelin agenda.

## Keys (testnet, DISPOSABLE — phrases touched session logs)
- OWNER (active): 0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7
- AGENT: 0x0f25c3a1e6f282ea0c95faa4518dbaa1607d888a6608d04fbedc408e1e59c608

## Founder actions (unchanged + one new)
1. FUND OWNER (captcha): https://faucet.sui.io/?address=0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7
   → "continue the spike" → §2-6 + now ALSO the keel_core E2E (deposit →
   leader trade → withdraw → revoke) for DECIDE-002 condition 2 (June 14!).
2. RATIFY Phase F freeze (DESIGN.md) + eyeball the new logo + web home.
3. Review diff + add git remote → CI first push.
4. BOOK OtterSec/OpenZeppelin office hours (DECIDE-002 condition 3: "BOOKED
   today" — their calendar is the constraint).
5. GitBook: follow apps/docs/SETUP-GITBOOK.md (5 steps).

## Next tasks (after risk-review verdict)
1. Fix any risk-review findings (Risk Loop until clean)
2. Spike §2-6 + keel_core testnet E2E (needs faucet)
3. Wire app shells to keel_core (replace mocks) — G1 critical path
4. Cranker real ticks vs keel_core dca
5. Demo wallets + book liquidity + 4-min video script

## Blockers
Faucet only (founder). Everything machine-side is done or in the Risk Loop.
