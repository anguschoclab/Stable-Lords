# MEGAPLAN V12 FINDINGS — SRP/DRY Exhaustive Audit

**Scope:** whole-repo audit — `src/` (1,213 prod files / ~134k LOC; 892 test
files / ~135k LOC), `scripts/`, `e2e/`, `electron/` (12 non-src files), root
configs. Zero save-file / backward-compatibility constraints
(`SAVE_STATE_VERSION='3.0.0'`, gate rejects mismatched saves).

**Lens (per approved plan):** Single Responsibility Principle (responsibility
cohesion, not line count) + DRY (token clones, renamed-var clones, semantic
duplicates, intra-file boilerplate). Prior ledgers V5–V11 treated as claims
re-verified against live code.

**Verdict vocabulary:** `APPROVED` / `DISPROVED` / `CORRECTED` / `PARTIAL` /
`REJECTED` / `DEFERRED` / `EXEMPT`. Dispositions: `KEEP`, `RESTRUCTURE`,
`DEDUPE`, `WIRE`, `DELETE`, `DOCUMENT`.

**Restore point:** `pre-megaplan-v12` at `0146a8a1`.

---

## 0. Baseline gate matrix (regenerated at `0146a8a1`, all reports fresh)

| Gate | Result | Notes |
| --- | --- | --- |
| `type-check` (tsr generate + tsc --build) | ✅ green | 0 errors |
| `lint` (eslint .) | ✅ green | 0 errors / 0 warnings |
| `test` (vitest default) | ⚠️ green modulo known flake | 806/807 files; 3 fails all in `retrieveHotStatePlausibility.test.ts` — **worker-pool flake, passes isolated** (re-verified this session; same verdict as V11 ledger) |
| `build` (vite) | ✅ green | PWA precache 185 entries |
| `electron:compile` | ✅ green | 24.14 KB bundle |
| `narrative-validate` | ✅ green | |
| `bun run dupes` (jscpd) | report-only | 115 clones / 0.75% dup lines |
| `dead-code` (knip, regenerated) | report-only | **193 unused exports / 68 unused types / 4 dup exports / 0 unresolved** (79 files; +1 type vs V11 close — drift, not regression) |
| `dup-scan` (exact, regenerated) | 213 clusters | **43 src↔src** / 129 test↔test / 41 mixed |
| `dup-scan --ident` | 20,657 raw | dominated by homogeneous data corpora shape-collisions (`commonCorpus` vs every name file); requires data-exclusion + min-block filtering — used as triage input only |
| `orphan-scan` (regenerated) | ✅ within ceilings | unreachableFromProd: 2 (ambient `.d.ts`, allowlisted); testOnly: 0; unlinkedPages: 0; nav-hidden routes: 7 (all allowlisted); **deadExports src-scoped: 174 / ceiling 176** |
| `param-count` | ✅ 0 violations | |
| `function-length` | ✅ budgets held | fns >80: **2**; >120: 0; files >800: 3 (all exempt data/generated) |
| `entries-in-loop` | 5 sites | all 5 registered `KNOWN_EXCEPTIONS` (self-pruning) |
| `test-audit-scan` | residuals | 38 import-set clusters, 4 local-factory files, 2 dead patterns, 0 missing DOM pragmas |
| `ui-audit-scan` | ✅ 0 hits | all five classes clean |
| `data-array-dup-scan` | ✅ clean | |
| `find-dupes` (name pools) | ✅ clean | all six pools 0 dupes |
| `test:slow`, `test:bun`, `test:coverage`, `e2e` | deferred | Phase 8 final battery |

### 0a. Guard-ledger accuracy finding (meta)

`duplication.guard.test.ts` `KNOWN_SRC_PAIRS` holds **154 entries; only 43 are
live** — **111 entries are dead** (deduped or drifted pairs never pruned, contra
the guard's own contract: "remove a pair … as its cluster is deduped").
`SRC_TO_SRC_BASELINE = 128` is loose vs measured 43. Zero *novel* live pairs —
the no-new-dup invariant held. **Disposition: prune dead entries + tighten
ceiling in Phase 7 (ledger hygiene, no behavior change).**

---

## A. src↔src duplicate clusters — all 43 verdicted

### A1. APPROVED — real duplication, DEDUPE

| # | Cluster | Evidence | Disposition |
| --- | --- | --- | --- |
| D1 | `warriorFactory.ts:63-71` ↔ `recruitGenerator.ts:201-210` ↔ `SystemPass.ts:214-222` (+ ~6 test sites) | "Fresh warrior zero-state" literal verbatim ×3 prod: `fame:0, popularity:0, titles:[], injuries:[], flair:[], career:{0,0,0}, champion:false, status:'Active'` | **DEDUPE** → shared `newWarriorDefaults()`/spread-object in `engine/factories/` or warrior domain; repoint all 3 prod sites; test sites repoint where trivially equivalent |
| D2 | `fightSchemas.ts:260-268` ↔ `gameStateSchema.ts:72-80` | `pendingResolutionData` z.object defined **twice identically** | **DEDUPE** → `PendingResolutionDataSchema` in `fightSchemas.ts` (canonical fight domain), imported by `gameStateSchema.ts` |
| D3 | `fighterState.ts:36-44` ↔ `simulateHelpers.ts:38-46` | `attMod/parMod/defMod/iniMod/decMod/endMod/healMod` trainer-bonus mapping **verbatim** (`floor(Def*0.6/0.4)`, `floor(Mind*0.6/0.4)`, `End*2`) | **DEDUPE** → shared `trainerBonusToMods(bonus)` (pure mapping, no RNG — safe) |
| D4 | `crestGenerator.ts:100-124` ↔ `enumSources.ts:146-161` | `fieldTypesByTier` re-lists the canonical `FIELD_TYPES` literals instead of deriving/subsetting them | **DEDUPE** → derive tier lists from `FIELD_TYPES`; add subset-guard test |
| D5 | `FightAnalysisPanel.tsx:14-18` ↔ `FightForecastPanel.tsx:11-15` | `favoredName()` helper **verbatim duplicated** | **DEDUPE** → shared module (e.g. `components/bout-viewer/favoredName.ts`) |
| D6 | `RivalStableList.tsx:111-122` ↔ `RivalWarriorList.tsx:39-50`; same shape in `StableSelector.tsx:105-120` ↔ `WarriorSelector.tsx:107-122`; partial in `AssetRegistry.tsx` ↔ `WarriorSelector.tsx` | "Selectable entity row" markup — `w-full text-left … focus-visible:ring-2 ring-inset` + selected/disabled/hover border classes + `Surface` wrap — repeated ~5× | **DEDUPE** → `SelectableRow`/`SelectableCard` primitive (`components/ui/` or scouting-local); parameterize selected/disabled/accent |
| D7 | `WarriorDossierTabs.tsx:30-43` ↔ `StableDetail.tsx:42-55` | Glow tab-strip markup verbatim (icon+label+active underline `shadow-[0_0_10px…]`) | **DEDUPE** → `IconTabStrip` primitive |
| D8 | `ImportExport.tsx:45-52` ↔ `Mods.tsx:33-40` | FileReader→JSON-parse input scaffold verbatim (`e.target.value=''`, `reader.onload`, `typeof content!=='string'` throw) | **DEDUPE** → `readJsonFileInput(e, onText)` helper (`lib/importExport.ts` or `utils/`) |
| D9 | `LiabilityBadge.tsx:23-43` ↔ `PotentialBadge.tsx:28-42` | Tooltip-badge shell verbatim (Tooltip>Trigger>div[cn badge classes]>spans) | **DEDUPE** → `TooltipBadge` primitive (stable-local or `components/ui/`) |
| D10 | `MiniCombatLog.tsx:108-122` ↔ `TacticalBar.tsx:34-48` | Expandable-bar header a11y boilerplate (role/tabIndex/aria-expanded/aria-label + Enter/Space `onKeyDown` toggle) | **DEDUPE** → `useToggleBarKeydown` hook or `ExpandableBarHeader` component |
| D11 | `stateInvariants.ts:381` + `plausibility.ts:13-92` (intra-file) | `isPlausibleGameState` = 30× repeated `typeof v.X !== 'T' return false` boilerplate | **DEDUPE** → table-driven field-spec loop; identical semantics, ~80L→~35L |

### A2. DISPROVED — hook-mirror / pattern structure (no action)

All verified as destructuring lists mirroring hook return objects or the
deliberate page↔hook split — not copy-pasted logic:

`StartGame↔useStartGame` (23L) · `groupBookmarks↔useBookmarkGroups` (18L) ·
`StableComparison↔useScoutingStableComparison` (17L) · `useAdminTools↔index`
(15L) · `RankingsBar↔useControlCenter` (15L) · `useWarriorBuilderState↔index`
(14L) · `Trainers↔useTrainers` (14L) · `ArenaDetail↔useArenaDetail` (13L) ·
`WarriorDetail↔useWarriorDetail` (12L) · `useHallOfFame↔index` (11L) ·
`Scouting↔useScouting` + `ScoutIntelTab↔useScouting` (10+9L) ·
`TournamentSchedule↔useTournamentSchedule` (9L) · `PlanBuilder↔usePlanOrchestration`
(8L) · `RosterWarriorRow↔useActiveRoster` (10L) · `Orphanage↔useFtueFlow`.

### A3. EXEMPT — intentional architecture

- `alert-dialog↔sheet` — Radix/shadcn generated boilerplate.
- `electronArchive↔opfsArchive/service` + `opfsArchive/service↔nodeArchiveService`
  — parallel storage impls, deliberate.
- `hitExecution index↔killWindow`, `offenseDefense index↔prepare`, `prepare↔types`,
  `simulationLoop index↔types` — V11 Phase-4 shard-boundary import preambles,
  registered knowingly.
- `weapons.ts↔weapons/items.ts` — thin barrel (25 lines) + canonical data file.
- `LeftNav↔MobileNav` — shared import preamble only; both consume
  `navigationShared`/`navigationHubs` already.
- `crestGenerator↔schemaEnums` — enum-literal adjacency (folds into D4 fix).
- `BriefingTab↔GazetteTab` (8L) — `ScrollArea` tail + `LinkifiedText` idiom;
  not an extractable unit.
- `ArenaSettings↔FighterConfigCard` — 8-line import/style-token overlap.
- `schemas↔enumSources`, `schemaEnums↔enumSources` — canonical-source mirrors
  by design (enumSources IS the canonical list consumed by schemas).

---

## B. SRP audit (responsibility cohesion — beyond line count)

### B1. APPROVED — RESTRUCTURE

| # | Target | Evidence | Disposition |
| --- | --- | --- | --- |
| S1 | `emitWarriorBid` — `boutBidding/generation.ts:197-279` (83L) | One function = **6 intent strategies** (VENDETTA, CROWN_CAMPAIGN, challenged-response, RECOVERY, EXPANSION, default) + modifier computation | **RESTRUCTURE** → per-intent emitter fns dispatched from a slim orchestrator (same `boutBidding/` dir) |
| S2 | `isPlausibleGameState` — `plausibility.ts:13-92` (80L) | Cohesive predicate but mechanically repetitive (30 field checks × 5 type classes) | **DEDUPE** via table-driven spec (=D11) — SRP satisfied by data-driven structure |

### B2. DISPROVED / KEEP — reviewed, cohesive

- `useScouting` (83L) — hook facade; `purchaseScoutReport` already extracted;
  remaining bulk = memo composition + return surface. Interface breadth ≠
  multi-job. **DISPROVED.**
- `applyLifecycleTransitions` (80L) — 3-state title-dormancy machine; the
  switch IS the responsibility. Borderline; **KEEP** (optional per-status
  extraction noted, not required).
- `isPlausibleGameState` — see S2 (acted via D11).
- `narrateEvents/handlers.ts` (541L) — per-event-type narrator dispatch
  registry; bulk is the point (V11 `classTraits` precedent). **EXEMPT.**
- `arenaFit.ts` (466L) — cohesive arena-fit scoring; internal sections
  (style sets / scoring / selection). **PARTIAL** — style-classification sets
  may move to constants, low priority.
- `stateInvariants.ts` (434L) — diagnostic harness surface, cohesive.
- `crest.types.ts` (425L), `game.ts` types (394L), schema files — type/data
  modules. **EXEMPT.**

### B3. Layer-contamination sweep — clean

- `engine/` → `@/state`, `@/components`, `@/hooks` imports: **zero hits**.
- `components/`/`pages/` → storage internals: only `AdminTools` TelemetryPanel
  + adminActions read `opfsArchiver` — legitimate dev-tools surface. **EXEMPT.**
- State slices (`rosterSlice/`, `worldSlice/` directories): already
  domain-decomposed; seams verified held.
- `src/utils/` (14 files) + `src/lib/` (10 files): all single-purpose named
  modules; `lib/utils.ts` = `cn`+`hexToRgba` only. **No grab-bags found.**
- `pages/X.tsx` + `pages/X/` coexistence (WarriorDetail, Trainers,
  AdminTools…): established shell+`hooks/`+`sections/` pattern — verified
  consumed, not drift. **DISPROVED** (plan-draft correction integrated).

### B4. Function-census band note

285 functions in the 60–120 LOC band; only 2 exceed 80 (`useScouting`,
`emitWarriorBid`). The 60–80 band is dense (~30 fns at 77–80). Budget posture:
`FN_LINE_CEILING=120` with a "2 fns >80" ratchet — Phase 7 tightens the >80
count to the post-S1 value (1) and optionally lowers the ceiling.

---

## C. Test-side duplication (129 test↔test + 41 mixed clusters)

| Cluster | Lines | Verdict |
| --- | --- | --- |
| `_fixtures/weather.ts` ↔ `enumSourcesSync.test.ts` ↔ `enumSources.ts` | 42/18 | enum-iteration mirrors of the canonical source — structural, not copy-paste. **DISPROVED.** |
| `killDeathDivergence.slow` ↔ `simulation.slow` | 33 | shared soak-scaffold shape; consolidating two *guardrail* harnesses risks coupling independent regression nets. **DEFERRED** — revisit only if a shared harness builder emerges. |
| `schemaCharacterization` ↔ `enumSources` | 24 | characterization mirror. **DISPROVED.** |
| `gameStateFactory` ↔ ~4 test files | 15–21 | tests mirroring the factory literal — intentional characterization. **DISPROVED.** |
| `economy.test` ↔ `economyScaling.test` | 14 | assertion-shape similarity. **DEFERRED.** |
| `lastWeekBoutDisplay` internal 55L | 55 | intra-file clone — inspect in Phase 5; likely table-driven-able. **APPROVED-low.** |
| Tail (~90 small clusters) | ≤12 | assertion-shape similarity. **DEFERRED** per plan. |

Test fixture infra (`src/test/_fixtures/`, 21 builders) exists and is the
canonical home if consolidation is warranted — no parallel fixture home.

---

## D. Dead-export surface (regenerated knip + orphan-scan)

| Concentration | Count | Verdict |
| --- | --- | --- |
| `components/ui/*` | 23 | Radix/shadcn barrel surface — vendored-component exports. **EXEMPT** (per-file verify in Phase 5). |
| `engine/impacts/*` | 14 | handler-map under-fns (V11 noted: consumers use maps only). **APPROVED** — unexport the fn-level surface, keep maps. |
| `engine/core`, `engine/warrior` | 9+9 | audit per-symbol in Phase 5 (delete vs document). |
| `schemas` | 8 | post-liberation residue; verify each. |
| Tail | ~111 across dirs | per-symbol disposition; dead-export ceiling 176→tighten to post-pass count. |
| knip 193 exports / 68 types / 4 dup | — | per-symbol audit; `effectHash`-style semantic check on registries. |

---

## E. Hygiene register

- `entries-in-loop` ×5 — all `KNOWN_EXCEPTIONS` (per-iteration data, verified).
- Mislabeled `describe('MEGAPLAN-V12')` nested inside `v11Dedup.guard.test.ts`
  — **fix** (Phase 6).
- `v11*.guard.test.ts` files remain live guards (they assert landed structure)
  — keep; V12 guards added alongside.
- Stale `scripts/out/*` artifacts — all regenerated at Phase 0 (knip report was
  3× stale vs ledger truth).

## F. Semantic dedup (beyond tokens)

- `effectHash` canonical-hash precedent (V10) covers trait defs. Extension
  targets: style passives, arena events, skill-effect tables — Phase 1 output:
  **no new same-effect-different-name pairs detected** in spot-checks; formal
  pass folded into Phase 5 audit of `engine/impacts` + trait registries.

---

## Disposition summary

| Bucket | Items | Action |
| --- | --- | --- |
| DEDUPE prod clusters | D1–D11 (11 items) | Phases 2(test)→4 |
| RESTRUCTURE | S1 (`emitWarriorBid`) | Phases 2→3 |
| DISPROVED clusters | ~22 | no action (documented) |
| EXEMPT clusters | ~10 | no action (documented) |
| Test-side | 1 APPROVED-low + rest DEFERRED/DISPROVED | Phase 5 |
| Dead-export surface | ~174 src-scoped | Phase 5 per-symbol |
| Hygiene | describe fix, KNOWN_SRC_PAIRS prune, baseline tighten | Phases 6–7 |
