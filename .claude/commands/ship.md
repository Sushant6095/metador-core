---
description: Definition-of-Done gate. Run before marking any M or L task complete. During G1 it also checks demo-readiness.
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [task or changeset]
---

Run the Definition of Done against: $ARGUMENTS
Execute the checks (don't assume). Output: item · PASS/FAIL · evidence.

## Checklist
1. `pnpm typecheck && pnpm lint && pnpm test` — run them, paste tails.
2. Move touched? `sui move test` green incl. abort-path tests.
3. Loading / empty / error states exist for every new surface.
4. 375px and 1440px verified (screenshot both).
5. Numbers formatted per coin decimals; no float artifacts (spot-check).
6. Analytics events wired and named from the registry only.
7. On-chain aborts on this path render via docs/abort-codes.md.
8. Journal entry written; WORKLOG.md one-liner appended; decision log
   updated if a decision was made.
9. G1 ONLY — demo-readiness: does this screen survive being filmed?
   (no lorem, no placeholder addresses, seeded data looks real, no console
   errors on screen).

Any FAIL -> task stays open. ≤3 build-loop iterations, then escalate.
