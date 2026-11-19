# MEGAPLAN V29 — Deferred scope

Items consciously deferred at close-out. Open rows folded into
`MEGAPLAN_BACKLOG.md` §2 with sharpened evidence.

## Deferred

- **V22-D3 — Pagan literal damage model** — NO-GO reaffirmed. Rewriting the
  damage scale (`damageCalc.ts:16-24`, `mechanics/weaponArmor.ts`) invalidates
  every combat baseline (kill rates, bout length, mortality bands). Requires
  its own campaign with a dedicated RED battery and end-to-end soak
  verification — not a merge-train passenger.
- **V22-D4 — ADM / graduation tier** — NO-GO reaffirmed. Caps are 3–25
  throughout (`ATTRIBUTE_MAX=25`); the two-tier canon (basic 3–21 → ADM
  3–25 + WL>21 INI bonus) is a design-level advancement feature, not a
  consolidation fix.
- **Dependabot alert triage (30 open)** — ~~recorded at baseline~~ **moot
  at close-out**: `gh api` shows 58 alerts, all `state: fixed`, 0 open.
  Historical bot PRs were closed superseded — bumps landed outside the bot
  PR flow. No triage debt remains.
- **PR #1091** — SUPERSEDED BY #1090 (identical code edits; its only unique
  hunk was a hand-edit to generated `docs/ORPHAN_REPORT.md` at the stale
  pre-V28 path — rejected). Left un-merged; closed at Phase 7 with a
  disposition comment.

## Watch items (folded to `MEGAPLAN_BACKLOG.md` §2)

- **`opfsArchiverFlush` afterEach hook-timeout flake** — **root-caused and
  fixed**: `vitest.config.ts` had `testTimeout: 120000` but
  `hookTimeout: 10000`; the `setup.node.ts` reset hooks lazy-import the
  heaviest module graphs (`useGameStore` → worker proxies/storage/
  enginePool), and the first `await import` in a starved worker exceeded
  10s. `hookTimeout` aligned to 30000 (the established slow-config value).
  Same fix covers V28's `tacticDiscovery.parity` instance.
- **`snap.json` (14MB, tracked, repo root)** — V28 observation resolved:
  **KEEP**. Committed dev fixture consumed by `scripts/balance-lab.ts`,
  `style-probe.ts`, `world-diag.ts`; seed-dependent content not trivially
  regenerable to identical state. Not dead weight — a working diagnostic
  input.
- **`fileBudget` rebaseline risk** — #1092's CoachOverlay `useShallow`
  refactor pushed `coach-overlay` spec file over the 80-line component
  budget (19→20 rows). Legitimate merge-induced drift; watch for
  ratchet-creep on future UI merges.
- **Pre-existing JSON duplicate labels** — `combatPbp` "SOLAR PLEXUS" and
  `uiMeta` "Fallen in combat." are legitimate shared labels allowlisted in
  `v29Narrative.guard.test.ts`; the ratchet forbids *new* value-dupes.
