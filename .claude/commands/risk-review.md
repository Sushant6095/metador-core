---
description: Mandatory review for any code path that moves funds. Pass/fail checklist — all items must pass or the path does not ship. No iteration cap; clean or escalate to founder.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [path or feature to review]
---

Run the funds-path risk checklist against: $ARGUMENTS

Verify each item by READING THE CODE (and running tests), not by assumption.
Output a table: item · PASS/FAIL · evidence (file:line). Any FAIL = overall
FAIL with a fix list.

## Checklist
1. INTEGER MONEY: every balance/price/fee/NAV value is bigint base units;
   no float touches money anywhere on the path (grep for `Number(`, `.toFixed`,
   `parseFloat` on money vars).
2. FOUR WALLS ON-CHAIN: the Move entry asserts budget, pool scope, expiry,
   revocation. UI-side checks exist only as UX, duplicated on-chain.
3. ABORT PATHS TESTED: `sui move test` includes a failing test per wall
   (codes 1–7) and they pass.
4. KNOWN-ANSWER MATH: NAV/share/fee calculations have unit tests with
   hand-computed expected values (the Maya 1,000 -> 1,108 case minimum).
5. DRYRUN SHOWN: the app simulates the tx and displays exact effects
   (amounts, objects mutated) BEFORE requesting signature.
6. INDEXER LAG HANDLED: post-mutation refetch with delay; unconfirmed
   balances never displayed as final.
7. FAILURE MODES ENUMERATED: what happens on partial fill, RPC timeout,
   user rejection mid-PTB, cranker double-fire (idempotency), expiry during
   flight — each has defined behavior.
8. NO KEY MATERIAL: no private key, mnemonic, or signer secret is read,
   stored, or logged anywhere on the path.
9. CLAIM DISCIPLINE: any user-facing copy on this path makes no earnings
   promise; risk disclosure present before first deposit.
10. (G4 margin paths only) liquidation price visible on every open position;
    health factor math has known-answer tests.

End with: VERDICT (SHIP / DO NOT SHIP) + journal line written to mind/.
