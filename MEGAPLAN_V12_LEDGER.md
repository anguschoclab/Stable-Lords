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
| 2 — test gate | `v12Dedup.guard.test.ts` (10 specs) + `v12Srp.guard.test.ts` authored red-first, committed before prod edits | f5e71515+ |
| 3 — SRP | S1 `emitWarriorBid` split into per-intent emitters preserving precedence order (vendetta→survival→crown→challenged→recovery→expansion→standard); `undefined`=fall-through vs `null`=terminal-no-bid | this batch |
| 4 — DRY | D1–D11 all implemented; src↔src clusters **43 → 32** (11 pairs eliminated); residual pairs are page↔hook seams / shadcn boilerplate / ordered design data | this batch |

## Approved work queue (from FINDINGS)

| ID | Item | Disposition | Status |
| --- | --- | --- | --- |
| D1 | fresh-warrior zero-state literal ×3 prod (warriorFactory/recruitGenerator/SystemPass) | DEDUPE → `src/engine/factories/warriorDefaults.ts` `newWarriorDefaults()` | DONE |
| D2 | `pendingResolutionData` schema ×2 (fightSchemas/gameStateSchema) | DEDUPE → `PendingResolutionDataSchema` exported from `fightSchemas.ts`, imported by `gameStateSchema.ts` | DONE |
| D3 | trainer-bonus→mods map ×2 (fighterState/simulateHelpers) | DEDUPE → `getTrainerMods` in `engine/trainers/trainers.ts`; simulateHelpers specialty mods layered on top | DONE |
| D4 | FIELD_TYPES re-list in crestGenerator | CORRECTED: tier tables are ordered design data (rollWeighted pick order is load-bearing) → `FieldType`/`ShieldShape`/`MetalColor`/`ChargeType` unions derived from canonical arrays in `crest.types.ts`; generator keeps ordered lists | DONE |
| D5 | `favoredName` verbatim ×2 (bout-viewer panels) | DEDUPE → `src/components/bout-viewer/favoredName.ts` | DONE |
| D6 | selectable-entity-row markup ×~5 | PARTIAL: `SelectableCard` (ui/) consolidates the identical Tooltip>button>Surface shell from RivalStableList/RivalWarriorList (selected-underline glow unified to superset); StableSelector/WarriorSelector/AssetRegistry/PlanStep rows are related-but-divergent markup — left as follow-up | DONE (2 of ~5 repointed) |
| D7 | glow tab-strip ×2 (WarriorDossierTabs/StableDetail) | DEDUPE → `IconTabStrip` (ui/), `-mt-4` via className param | DONE |
| D8 | FileReader→JSON scaffold ×2 (ImportExport/Mods) | DEDUPE → `src/utils/fileInput.ts` `readFileInput(e, onText, onError)`; caller-specific error strings preserved | DONE |
| D9 | tooltip-badge shell ×2 (LiabilityBadge/PotentialBadge) | DEDUPE → `src/components/ui/TooltipBadge.tsx` | DONE |
| D10 | expandable-bar a11y ×2 (MiniCombatLog/TacticalBar) | DEDUPE → `src/hooks/useToggleBarProps.ts` (role/tabIndex/aria/click/Enter-Space spread) | DONE |
| D11 | `isPlausibleGameState` field-check boilerplate | DEDUPE → table-driven spec (SCALAR/OBJECT/ARRAY field tables); 92L→75L, all 48 characterization tests pass | DONE |
| S1 | `emitWarriorBid` 6-strategy monolith | RESTRUCTURE → per-intent emitters in `boutBidding/generation.ts`; precedence + fall-through/terminal-no-bid semantics verified | DONE |
| H1 | `KNOWN_SRC_PAIRS` 111 dead entries + baseline 128 | pruned 154→32 live pairs, grouped by verdict category; baseline ratcheted 128→34; **new assertion: stale entries now fail loudly** | DONE (ebffc108) |
| H2 | mislabeled `describe('MEGAPLAN-V12')` in v11Dedup guard | corrected to `MEGAPLAN-V11` + header comment fixed | DONE (ebffc108) |
| E1 | `engine/impacts` fn-surface (14 dead exports) + knip residuals | **EXEMPT/KEEP** — per-field handler exports are consumed via the `*Handlers` maps (`impactSystem.ts`) AND imported directly by `src/test/engine/impacts/*.test.ts` (test-only reachable by design); orphan-scan flags named exports, not map membership. Dead-export count unchanged at 174/176 ceiling | DONE |

## Preservation register (deletions/merges — evidence ledger)

| Item | Disposition | Evidence | Commit |
| --- | --- | --- | --- |
| warriorFactory/recruitGenerator/SystemPass zero-state literals (~24L) | replaced by `newWarriorDefaults()` | v12Dedup D1 spec + warriorFactory.test.ts | this batch |
| gameStateSchema `pendingResolutionData` inline z.object (~9L) | replaced by `PendingResolutionDataSchema` import | v12Dedup D2 spec + schema suites | this batch |
| fighterState/simulateHelpers trainer-mods map (~8L ×2) | replaced by `getTrainerMods` | v12Dedup D3 spec + simulateHelpers.test.ts | this batch |
| crest.types hand-written unions (4 unions) | derived from `enumSources` arrays via `typeof X[number]` | v12Dedup D4 spec + enumSourcesSync.test.ts | this batch |
| favoredName ×2 (~5L each) | moved to `bout-viewer/favoredName.ts` | panel test suites + v12Dedup D5 | this batch |
| Rival*List card shells (~24L each) | `SelectableCard` primitive; stable-row underline gained subtle glow (unified superset) | RivalListShell tests + scoutingFocusVisible (file list updated to SelectableCard) | this batch |
| tab-strip markup ×2 (~20L each) | `IconTabStrip` primitive | StableDetail + WarriorDossier suites | this batch |
| FileReader scaffold ×2 (~19L each) | `readFileInput` helper; caller error strings kept | page flows unchanged | this batch |
| badge shells ×2 (~18L each) | `TooltipBadge` primitive | badge suites | this batch |
| expandable-bar a11y quartet ×2 | `useToggleBarProps` hook | TacticalBar.test.tsx (15) | this batch |
| plausibility 30× typeof checks | table-driven spec tables | plausibility.test.ts 48/48 | this batch |

## Bugs found (failing-evidence-first)

- `src/test/lib/AudioManager.test.ts` — "setMuted … not clobbered by loadMuteState" hung 120s after the in-tree (unrelated) audio-volume WIP switched init to `Promise.all([storeGet, storeGet])`: the mock captured only the last resolver. Mock updated to a resolver list; test renamed to `loadSettings`. **WIP-compat fix, not a V12 change.**
- `src/lib/AudioManager.ts` — one-line type fix on the same WIP (`parseVolume(raw: unknown)`; `storeGet` returns `unknown`). Unrelated feature kept unstaged.

## Phase 8 — final gate matrix

| Gate | Result |
| --- | --- |
| type-check | ✅ 0 errors |
| lint | ✅ 0 errors / 0 warnings |
| vitest (`bun run test`) | 8,994 pass / 2 skip — **3 fails, all unrelated WIP**: orphanScan ×2 (arena-audio files committed-but-unwired by in-flight `ArenaView`/`index.ts` edits) + AudioManager init-race test (fixed — WIP mock update) |
| `bun run test:bun` | 8,953 pass — same 2 orphan-guard fails (WIP) |
| `bun run test:slow` | ✅ 190/190 (incl. 104-week AI-liveness soak, parallel determinism 1-vs-4 shards, week/quarter/year determinism) |
| `bun run test:coverage` | ✅ thresholds met (84/74/78/85.5) — only the same 2 WIP-orphan test fails |
| Playwright e2e | DEFERRED — not in the routine gate set for local megaplan runs; changed surfaces are unit/contract-covered |
| build | ✅ |
| electron:compile | ✅ |
| narrative-validate | ✅ |
| `dupes` (jscpd) | ✅ 115 clones / 0.74% lines (was 0.75%) |
| dup-scan | 32 src↔src (baseline 43; ceiling now 34) — KNOWN_SRC_PAIRS = live set |
| orphan-scan | deadExports 174 (unchanged, ≤176 ceiling); unreachable 4 + testOnly 1 = **arena-audio WIP, not V12** |
| param-count | 0 violations (SelectableCard regrouped to 5 props) |
| function census | fns >80: 1 (`useScouting`, disproved); `emitWarriorBid` split verified |
| entries-in-loop | 5 known exemptions, unchanged |
| ui-audit / data-array-dup / find-dupes | clean (Phase 0; ui-audit unchanged by V12 — all new primitives reuse existing token classes) |
