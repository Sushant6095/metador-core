# Open decisions (founder)

## DECIDE-002 — Mainnet gate — PROPOSED
Mainnet deploy requires: (a) two external reviews (OtterSec + OpenZeppelin
office hours during hackathon), (b) caps enforced in Move ($500/vault, $5K
global) and fees OFF, (c) founder writes "go mainnet" here. Target: August
(unlocks remaining 50% of any prize). FOUNDER TO CONFIRM.

FOUNDER DIRECTIVE (2026-06-11): target accelerated — guarded mainnet BY
JUNE 21 as a STRETCH GOAL. Rationale: handbook pays 100% of prize upfront
if mainnet by announcement; submitting ON mainnet is a differentiator
almost no team will have.

Conditions (architect-countersigned; all hold or mainnet slips back, the
submission does not):
1. PROTECTED FLOOR: testnet build + red-team demo video + submission are
   never displaced. Mainnet is additive. If anything competes for hours
   with the G1 must-haves after June 18, mainnet waits.
2. Spike + full testnet E2E (deposit -> leader trade -> withdraw -> revoke)
   green by June 14, or stretch is off for the 21st.
3. External reviews: OtterSec + OpenZeppelin office hours BOOKED today
   (their calendar is the constraint, not our work); minimum ONE completed
   review before mainnet publish. Two remain required before caps ever lift.
4. Launch shape: caps in Move ($500/vault, $5K global), fees OFF,
   SELF-VAULTS ONLY (leader == owner; no third-party deposits) until both
   reviews complete. Risk disclosure gate live.
5. Real-money float: founder's own funds only, <= $300 total exposure.
6. Scope clarification: this accelerates the MAINNET DEPLOY only. G2
   features (mirror copy, leaderboard, stop-losses, landing polish) remain
   Demo Day scope — they do not move to June 21.
7. "Go mainnet" still gets written here explicitly before publish, with
   the review evidence linked.

## DECIDE-003 — Compliance posture — OPEN
Geo-blocking, disclaimers, entity timing. Fees stay OFF until counsel
reviews. Never decided silently. Owner: founder.

RECOMMENDATION (2026-06-11, not a decision): G1/G2 are testnet-only — no
geo-blocking needed; ship universal risk disclosure before first (testnet)
deposit anyway so the pattern is built. Before G3 guarded mainnet: (a)
app-layer interface geo-block for US + sanctioned jurisdictions (standard
DeFi posture), (b) ToS + risk-disclosure click-through gating first deposit,
(c) entity formation AFTER Demo Day — prize/traction informs jurisdiction;
counsel review funded from prize before fees ever turn on.

## DECIDE-004 — Onboarding — OPEN (default: dapp-kit wallets)
v1 = extension wallets via dapp-kit. Enoki/zkLogin targeted G2. Privy only
if a DeepBook MoveCall signs end-to-end through it (Tier-2 Sui caveat).

RECOMMENDATION (2026-06-11, not a decision): confirm the default — dapp-kit
extension wallets only for G1 (now wired in apps/app: providers + testnet
network config). Start the Enoki/zkLogin spike in G2 week 1 (Mysten-native,
no Tier-2 policy risk, judges love walletless onboarding). Drop the Privy
track entirely unless Enoki fails its spike — two embedded-wallet spikes is
one too many before Demo Day.

## DECIDE-005 — Margin venue entry (G4) — OPEN
Requires: Margin SDK spike passes, liquidation-display /risk-review clean,
founder go.

RECOMMENDATION (2026-06-11, not a decision): keep both criteria and add a
demand gate — enter margin only after spot copy-trading shows retention
(repeat depositors across ≥2 weeks on mainnet). If audit budget is thin at
G4 entry, sequence the NoLoss/Predict venue first: smaller risk surface,
same "policy walls" story, cheaper to review.
