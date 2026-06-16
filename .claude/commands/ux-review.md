---
description: Flow-level UX review — friction, trust signals, comprehension, mobile. Run on a full user journey, not a single component.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [journey, e.g. "deposit" or "create vault"]
---

Review the journey: $ARGUMENTS. Walk it step by step as each persona
(Maya depositor / Leo leader / first-time visitor). Output: numbered friction
list with severity (blocker / major / paper-cut) + fixes.

## Checklist
1. CLICKS: deposit reachable in ≤3 clicks from landing; create vault ≤3
   steps; withdraw ≤2 clicks from portfolio.
2. COMPREHENSION: a crypto-curious non-trader can answer after the screen:
   "where is my money, who can touch it, how do I leave?" If not, copy fails.
3. TRUST SIGNALS: every on-chain fact links to the explorer; policy card
   visible before deposit; risk disclosure before first deposit (not after).
4. JARGON: zero unexplained terms (TradeCap, NAV, crank) on consumer
   surfaces — plain words first, term in parens if needed.
5. ERROR EMPATHY: abort messages say what happened AND what to do next;
   no raw codes or hex in user-facing text.
6. MOBILE (375px): primary journey completable; tap targets ≥44px; no
   horizontal scroll.
7. WAITING: every async step has progress feedback within 100ms and a
   pending state that names what's happening ("placing order on DeepBook…").
8. EXIT INTEGRITY: withdraw is never gated, hidden, or guilt-tripped.

VERDICT: SHIP / ITERATE with fix list.
