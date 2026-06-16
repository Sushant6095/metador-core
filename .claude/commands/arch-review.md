---
description: Architecture review — boundaries, complexity vs need, overbuild detection. Run on L tasks and any new package/service.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [package, service, or ADR to review]
---

Review: $ARGUMENTS. Output table: item · PASS/FAIL · evidence, then verdict.

## Checklist
1. LAYER GUARDRAIL: no matching, settlement, oracle, or liquidation code
   anywhere in our tree — that's DeepBook's layer.
2. THE OVERBUILD QUESTION: "would a senior call this overbuilt for current
   scale?" — current scale is testnet, <100 users. Kafka/microservices/own
   indexer need a graduation trigger met, not anticipated.
3. BOUNDARIES: tokens only in design-system; components only in ui; event
   names only in analytics; tx building only in deepbook package; Move only
   in contracts/. No leaks (grep imports across boundaries).
4. SYNC CONTRACTS HONORED: interfaces changed in the same PR as
   implementations; diagrams updated if architecture moved.
5. DEPENDENCY DISCIPLINE: new deps justified in the task/ADR; no duplicate
   capabilities (two chart libs, two animation libs).
6. SINGLE SOURCE OF TRUTH: no state duplicated between chain, cache, and UI
   without an owner and an invalidation rule.
7. REVERSIBILITY: can this change be backed out in <1 hour? If no, it
   needed an ADR — check it exists.

VERDICT: SHIP / SIMPLIFY (with the specific deletion list) / ESCALATE.
