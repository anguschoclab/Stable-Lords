<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V18 FINDINGS — Seeded Audit Baseline (validated 2026-10-21)

Companion to `MEGAPLAN_V18_PLAN.md`. Every number below was re-measured
against the live codebase on 2026-10-21; Phase 1 refreshes and extends
these tables.

## §0 Baseline metrics

| Metric | Value (2026-10-21) | Source |
| ------ | ------------------ | ------ |
| Source files / LOC | 1,243 files / 140,340 loc | `function-length.mjs` |
| Test files / LOC | 954 files / 146,704 loc | `function-length.mjs` |
| Functions >80 lines | **19** (0 >120, 0 >200) | `function-length.mjs` |
| Functions 60–80 lines | **293** | `function-length.mjs` |
| Files >800 lines | 2 (`commonCorpus.ts` 1,223; `arenas/lore.ts` 1,051 — both data) | `function-length.mjs` |
| dup-scan exact w8 | src↔src **27** · test↔test **150** · mixed **27** | `collectDuplicates()` |
| dup-scan exact w12 | src↔src **7** · test↔test **18** · mixed **4** | `collectDuplicates({window:12})` |
| dup-scan ident w20 | src↔src **181** · test↔test **50** · mixed **139** | `collectDuplicates({ident:true,window:20})` |
| dup-scan ident w16 | src↔src **484** · test↔test **125** · mixed **286** | `collectDuplicates({ident:true,window:16})` |
| dup-scan ident w8 | 13,926 src↔src — import-preamble noise, **unusable raw** | validation scan |
| Dupe ledger | `EXEMPT_PAIRS` 27 · `DEBT_PAIRS` **0** · baseline 27 | `duplication.guard.test.ts` |
| Coverage floors | 84 stmts / 74 branch / 78 funcs / 85.5 lines | `vitest.config.ts:67-72` |
| `SAVE_STATE_VERSION` | `'3.0.0'` (free to bump) | `src/constants/core/core.ts:12` |
| Skip registry | empty — every ticketed phase landed | `skipCount.guard.test.ts` |
| Restore point | tag `pre-megaplan-v18` (Phase 0) | `pre-megaplan-v8`…`v17` exist |

## §0b Dupe-ledger investigation — recent-additions analysis

The ledger reached 36 via V17's whole-repo prettier pass (`e1c19d8a`),
which normalized quote style and line wrapping across already-parallel
handlers and unmasked nine 8-line-block pairs that formatting differences
had hidden. V18 retroactively formalizes the drain:

| Commit | Action |
| ------ | ------ |
| `66a8a5a0` | Split the ledger: 27 `EXEMPT_PAIRS` (structural overlap — prop-name echoes, shard barrels, vendor/parallel implementations) + 9 `DEBT_PAIRS` (genuine cloned logic) |
| `4ac89484` | `statGrantOutcome` + `makeMinorInjury` extracted — drained 7 offseason pairs |
| `8529759f` | `DriftParticles` extracted across 5 weather effect files |
| `5f82051f` | `rivalFightPlan` extracted across the 3 plan builders (grudge + aiPlan tail) |
| `3245263b` | `DEBT_PAIRS` empty → `SRC_TO_SRC_BASELINE` ratcheted 36 → 27 |
| `e6dcc447`, `672e4045` | Stale phase-pending docblocks retired; skip registry drained |

Live rescan confirms: exactly 27 src↔src pairs, all registered, `DEBT_PAIRS`
empty, zero stale entries (live-ledger test enforces this going forward).

## §A SRP targets — function-level queue

**Correction (validated):** the monolith-by-size list was disproved.
`narrateEvents/handlers.ts` (562) is a uniform ~20-handler dispatch table —
already decomposed. `stateInvariants.ts` (454) is cohesive per-check
validators + 2 entry points. `recruitmentWorker.ts` (455) is a cohesive
pipeline worker. `notable.ts` (714) is homogeneous
`Record<string, TraitDef>` data. `arenaFit.ts` (467) is borderline — one
domain, mild phase mixing. **Size misclassifies; classify-by-reading.** The
remaining SRP surface is function-level plus god-components/hooks mixing
fetch+derive+render.

First queue — all 19 functions >80 lines (contract tickets `MEGAPLAN-S1`…`S19`):

| # | Fn | File:line | Len |
| - | -- | --------- | --- |
| S1 | `WarriorBuilder` | `src/components/WarriorBuilder/index.tsx:35` | 100 |
| S2 | `resolveDecision` | `src/engine/bout/decisionLogic.ts:209` | 100 |
| S3 | `useRecruitActions` | `src/pages/Recruit/hooks/useRecruitActions.ts:181` | 99 |
| S4 | `ComparisonHeader` | `src/components/scouting/ComparisonHeader.tsx:40` | 96 |
| S5 | `createRosterActions` | `src/state/slices/rosterSlice/actions.ts:166` | 96 |
| S6 | `prepareExchange` | `src/engine/combat/resolution/exchangePrep.ts:268` | 91 |
| S7 | `resolveCounteredOffers` | `src/engine/ai/workers/competitionWorker/offerProcessor/counters.ts:66` | 88 |
| S8 | `scheduleTitleBouts` | `src/engine/championship/arenaChampionship/phases/scheduling.ts:38` | 88 |
| S9 | `RosterWarriorRow` | `src/components/stable/RosterWarriorRow.tsx:90` | 86 |
| S10 | `WarriorDossierHeader` | `src/components/warrior/dossier/WarriorDossierHeader.tsx:26` | 85 |
| S11 | `applyBoutResults` | `src/engine/matchmaking/tournamentSelection/resolution/results.ts:35` | 85 |
| S12 | `generateWarriorStatements` | `src/data/warriorStatements.ts:125` | 84 |
| S13 | `buildFTUEInitialState` | `src/components/orphanage/ftueStateBuilder.ts:71` | 83 |
| S14 | `DominantCombatantsSection` | `src/components/scouting/components/DominantCombatantsSection.tsx:27` | 83 |
| S15 | `computeAgingImpact` | `src/engine/aging/agingSystem.ts:215` | 83 |
| S16 | `aiPlanForWarrior` | `src/engine/ai/plan/coreGenerator/index.ts:50` | 83 |
| S17 | `processRecruitment` | `src/engine/ai/workers/recruitmentWorker.ts:372` | 83 |
| S18 | `MathStep` | `src/components/resolution-reveal/MathStep.tsx:18` | 81 |
| S19 | `computeTrainingImpact` | `src/engine/training/trainingImpact.ts:172` | 81 |

Second tier — `scripts/srp-census.mjs` (Phase 1, `collectSrpCensus` →
`scripts/out/srp-census.json`): 1,242 files scanned → **142 candidates**
(≥2 signals); signal totals: multi-domain 457, fan-out 66, export-mix 17,
name-families 37, banner-blocks 33, god-unit 65.

Classified-by-reading verdicts:

- **Composition roots → cohesive (EXEMPT):** `state/createStore.ts` (the
  slice composer — multi-domain imports are its job), `components/AppShell.tsx`
  is partially guilty instead (see S32).
- **Domain-cohesive modules (EXEMPT):** `distanceResolution.ts` (one
  distance/range domain under banners), `arenaChampionship/core.ts` (one
  championship domain), `core/leaderboards.ts` (leaderboard calculators),
  `trainers/trainers.ts` (one trainers domain), `constants/economy/economy.ts`
  (homogeneous constants barrel), `state/saveSlots.ts` (slot CRUD service),
  `recruitment/types.ts` (types module), `warrior/skillCalc.ts` (one
  skill-derivation aggregator).
- **Promoted to the queue (S20+)** — convergent signals confirmed by
  reading:

| # | Unit | File | Signals |
| - | ---- | ---- | ------- |
| S20 | `navigationShared.tsx` — 6 export families + 6 banners in one module | `src/components/layout/navigationShared.tsx` | multi-domain 4, export-mix 6, banners 6, god 1 |
| S21 | `PromoterDirectory` — 10 domains, 15 fan-out | `src/pages/PromoterDirectory.tsx` | multi-domain 10, fan-out 15, god 1 |
| S22 | `useFtueFlow` — 13 domains, 13 fan-out | `src/pages/orphanage/useFtueFlow.ts` | multi-domain 13, fan-out 13, god 1 |
| S23 | `useStartGame` — 11 domains, 12 fan-out | `src/pages/startGame/useStartGame.ts` | multi-domain 11, fan-out 12, god 1 |
| S24 | `RosterWall` — 12 domains, 15 fan-out | `src/components/stable/RosterWall.tsx` | multi-domain 12, fan-out 15, god 1 |
| S25 | `ArenaHub` — 9 domains, 16 fan-out | `src/pages/ArenaHub.tsx` | multi-domain 9, fan-out 16, god 1 |
| S26 | `Training` — 7 domains, 12 fan-out | `src/pages/Training.tsx` | multi-domain 7, fan-out 12, god 1 |
| S27 | `useWarriorDetail` — 9 domains | `src/pages/WarriorDetail/hooks/useWarriorDetail.ts` | multi-domain 9, god 1 |
| S28 | `useBookingOffice` — 7 domains | `src/pages/BookingOffice/hooks/useBookingOffice.ts` | multi-domain 7, god 1 |
| S29 | `useArenaDetail` — 7 domains | `src/pages/arenaDetail/useArenaDetail.ts` | multi-domain 7, god 1 |
| S30 | `RosterSnapshot` — 9 domains | `src/pages/ControlCenter/components/RosterSnapshot.tsx` | multi-domain 9, god 1 |
| S31 | `RivalStableList` — 9 domains | `src/components/scouting/RivalStableList.tsx` | multi-domain 9, god 1 |
| S32 | `AppShell` — banner-partitioned inline components (LoadingOverlay, EventLogRail, route-toggle) | `src/components/AppShell.tsx` | multi-domain 10, fan-out 17, banners 3 |
| S33 | `rivalStableShard` — 7 domains, 16 fan-out, 8 name-families | `src/engine/pipeline/passes/rivalStableShard.ts` | multi-domain 7, fan-out 16, name-families 8 |
| S34 | `Gazette` — god-unit + banner partitions | `src/pages/Gazette.tsx` | multi-domain 4, banners 3, god 1 |

- **Watch-list (reviewed, not promoted):** the remaining single-signal
  god-units (`useControlCenter`, `useTrainers`, `useWorldOverview`,
  `useHallOfFame`, `usePhysicalsSim`, `useTrainingPlanner`, `useScouting`,
  `useStableEquipment`, `useTrainingAssignments`,
  `useScoutingStableComparison`, `useWarriorBuilderState`, dashboard widgets,
  `GlobalSearch`, `Offseason`, `Graveyard`, `PromoterDetail`, `StableDetail`,
  `EventLog`, `ResolutionReveal`, `StableDossier`, `HeadToHead`,
  `WarriorFightHistory`, `AvatarForEntity`, sparkline/table charts,
  `arenaHub/leaderboard`, `ledger/*`, `widgets/*`) — multi-domain aggregation
  is the *page-hook idiom* of this codebase (already EXEMPT-registered in the
  dup ledger); a lone flag is weak evidence of responsibility-mix. Revisit if
  any grows a second signal.

## §D Dup clusters — per-tier verdict tables (Phase-1 triage complete)

| Tier | src↔src | test↔test | mixed | Disposition |
| ---- | ------- | --------- | ----- | ----------- |
| exact w8 | 27 — all EXEMPT (registered) | 150 → **4 EXEMPT + 146 DEBT** | 27 — all EXEMPT (literal pins) | gate tier — `duplication.guard.test.ts` |
| exact w12 | 7 — subset of the 27, same verdicts | 18 — verdicts inherit w8 clusters | 4 — literal pins | secondary audit tier |
| ident w20 | 181 — **all EXEMPT** (read-verified) | 50 — cluster verdicts inherit + enum-list echoes EXEMPT | 139 — all EXEMPT | audit queue — verdicts recorded here |
| ident w16 | 484 | 125 | 286 | deep tier — staged after w20 drains; never a raw-count gate |

### exact-w8 test↔test — 4 EXEMPT pairs

| Pair | Reason |
| ---- | ------ |
| `_fixtures/weather.ts`↔`schemas/enumSourcesSync.test.ts` | Sync guard re-enumerates the weather union — the literal pin **is** the test |
| `data/equipment/weaponStyles.characterization`↔`weaponStyles.test` | Characterization spec deliberately re-pins the weapon→style tables |
| `matchmaking/tournament/awardsTokens`↔`tournamentSelection` | Shared `tournamentState` fixture import preamble |
| `ai/weatherDisposition.completeness`↔`weatherSuitability` | Shared `weatherSuitability` import preamble |

### exact-w8 test↔test — DEBT clusters (146 pairs, `MEGAPLAN-D1`…`D14`)

| # | Cluster | Pattern | Harmonization target |
| - | ------- | ------- | -------------------- |
| D1 | competitionWorker eval harness (11 pairs: `playerPressure`, `venueCounter`, `styleMatchupGate`, `desperationGate`, `promoterAwareness`, `responseNotes`, `offerProcessor`, `crownWorker.dominance`) | `evaluateBoutOffer({offer, rival, warrior, currentWeek:5, weather:'Clear', …})` arg-shape + verbatim `dominantRankings`/`playerState` clones (up to 53L/11blk) | `src/test/engine/ai/workers/competitionWorker/_helpers.ts` (`evalOffer` arg builder) + `makeDominantRankings` in `_fixtures` |
| D2 | warrior-factory wrapper clones | per-file `createMockWarrior`/`makeWarrior`-wrap around `fixtureWarrior` (~20 sites: hooks, dossier, combat, pipeline specs) | repoint to `_fixtures/factories` (`makeWarrior` w/ overrides) |
| D3 | zero-state `GameState`/`Warrior` literal tails | verbatim `{scoutReports:[], rivalries:[], …}` / `{champion:false, status:'Active', …}` blocks | repoint to `makeGameState`/`makeWarrior` |
| D4 | `title()`/`ArenaTitle` literal clones (championsTournament, stateInvariants, ArenaCircuit, intentEngine.crown, aging/ai/integration family — ~16 pairs) | verbatim `title(partial)` helpers + arenaTitle literals | `_fixtures/arenaTitle.ts` (`makeArenaTitle`) |
| D5 | `statWarrior`-shaped warrior literals (strategyValidator, boutProcessorService, rosterSlice, PlanBuilder, v12Dedup, veteranCompensation, idleStipend + cross-pairs — ~24 pairs) | inline copies of the fixture's derived-warrior tail | repoint to `_fixtures/statWarrior`/`makeWarrior` |
| D6 | inline router-link mocks (CouncilBriefingWidget, Advisor, PreAdvanceChecklist, LeftNav, stable-routes, world-routes, Virtualized pair) | duplicated `vi.mock('@tanstack/react-router', () => ({Link: …}))` | `_mocks/routerLink.tsx` + shared-mock entry |
| D7 | component `vi.mock` boilerplate | per-file Button/Badge/Dossier/framer/PaperDoll/sonner/workerProxy mock blocks | extend `__SHARED_MOCKS` + `mock*` helpers |
| D8 | determinism harnesses (`resolutionDeterminism`↔`narrationDeterminism` 23.5L, `combat`↔`simulate`, sequentialMemoryGrowth↔harnessTruncation) | run-twice-and-compare scaffolding | shared `expectDeterministic(run)` in test helpers |
| D9 | weather-roll harness (`bloodMoon`/`bloodRain`↔`seasonalWeather`) | `SeededRNG` + `spyOn(rng,'next')` + `rollWeather` triplet | `_fixtures` `rollStubbedWeather()` |
| D10 | offseason-event harness (`makeCtx` clones; handler-call shape; seasonal* family) | verbatim `OffseasonEventContext` factory + `handle*({state,nextWeek:5,e,rng,ctx})` call | `_fixtures/offseasonCtx.ts` (`makeOffseasonCtx` + `runOffseasonHandler`) |
| D11 | fight-summary literals (Awards↔EventLog, resolveImpacts↔truncationBounds) | verbatim `FightSummary` literal rows | `_fixtures` `makeFightSummary` |
| D12 | rival/`rivalMap` literals (boutBidding family, offerProcessor↔weatherAwareMatchmaking, entityIndex↔routeCrumbs) | verbatim rival/owner/map literals | `makeRival`/`makeOwner` repoint |
| D13 | `_fixtures/*`↔spec echoes (statWarrior×7, storeState×3, arenaTitle, bidRoster×2, factories×2, signedBout, advisorSeed) | spec files carrying verbatim copies of fixture content | repoint to the fixture they clone |
| D14 | misc cloned helpers | `walk()` dir-crawler (envSafety↔moduleCacheRegistry), `mockWorkerCtor`+comlink mock, `championsTourney`, `makeInjury`, `signedOfferFor`/`setup`, `getPassive`, `makeArena`, BookmarkButton store-inject, recruit/promoter/potential/equipment/digest literals | per-pair repoint to `_fixtures`/`_mocks`/`_helpers` |

### exact-w8 mixed — 27 pairs, all EXEMPT

Tests intentionally pinning production literals: `warriorDefaults`
zero-state (8 specs), `gameStateFactory` shape (2), `enumSources`↔schema
tests (4), `resolution`↔combat ctx pins (2), `weaponStyles`/`weapons`
tables (3), `MobileNav`↔routerLink/LeftNav mocks (2), narrative/trait/
weather registry pins (5), `enumSources`↔fixture/section echoes (3).
Registered in `MIXED_EXEMPT_PAIRS`; `MIXED_DEBT_PAIRS` empty.

### ident-w20 verdicts (audit queue — not gate-tier)

- **src↔src 181 → all EXEMPT.** Read-verified classes: string/Record data
  tables (`COMMON_CORPUS`, lore, name pools, templates, `WEAPON_*` maps,
  `KILL_WINDOW`, `TelemetryEvents`, key lists), import preambles
  (`arenas/index`, `weather/index`, `navigationHubs`, `skillCalc`,
  `schemaEnums`, `impacts/types`), shadcn vendor boilerplate
  (dialog/sheet/alert-dialog/select/tabs/toast), interface-shape echoes
  (hook `useShallow` selector & return-object idiom, `OffenseDefenseCtx`
  literals, prop `Pick<>` slices), generated unions (`routeTree.gen`,
  `offseasonEvents/types`). `MiniCombatLog.getEventIcon` (text badges) vs
  `TacticalLogView.getEventIcon` (Lucide JSX) verified **parallel
  implementations** over shared `classifyEvent` — divergent payload → §U1.
- **test↔test 50 → same verdicts as w8** (cluster membership identical)
  plus ident-only echoes: enum/string-list literals (bannedTerms,
  validEffectTypes, arena-id lists, key lists) → EXEMPT pins; combat
  win-rate harness family (`baGuardBreak`, `psCounterstrike`,
  `prRiposteMaster`, `bleed`, `strikingAttack`, `wsImmovable` N-loop
  boilerplate) → **DEBT** folded into D8/D2 (drains with those clusters).
- **mixed 139 → all EXEMPT** — every pair is a small set of test files
  carrying big literal constants (`weather` fixture, `enumSourcesSync`,
  `terminology` bannedTerms, `shardInputSize` keys, `offenseDefense` ctx
  keys, `sharedMocks` registry, `typeSurface` imports) colliding with the
  src string-list tables.

### ident-w16 (staged)

484 src↔src / 125 test↔test / 286 mixed — staged as the deep tier after the
w20 tier's verdict work lands; ident tiers are never raw-count gates.

## §U Unique-logic register

Per-cluster divergent behavior that must provably survive consolidation.
Each row gets a preservation spec in Phase 2 (`v18Preservation`).

| # | Cluster | Site A | Site B | Divergent behavior |
| - | ------- | ------ | ------ | ------------------ |
| U1 | combat-log event icons | `MiniCombatLog.getEventIcon` → text badges `'HIT'/'CRT'/'KIL'…` | `TacticalLogView.getEventIcon` → Lucide JSX icons | Shared `classifyEvent` vocabulary; divergent render payload — both survive |
| U2 | weather effects | `stormEffects`/`windEffects`/`heatEffects`/`fogEffects`/`specialEffects` | shared `DriftParticles` idiom | Per-effect colors, animation classes, particle geometry are the divergent payload |
| U3 | competitionWorker specs | per-spec scenario semantics (desperation/pressure/venue/style/promoter) | shared eval-harness (D1) | Scenario setup stays per-site; only arg-shape + rankings helpers move |
| U4 | shadcn overlays | `dialog`/`sheet`/`alert-dialog`/`select`/`tabs`/`toast` | vendor boilerplate | Distinct primitives, styling, and behavior per component |
| U5 | page-hook return shapes | `useAdminTools`/`useControlCenter`/`useTrainers`/`useBookmarkGroups`/`useStartGame`/`useFtueFlow` | `useShallow` selector idiom | Distinct field sets per page — no shared selector |
| U6 | offseason handlers | per-event `handle*` branches (`EVENT_HANDLERS` map) | shared `OffseasonEventContext` shape | Per-event effectType keys + narrative literals unique |
| U7 | ordered design data | `COMMON_CORPUS`, lore arrays, name pools, crest pick-tables, template name lists | ident-normalized shape echo | Array ORDER + literal contents are load-bearing (rollWeighted pick tables, narrative lists) — never merged |
| U8 | state-field key lists | `EXCLUSIVE_STRATEGY_KEYS` (pipelineStages) | `ARRAY_FIELDS` (plausibility) / `LEGACY_TRAIT_ORDER` (registry) | Distinct key sets over the same literal shape — no merge |
| U9 | countered-offer branches | `resolveCounteredOffers` per-counter-type branches | extracted sibling units (S7) | Each branch's verdict semantics preserved verbatim |
| U10 | enum literal pins | `enumSourcesSync`, `terminology` bannedTerms, `ALL_EVENT_TYPES`, arena-id lists, ctx key lists | canonical prod enums | Tests re-enumerate literals deliberately — importing the source would make the guard vacuous |

## Scanner-interface reference (for Phase-2 test authors)

Two harness shapes exist — pick per scanner:

| Scanner | Interface | Notes |
| ------- | --------- | ----- |
| `dup-scan.mjs` | `collectDuplicates({ident, window, minBlock})` | importable; `@ts-expect-error` on the .mjs import |
| `function-length.mjs` | `collectSizes()` → `{functions}` | importable (v12Srp precedent) |
| `param-count.mjs` | `collectParamCounts()` + `PARAM_LIMIT`=5 | importable |
| `entries-in-loop.mjs` | `collectEntriesInLoop()` | importable |
| `ui-audit-scan.mjs` | `collectUiAudit()` | importable |
| `orphan-scan.mjs` | **no exports** — subprocess + read `scripts/out/orphan-scan.json` | `orphanScan.guard.test.ts` precedent (`execFileSync` + JSON read) |
| `data-array-dup-scan.mjs` | **no exports** — subprocess | data-array dupe report/rewrite |
| `test-audit-scan.mjs` | **no exports** — subprocess; **regenerates** `runnerGroups.json`/`auditBaseline.json` | never hand-edit generated JSON (V17 C3) |
| `srp-census.mjs` | `collectSrpCensus()` → `{summary, candidates}` | landed in Phase 1; writes `scripts/out/srp-census.json` |

## Conventions confirmed for V18 docs/guards

- Megaplan docs carry their own `markdownlint-disable` block — **no
  filename exemption exists** (`d9488e8e` added inline directives;
  `eslint.config.js` has no markdown rules).
- Skip tickets match `MEGAPLAN-[A-Z]\d+` on the skip line and must be
  registered in `REGISTERED_SKIP_TICKETS`; registry currently empty.
- Test placement per `docs/TESTING.md`: mirror-path under `src/test/`,
  guards in `src/test/megaplan/` (outside CATEGORY_DOMAIN →
  domain-import-rule exempt), `.slow` terminal marker for heavy specs.
- Guard docblocks state "authored test-first" history accurately — the
  stale-marker guard scans whole-file contents for pending-phase claims.
