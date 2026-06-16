# Lessons (deduped, imperative)

- Merge new process machinery onto locked decisions; never let a fresh
  prompt draft silently reopen a CLOSED decision — diff against the
  decision log first.
- Run the riskiest spike before any scaffolding; nothing else matters if
  the cross-package call doesn't work.
- Subtraction wins: a feature ships only if it's in the demo's critical
  path AND deepens the core mechanism. Everything else is roadmap.
- For DeepBook fees during testing, use the DEEP/SUI whitelisted pool
  (fee-free) before fighting DEEP token logistics on SUI/DBUSDC.
- Write known-answer money tests BEFORE implementing the formula
  (Maya 1,000 -> 1,108 is the canonical case).
- On this machine: zip can't atomic-replace files on the session mount —
  create in /tmp and cp over. Dot-folders need shell, not file tools.
- When pinning a Move dependency tree for publish, walk EVERY transitive
  package for `published-at` (deepbook's `token` dep also lacked it) and
  check each package's Move.lock `[env.<net>]` before deriving ids by hand
  — the lock file is authoritative when present.
- Never `catch { return null }` in tooling — a swallowed error cost a full
  capture run before the real bug (esbuild keepNames injecting `__name`
  into page.evaluate callbacks; shim via addInitScript pre-goto) surfaced.
- SPA bundles hide library names from URL-based detection; scan bundle
  CONTENTS for string markers that survive minification.
- @mysten/sui v2: `getFullnodeUrl` is gone — use `getJsonRpcFullnodeUrl`
  from `@mysten/sui/jsonRpc` and pass `network` in createNetworkConfig.
  Check the installed package's README before external docs.
- `pkill -f "next start"` misses the `next-server` child; kill by port
  (`lsof -ti:PORT | xargs kill`) or the old server survives a rebuild and
  serves stale chunk manifests (CSS 500s that look like build breakage).
- Full-page screenshots capture `whileInView` sections at opacity 0 —
  verify landings with a stepped-scroll shot AND a no-JS DOM check before
  judging them broken.
- Adversarial judge panels earn their cost: divergence + implementability
  judges forced 18 concrete fixes into the token freeze; the post-build
  panel caught a real AT-blocking bug (aria-hidden wrapping the dialog)
  and an invalid ARIA `meter` role that all green gates had passed.
