---
description: Refresh the Mind — finalize today's journal and rewrite mind/state.md as a current snapshot. Run at session end or on demand.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Update the Mind (KAIOS §7):

1. Open mind/journal/$(date +%F).md. Below the auto-appended hook lines,
   write the human layer: per completed task — goal, what was actually done,
   files touched, verify result, surprises. Keep each task ≤5 lines.
2. REWRITE mind/state.md from scratch (snapshot, not log):
   - Gate + phase we are in (and days to next gate date)
   - Open tasks (≤7, ordered)
   - Blockers (with who/what unblocks them)
   - Next 3 actions (concrete enough to start cold)
3. If today produced a reusable learning, append it deduped to
   mind/lessons.md (one line, imperative form).
4. If any decision was made today, confirm it exists in docs/decisions/ —
   if not, write the ADR stub now and flag it.

Output: the new state.md content, verbatim, for founder visibility.
