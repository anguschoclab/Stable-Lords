# Curator's Journal

Tracked memory for the `curator` agent — see README for rules. Critical
learnings only: fields that looked usable but weren't, correct surfacing
patterns, rejected features.

## 2026-11-22 - Slice fields can die at BOTH serialization boundaries

**Data:** `GameState.bloodfeudMarks` (V24/V26 feud entitlements) — existed in
the worldSlice, the save schema, and the engine (PromoterPass consumes it),
yet the store copy was permanently `[]`.
**Learning:** A field being in a slice + `gameStateSchema` does NOT mean it
reaches the UI or even the engine. `collectStoreValues`/`GameStateValues`
(→ `reconstructGameState` → worker input + `useWorldState`) and
`hydrateDraft` (worker-result/save commit) are SEPARATE hand-maintained
field lists. `bloodfeudMarks` was missing from both, so marks written at
bout resolution were dropped on commit and never reached the next week's
PromoterPass — the canon 4-week feud was dead code in the app while engine
tests (which reuse one state object) passed.
**Pattern:** Before building on any state field, grep it in
`src/state/serialization.ts` (collectStoreValues) AND
`src/state/createStore.ts` (hydrateDraft). Absence from either = silent
drop. `src/test/state/reconstructionFieldParity.test.ts` guards the two
lists against each other — fix both and it passes; also expect
`scripts/test-audit-scan.mjs` (runnerGroups.json) and the
`scanInLoop.guard` (hoist per-killer lookups to a Map, don't `.find()`
inside a marks loop) to police new surfacing code.
