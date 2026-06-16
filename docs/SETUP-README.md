# Metador — Claude Code Setup (the "ultimate setup", materialized)

This folder contains the complete multi-agent operating system from
KAIOS v3.1, as real files. Nothing here is hypothetical.

## What's inside

```
.claude/
  settings.json        # hooks: PostToolUse -> auto-journal · SessionStart -> surfaces mind/state.md
  agents/              # 5 subagents: product(opus) design(opus) frontend protocol growth
  commands/            # 7: /risk-review /design-review /ux-review /arch-review /ship /capture /journal
  skills/              # 7: sui-move-expert deepbook-expert risk-math design-taste
                       #    reference-capture motion-craft brand-voice  (cap: 12)
mind/
  state.md             # current snapshot (seeded with real status as of Jun 10)
  journal/2026-06-10.md
  lessons.md
```

## Install (2 minutes)
1. This already sits in your repo root candidate (~/Downloads/keel).
   Rename `KAIOS-v3.1.md` -> `CLAUDE.md` in the same folder.
2. Open the folder in Claude Code. RESTART Claude Code once — agents and
   commands register at startup (hooks in settings.json are live
   immediately, but a restart picks up everything cleanly).
3. Verify, in a fresh session:
   - state.md content appears as session context (SessionStart hook)
   - `/agents` lists product, design, frontend, protocol, growth
   - type `/risk` and see /risk-review autocomplete
   - edit any file -> a line appears in mind/journal/<today>.md
4. jq must be installed on your Mac for the journal hook (`brew install jq`).

## How to use the team
- "Use the protocol agent to port agent_mandate into contracts/keel_core"
- "Use the design agent to write the brand thesis" (it carries the Design
  God charter + Extraction Protocol)
- After any funds-path change: `/risk-review <path>` — it's mandatory.
- Before marking work done: `/ship <task>`.
- Session end: `/journal`.
- Parallelism: one git worktree per builder agent, one Claude Code session
  per worktree; the Architect (your main session) merges.

## First command to give it
"Read CLAUDE.md and BOOTSTRAP.md. Execute BOOTSTRAP Phase H' (the spike)
guided by mandate/SPIKE-RUNBOOK.md, then Phase A."
