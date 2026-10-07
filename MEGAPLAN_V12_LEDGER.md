# MEGAPLAN V12 LEDGER — SRP/DRY Audit & Refactor

## Baseline

- **Branch:** `main` · **Restore tag:** `pre-megaplan-v12` at `0146a8a1`
- **Baseline gates (all regenerated fresh — committed `scripts/out/*` artifacts
  were stale, e.g. knip report predated V11):**
  - `type-check`: ✅ 0 errors · `lint`: ✅ 0/0 · `build`: ✅ · `electron:compile`: ✅
  - `vitest`: ✅* 806/807 files, 8,978 pass — 3 fails = `retrieveHotStatePlausibility`
    worker-pool flake (passes isolated; V11-documented, unchanged verdict)
  - `narrative-validate`: ✅ · `find-dupes`: ✅ clean · `data-array-dup`: ✅ clean
  - `jscpd`: 115 clones / 0.75% (report-only) · `knip`: 193 exp / 68 types / 4 dup
  - `dup-scan`: 43 src↔src / 129 test↔test / 41 mixed · `param-count`: 0
  - `orphan-scan`: deadExports src-scoped 174 (ceiling 176); unreachable 2
    (ambient `.d.ts`, allowlisted); testOnly 0; unlinkedPages 0
  - `entries-in-loop`: 5 (all KNOWN_EXCEPTIONS) · `ui-audit`: 0 hits
  - fn census: 2 fns >80 LOC (`useScouting` 83, `emitWarriorBid` 83); 0 >120

## Phase dispositions

| Phase | Work | Commits |
| --- | --- | --- |
| 0 — baseline | restore tag; all scanner reports regenerated; FINDINGS seeded | (this commit) |
| 1 — audit | all 43 src↔src clusters verdicted; SRP sweep (layer-contamination clean, no grab-bags, 2 fns >80 reviewed); KNOWN_SRC_PAIRS staleness measured (111/154 dead) | (this commit) |

## Approved work queue (from FINDINGS)

| ID | Item | Disposition | Status |
| --- | --- | --- | --- |
| D1 | fresh-warrior zero-state literal ×3 prod (warriorFactory/recruitGenerator/SystemPass) | DEDUPE → shared defaults helper | pending |
| D2 | `pendingResolutionData` schema ×2 (fightSchemas/gameStateSchema) | DEDUPE → `PendingResolutionDataSchema` | pending |
| D3 | trainer-bonus→mods map ×2 (fighterState/simulateHelpers) | DEDUPE → `trainerBonusToMods` | pending |
| D4 | FIELD_TYPES re-list in crestGenerator | DEDUPE → derive from enumSources + guard | pending |
| D5 | `favoredName` verbatim ×2 (bout-viewer panels) | DEDUPE → shared module | pending |
| D6 | selectable-entity-row markup ×~5 (scouting/booking/trainingPlanner) | DEDUPE → `SelectableRow` primitive | pending |
| D7 | glow tab-strip ×2 (WarriorDossierTabs/StableDetail) | DEDUPE → `IconTabStrip` primitive | pending |
| D8 | FileReader→JSON scaffold ×2 (ImportExport/Mods) | DEDUPE → `readJsonFileInput` | pending |
| D9 | tooltip-badge shell ×2 (LiabilityBadge/PotentialBadge) | DEDUPE → `TooltipBadge` primitive | pending |
| D10 | expandable-bar a11y ×2 (MiniCombatLog/TacticalBar) | DEDUPE → shared toggle-keydown handling | pending |
| D11 | `isPlausibleGameState` field-check boilerplate | DEDUPE → table-driven spec | pending |
| S1 | `emitWarriorBid` 6-strategy monolith | RESTRUCTURE → per-intent emitters | pending |
| H1 | `KNOWN_SRC_PAIRS` 111 dead entries + baseline 128 | prune + tighten | Phase 7 |
| H2 | mislabeled `describe('MEGAPLAN-V12')` in v11Dedup guard | DOCUMENT fix | Phase 6 |
| E1 | `engine/impacts` fn-surface (14 dead exports) + knip residuals | per-symbol audit | Phase 5 |

## Preservation register (deletions/merges — evidence ledger)

| Item | Disposition | Evidence | Commit |
| --- | --- | --- | --- |
| (populated as Phases 3–5 land) | | | |

## Bugs found (failing-evidence-first)

(none yet)
