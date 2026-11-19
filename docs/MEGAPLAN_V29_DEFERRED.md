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
- **Dependabot alert triage (30 open)** — recorded at baseline; blind
  version-bumping inside a merge train is unsafe. Flagged for a dedicated
  security pass with per-alert advisories.
- **PR #1091** — SUPERSEDED BY #1090 (identical code edits; its only unique
  hunk was a hand-edit to generated `docs/ORPHAN_REPORT.md` at the stale
  pre-V28 path — rejected). Left un-merged; closed at Phase 7 with a
  disposition comment.

## Watch items (folded to `MEGAPLAN_BACKLOG.md` §2)

- **`opfsArchiverFlush` afterEach hook-timeout flake** — suite-load flake
  class (same signature as V28's `tacticDiscovery.parity`); standalone
  rerun green 6/6 at baseline. Pre-existing, not V29-caused.
- **`fileBudget` rebaseline risk** — #1092's CoachOverlay `useShallow`
  refactor pushed `coach-overlay` spec file over the 80-line component
  budget (19→20 rows). Legitimate merge-induced drift; watch for
  ratchet-creep on future UI merges.
- **Pre-existing JSON duplicate labels** — `combatPbp` "SOLAR PLEXUS" and
  `uiMeta` "Fallen in combat." are legitimate shared labels allowlisted in
  `v29Narrative.guard.test.ts`; the ratchet forbids *new* value-dupes.
