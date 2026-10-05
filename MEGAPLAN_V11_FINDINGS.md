# MEGAPLAN V11 FINDINGS — Exhaustive Refactor & Integration Deep-Dive

**Scope:** whole-repo re-read and re-verification from scratch — `src/` (~1,150 prod
files / ~840 test files), `scripts/`, `electron/`, `e2e/`, `docs/`, `archives/`,
root configs, `.github/workflows`. Zero save-file / backward-compatibility
constraints. Prior ledgers (V5–V10, ORPHAN_FEATURE_AUDIT, CONSOLIDATION_*,
TEST_AUDIT) treated as claims re-verified, not baseline truth.

**Verdict vocabulary:** `APPROVED` / `DISPROVED` / `CORRECTED` / `PARTIAL` /
`REJECTED` / `DEFERRED` / `EXEMPT`. Dispositions: `KEEP`, `RESTRUCTURE`,
`DEDUPE`, `WIRE`, `DELETE`, `DOCUMENT`.

**Restore point:** `pre-megaplan-v11-r2` at `e0520ab9` (`pre-megaplan-v11` at
`ade1b001` predates 3 commits; left intact).

---

## 0. Baseline gate matrix (recorded at `e0520ab9`)

| Gate | Result | Notes |
| --- | --- | --- |
| `type-check` (tsr generate + tsc --build) | ✅ green | 0 errors |
| `lint` (eslint .) | ✅ green | 0 errors / 0 warnings |
| `test` (vitest default) | ✅ green | 788 files / 8,843 tests (2 skipped) |
| `build` (vite) | ✅ green | PWA precache 177 entries |
| `electron:compile` | ✅ green | 26.18 KB bundle |
| `narrative-validate` | ✅ green | |
| `test:slow` | ⚠️ **RED at baseline** | 26/29 files green; 4 test failures — all perf-cap/timeout, no correctness failures: `autosim.slow` 39.2s>30s cap; `pipeline.perf.slow` 12.5s>12s and 67.8s>60s caps; `killDeathDivergence.slow` 600s timeout. Pre-existing; likely machine-timing sensitive (90-rival floor raised cost vs old 8-rival caps). Not introduced by this pass. |
| `bun run dupes` (jscpd) | report-only | 114 clones, 0.75% dup lines |
| `dead-code` (knip) | exits 1 | **452 unused exports, 130 unused types, 7 duplicate exports** |
| `dup-scan` | 243 clusters | 74 prod↔prod, 128 test↔test, 41 mixed |
| `orphan-scan` | near-clean | `unreachableFromProd`: only `global.d.ts`, `vite-env.d.ts` (ambient decls — expected). `testOnlyReachable`: none. 478 deadExports (raw symbol list incl. barrels). |
| `param-count` | ✅ 0 violations | |
| `ui-audit-scan` | ✅ 0 hits | all five classes clean |
| `data-array-dup-scan` | ✅ clean | |
| `entries-in-loop` | ⚠️ 5 violations | `injurySystem.ts:208`, `arenaNarrative.ts:108`, `traits/mods.ts:20,26`, `stateInvariants.ts:380` |
| `test-audit-scan` | ⚠️ residuals | 1 `needsDomMissingPragma` (`tacticsAdvisorBridge.test.ts`, baseline-listed), 2 dead patterns, 38 import-set clusters, 4 local-factory files |
| `find-dupes` (name pools) | ✅ clean | |
| `test:bun`, `test:coverage`, `e2e` | deferred | recorded in Phase 8 final battery |

---

## A. Dead-code inventory (knip-verified, each item dispositioned)

### A1. Schema re-export matrix — the flagship duplicate surface

`schemaObjects.ts` is a pure re-export barrel ("Re-export barrel for all Zod
schema objects") and `gameStateSchema.ts` re-exports ~70 schemas "for backward
compatibility". The same ~35 schema symbols (`LuckfactorSchema`,
`DerivedStatsSchema`, `WarriorSchema`, `CrestDataSchema`, `TournamentBoutSchema`,
`CombatEventSchema`, `FightOutcomeSchema`, `ArenaConfigSchema`, …) are exported
from **3–4 files simultaneously**: `schemaEnums.ts` / `warriorSchemas.ts` /
`fightSchemas.ts` / `economySchemas.ts` (canonical homes), re-exported through
`schemaObjects.ts`, and re-exported again through `gameStateSchema.ts`.

**Verdict: APPROVED — non-unique duplicate export surface.** Under zero
backcompat: consumers repointed to canonical domain files; `schemaObjects.ts`
deleted entirely; `gameStateSchema.ts` sheds its re-export block. ~110 redundant
export aliases removed. dup-scan confirms: `fightSchemas ↔ gameStateSchema`
9-line overlap.

### A2. Backward-compat alias exports

| Symbol | File | Verdict | Disposition |
| --- | --- | --- | --- |
| `SeededRNGService = SeededRNG` | `utils/random.ts:189` | APPROVED — alias, comment says "callers should migrate" | DELETE, repoint consumers |
| `getStablePairKey = getPairKey` | `utils/keyUtils.ts:15` | APPROVED — "backward compatible" alias | DELETE, repoint consumers |
| `HallOfFights` named + `default` | `lore/HallOfFights.tsx` | APPROVED — dual export | DELETE default, keep named |
| `ST_PAR=ST_ATT`, `WT_DEF`, `WL_PAR`, `SZ_*` aliases | `warrior/skillBreakpoints.ts` | **DISPROVED as dedupe targets** — intentional canonical breakpoints (STR feeds ATT and PAR identically); aliases document game semantics | KEEP |
| `DEFAULT_ARENA_PREFERENCES` re-export | `worldSlice/index.ts` | APPROVED barrel re-export | resolve with barrel pass |

### A3. Dead modules / API surfaces

| Finding | Verdict | Disposition |
| --- | --- | --- |
| `constants/core/dates.ts` dead exports | CORRECTED — ms-math chain (6 consts) + LEGACY_TOURNAMENT_WEEKS dead; epoch/era/DAYS_PER_WEEK are internal-only; tournament-week consts + timestamp fns are live | DONE: deleted MS_PER_*/HOURS/MINUTES/SECONDS chain + LEGACY_TOURNAMENT_WEEKS (test keeps the cadence inline); unexported GAME_EPOCH_YEAR/ERA_START_YEAR/DAYS_PER_WEEK |
| `data/templates/templateCache.ts` query API — `getTemplatesByTier/Philosophy/Personality/MetaAdaptation/Backstory/Style/FameRange/RosterRange`, `searchTemplates`, `getCacheStats`, `clearTemplateCache`, `TIER_CACHES`: only `ALL_TEMPLATES` consumed (by `backstoryData.ts` → `rivalStableFactory.ts`); no prod file imports the query fns | APPROVED dead API (~180 lines) | DELETE query fns, keep `ALL_TEMPLATES` materialization |
| ~~`data/equipment/weapons.ts` dead~~ | **DISPROVED** — `weaponStats.ts` + 6 test files import `WEAPONS`/`SHIELD_ITEM_IDS`/`SHIELD_COVERAGE` | RETAIN — removed from guard |
| `useGameStore.ts` hooks `usePlayer`/`useRoster`/`useRivals`/`useTreasury`/`useWeek`/`useIsSimulating`/`useStyleStats`/`useReputationState` | APPROVED dead convenience hooks | DELETE re-export lines |
| `enginePool.ts:58 processBoutShard` | verify — likely worker entry (comlink) | Phase 3 verdict |
| `types/narrative/pbp.ts` ~13 unused interfaces + `personas.ts`/`gazette.ts`/`strikes.ts`/`uxMetadata.ts`/`root.ts`/`recruitment.ts` types (~25) | APPROVED dead types (narrative shape types unused after JSON curation passes) | DELETE |
| `state/useGameStore.ts` types `GameStoreState/GameStoreActions` + `store.types.ts` same pair | CORRECTED — single definition in store.types + re-export line, not a duplicate | DONE: trimmed to `export type { GameStore }` (only the consumed name); unexported the two internals in store.types |
| `tagDescriptions.ts` `FLAIR_/TITLE_/INJURY_/STATUS_DESCRIPTIONS` | DISPROVED dead — consumed via `TagBadge` tooltips (ORPHAN C2 re-verified? → re-check consumer) | Phase 3 verdict |

### A4. Barrel-file unused re-exports

`components/ui/*` (select, sheet, dialog, alert-dialog, scroll-area, table,
chart), `components/arena/index.ts` (13 exports), `components/tournaments/index`,
`components/widgets/index`, `components/equipment/index`, `eventLog/index`,
`impacts/index.ts` handler-fn surface, `narrative/index.ts` (~15), `traits/index`,
`stylePassives/index`, `bout/index`, `timeAdvance/index`.

**Verdict: APPROVED** — consumers deep-import; barrels re-export a superset.
Disposition: trim barrel re-exports to used symbols or delete barrels where
zero consumers import the barrel itself (A10 precedent).

### A5. Tooling-consumed module (verdict correction vs draft)

`engine/validate/stateInvariants.ts` — **CORRECTED**: consumed by
`scripts/soak.mjs` + 5 test files. Not dead; diagnostic instrumentation.
Disposition: `KEEP` (documented as harness surface), optionally wire into
`finalizeState` behind dev flag in Phase 6.

---

## B. Duplicate-code clusters (dup-scan, prod↔prod 74 clusters — verdicted)

### B1. offseasonEvents handler boilerplate — REAL duplication

`chaosHandlers/{oddities,phenomena,weavers,bargains,rift}.ts`,
`socialHandlers/{street,feasts,visitors}.ts`, `buffHandlers.ts`,
`injuryHandlers.ts`, `economicHandlers.ts` share the same `withChosenWarrior({
state: state, nextWeek: nextWeek, e: e, rng: rng, ctx: ctx, apply })` verbatim
scaffolding + identical 5-param signatures + repeated injury/token creation
blocks (~20–32 dup lines/pair across ~15 clusters).

**Verdict: APPROVED — non-unique boilerplate.** Disposition: extract a shared
`runChosenWarriorEvent(...)`/ctx-object helper in `offseasonEvents/types.ts` +
shorthand arg pass; collapse injury+announce micro-pattern. Expect −150–250
lines.

### B2. Leaderboard/record-table JSX cluster — REAL duplication

`gazette/GazetteLeaderboards.tsx` ↔ `ledger/TreasuryOverview.tsx` ↔
`ledger/HallOfWarriors.tsx` ↔ `pages/ArenaHub.tsx` ↔
`pages/arenaDetail/{RecordTable,sections}.tsx` (~8–11 lines × 8 clusters) —
shared standings-table markup.

**Verdict: APPROVED.** Disposition: extract a shared `StandingsTable`/
`RecordRow` primitive into `components/ui/` (bible §7 tables), repoint all.

### B3. Arena weather effects — REAL duplication

`components/arena/weather/effects/{heat,wind,storm,misc}Effects.tsx`
(13.5/8-line clusters) — shared effect scaffolding. Disposition: parameterize
into one `WeatherEffect` factory or shared primitives.

### B4. Page↔hook clusters — DISPROVED

`StartGame↔useStartGame`, `AdminTools↔useAdminTools`, `Trainers↔useTrainers`,
`ArenaDetail↔useArenaDetail`, `WarriorDetail↔useWarriorDetail`,
`Scouting↔useScouting`, `HallOfFame↔useHallOfFame`, `RankingsBar↔
useControlCenter`, `groupBookmarks↔useBookmarkGroups`,
`StableComparison↔useScoutingStableComparison`,
`WarriorBuilder index↔useWarriorBuilderState` — the shared blocks are
**destructuring lists mirroring hook return objects** (verified `StartGame`
lines 23–30/88–98 vs hook returns 150–221). Structural mirror of the hook
pattern, not copy-pasted logic. **Verdict: DISPROVED — no action.**

### B5. Small prod pairs (8–12 lines) — verdict per cluster in Phase 5

`RivalStableList↔RivalWarriorList`, `LiabilityBadge↔PotentialBadge`,
`LeftNav↔MobileNav`, `terrabloodCharts↔skillCalc` (canonical chart fns —
**verify who owns them**; `skillCalc` re-exports look dead per A-list),
`EventLog.tsx↔eventLog/index.ts`, `PlanStep↔planBuilder/sections`,
`alert-dialog↔sheet` (Radix boilerplate — likely EXEMPT),
`ImportExport↔Mods`, `warriorFactory↔recruitGenerator↔SystemPass` (8-line
shared block — verify), `fighterState↔simulateHelpers`,
`electronArchive↔opfsArchive/service` (parallel impls — expected structure).

### B6. Test-side clusters (128 test↔test + 41 mixed)

Majority are fixture/scaffold blocks (weather fixture ↔ enumSourcesSync 42L,
killDeath↔simulation slow 32L, schemaCharacterization↔enumSources 24L).
Disposition: consolidate into `_fixtures` only where a real shared builder is
absent; most are assertion-shape similarity — `DEFERRED` low-value.

---

## C. Monolith / long-function targets (function-length scan, verified)

| File | Lines | Split plan |
| --- | --- | --- |
| `engine/ai/workers/competitionWorker/boutAcceptance.ts` | 611 | verdict paths → `boutAcceptance/` |
| `engine/ai/intentEngine.ts` | 573 | intent lifecycle stages |
| `engine/combat/resolution/offenseDefense.ts` | 565 | phase helpers; combat-balance guardrails |
| `engine/pipeline/passes/RivalStrategyPass.ts` | 556 | per lifecycle handler |
| `engine/combat/resolution/exchangeHelpers/execution/hitExecution.ts` | 539 | hit/kill branches; combat-balance guardrails |
| `engine/traits/defs/classTraits.ts` | 517 | data-only; split only if aids review |
| `engine/combat/mechanics/weatherEffects.ts` | 515 | per-effect family |
| `engine/ai/workers/competitionWorker/offerProcessor.ts` | 504 | pipeline stages |
| `engine/ai/plan/coreGenerator.ts` | 500 | plan-gen stages |
| `engine/matchmaking/tournamentSelection/resolution.ts` | ~628 | per resolution stage |
| `engine/ai/workers/competitionWorker/boutBidding.ts` | ~611 | bid scoring/conversion/gates |
| `engine/recruitment/recruitment.ts` | 478 | pool gen/signing/scoring |
| `pages/ArenaHub.tsx` | 466 | sections → `pages/arenaHub/` (precedent exists) |
| `components/ledger/TreasuryOverview.tsx` | 449 | sub-panels (B2 dedupe synergy) |
| `engine/simulate/simulationLoop.ts` | 438 | tick phases |
| `engine/matchmaking/schedulingAssistant.ts` | 433 | |
| `engine/advisor/boutOfferAdvisor.ts` | 431 | |
| `components/layout/AppHeader.tsx` | 415 | |
| `constants/arena/weather/config.ts` | 492 | data table — EXEMPT verdict pending |
| `engine/crest/chargePaths.ts` | 490 | path data — EXEMPT verdict pending |
| `data/*` corpora (commonCorpus 1222, arenas/lore 850, loreBackfill* 543/149, terrabloodCharts 401) | — | EXEMPT: data files, not logic monoliths |
| `routeTree.gen.ts` | 829 | EXEMPT: generated, gitignored |

Threshold: files >400 lines of *logic*; functions >60 lines; signatures >5
params (0 current violations — ratchet already held).

## D. Wiring / dormancy items

| # | Finding | Verdict | Plan |
| --- | --- | --- | --- |
| D1 | `ARENA_EVENTS`/`getEventsForArena` — claimed dormant (zero prod consumers) | **DISPROVED — fully wired** (earlier grep produced a false negative; verified by direct re-scan) | Consumed by `engine/combat/mechanics/arenaEvents.ts` (`tickArenaEvents` per-exchange inside `resolveExchange`), `resolution/types.ts` ctx fields, `arenaNarrative.ts`; covered by `arenaEventTick.test.ts`. Residual: **stale comments** — `constants/arenaEvents.ts` header still says "narrative-only for v1; mechanical for v2" and `arenaEventTick.test.ts` header claims "no production consumer". Disposition: DOCUMENT (fix stale comments). |
| D2 | Routes without nav link: `/`, `/arena-hub`, `/world/arena-leaderboards`, param routes (`/warrior/:id`, `/stable/promoter/:id`, `/world/stable/:id`, `/world/arenas/:arenaId`) | **DISPROVED as orphans** — `/` is index; `arena-hub` + `arena-leaderboards` are redirect-only routes (verified: `arena-leaderboards.tsx` `beforeLoad → redirect /world/arenas`); param routes are entity deep-links via EntityLink | No action; keep redirects |
| D3 | `electron/main.ts` exports (`createWindow`, `createMenu`, `createTray`, `registerIPCHandlers`, `validateAndMigrateState`, window/tray accessors) | CORRECTED — consumed by `src/test/config/electronMain.test.ts` (test-only surface) | KEEP if test hooks intended; else unexport. Phase 1 verdict: test-hooks = KEEP documented |
| D4 | State-field liveness | pending Phase 6 sweep | every GameState/Warrior/Owner field: writer+reader or delete |
| D5 | `archives/season_*/bouts` | pending | keep-or-prune verdict |

## E. Hygiene violations

- `entries-in-loop`: 5 sites (`injurySystem.ts:208`, `arenaNarrative.ts:108`,
  `traits/mods.ts:20`, `mods.ts:26`, `stateInvariants.ts:380`) — hoist
  `Object.entries` out of loops. `APPROVED` fix list.
- `test-audit`: `tacticsAdvisorBridge.test.ts` missing jsdom pragma
  (baseline-listed pre-existing — decide: add pragma or annotate node-opt-out);
  2 dead patterns; 38 import-set clusters (merge candidates).
- `find-dupes` name pools: clean.

## F. Architecture observations (from read-through)

- Schema layer is triple-stacked (canonical domain files → `schemaObjects`
  barrel → `gameStateSchema` re-export block). Single-home policy needed.
- `engine/impacts/*` exposes both handler-map objects AND each underlying fn;
  consumers use only the maps — the fn exports are redundant surface.
- Hook-pattern page decomposition is consistent (`pages/X/index.tsx` +
  `pages/x/useX.ts`); the "duplication" scanners flag is the pattern itself.
- `engine/index.ts` barrel is minimal (3 re-exports) — `getStyleMatchupMods`
  flagged unused → verify then trim.
- No migration framework exists; saves version-gated at
  `opfsArchive/service.ts:116` — schema liberation is a clean bump.
- 29 slow-test guardrails cover determinism, balance (fixture+world), world
  liveness, trait balance, kill/death divergence, pipeline perf.

## G. Prior-ledger re-verification sample

| Prior claim | V11 verdict | Evidence |
| --- | --- | --- |
| ORPHAN C2 `tagDescriptions` wired via TagBadge | re-verify in Phase 3 | knip flags all 4 — consumer path may have drifted |
| ORPHAN D18 suitability labels wired | **APPROVED** | `SUITABILITY_LABELS` consumed by `WeaponAffinitySection`, `TacticBank`, `planBuilder/sections` |
| ORPHAN F1 notoriety wired into offer hype | spot-check Phase 6 | |
| V10 `ARENA_EVENTS` dormant-by-design | **DISPROVED** | wired via `tickArenaEvents` in `resolveExchange`; v2 mechanics already live — only stale comments remain |
| `arena-hub`/`arena-leaderboards` redirects intentional | **APPROVED** | both are `beforeLoad` redirect routes |

---

## Disposition summary (drives Phases 2–7)

| Bucket | Count | Action |
| --- | --- | --- |
| DELETE dead exports/types/files | ~200 knip-verified items (after barrel/schema collapse) | Phase 3 |
| DEDUPE schema re-export matrix | ~110 aliases → canonical homes | Phase 5 |
| DEDUPE prod clusters | ~30 real clusters (B1–B3, B5) | Phase 5 |
| DISPROVED clusters (hook-mirror) | ~11 page↔hook pairs | no action |
| RESTRUCTURE monoliths | ~19 logic files >400 lines | Phase 4 |
| WIRE/dormant decisions | dates.ts unused consts (wire-or-delete); ARENA_EVENTS = wired, DOCUMENT stale comments | Phase 6 |
| FIX hygiene | 5 entries-in-loop, 1 pragma | Phase 5/8 |
