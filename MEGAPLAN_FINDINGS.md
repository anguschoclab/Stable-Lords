# MEGAPLAN FINDINGS — Exhaustive Review & Verdict Tables

**Scope:** Full-repo review with tiered sweeps + scanner-generated findings (`scripts/out/{megaplan-sizes,dup-scan,ui-audit,orphan-scan}.json`). Every row carries a verdict: **APPROVED** (confirmed, action planned), **CORRECTED** (real but different), **DISPROVED** (premise false), **NOTE** (intentional/accepted).
**Baseline:** `3bc5476e` (+ tooling `6fbd0422`; restore tag `pre-megaplan-v8` = `a8cf7ca2`).
**Authority:** full autonomy per owner direction; this document is the audit trail.
**Coverage caveat:** engine dirs read deeply; leaf modules in already-organized dirs were signature+structure read and are fully read during their refactor batch (each batch reads every file it touches).

---

## 0. Validation Ledger — plan-draft claims audited

| # | Claim | Verdict | Evidence / correction |
|---|---|---|---|
| V1 | ~111k LOC non-test | **APPROVED** | authoritative: 989 src files / 118,248 LOC (`megaplan-sizes.json`) |
| V2 | 7 engine file/dir shadows + ~43 flat root files | **APPROVED** | `aging` `economy` `favorites` `injuries` `promoters` `simulate` `training` each `X.ts` + populated `X/` |
| V3 | 165 functions ≥80 lines | **CORRECTED** | authoritative AST census: **239 fns >80** (112 >120, **25 >200**). `function-length.mjs` |
| V4 | `data/arenas.ts` 1,559 splittable | **APPROVED** | registry fns L3–94 + ~40 inline `*_ARENA` consts + `ARENA_LORE` |
| V5 | `traitDefs.ts` 998 splittable | **APPROVED (data-dominant)** | types L25–93 + single `TRAITS` literal |
| V6 | `arenaChampionship.ts` split | **CORRECTED** | 922 post user-extraction (`284a88c5`); axes: lifecycle / offers / perks / delta |
| V7 | `weekPipelineService.ts` 611 splittable | **APPROVED** | seams: pass table, context prep, `buildWeekCaches`, stage runner |
| V8 | `state.types.ts` 791 domain-splittable | **APPROVED** | ≥10 type domains; barrel kept (types umbrella is public API — see game.ts) |
| V9 | `chaosHandlers.ts` 829 / `loreData.ts` 659 | **APPROVED** | handler family duplicated (see K1); lore is homogeneous data → thematic shards |
| V10 | `warriorNames.ts` 1,222 keepable | **NOTE → EXEMPT** | homogeneous data arrays; exempt from size budget via explicit token |
| V11 | Per-route primary CTA missing | **VIOLATION CONFIRMED** | `AppHeader.tsx:367` static `ExecuteWeekButton`; spec route names stale → mapping amendment needed |
| V12 | Page primitives universal | **CORRECTED → gap confirmed** | see L2 |
| V13 | Raw hex/rgba = violations | **CORRECTED (scope)** | 90 classified hits in 24 files; allowlist for SVG paints/data palettes |
| V14 | No dup/dep tooling | **APPROVED** | built: `function-length.mjs` `dup-scan.mjs` `ui-audit-scan.mjs` |
| V15 | Coverage floors 84/74/78/85.5 | **APPROVED** | `vitest.config.ts` |
| V16 | `SAVE_STATE_VERSION` bumpable | **APPROVED** | `'2.1.0-hardened'` @ `constants/core/core.ts:12` |
| V17 | AppShell wraps all non-FTUE routes | **APPROVED** | `__root.tsx` |
| V18 | `bun test` has 4 ignores | **CORRECTED** | 7 `pathIgnorePatterns` |
| V19 | Slow suite = 12 files | **CORRECTED** | 24 `*.slow.test.*` |
| V20 | e2e = 2 nav-covering specs | **APPROVED** | `golden-path` + `seasonal-tournament` |

---

## A. Unreachable / parallel modules

| # | Finding | Class | Verdict | Evidence |
|---|---------|-------|---------|----------|
| A1 | `engine/validate/stateInvariants.ts` | test-only | **NOTE (kept)** | intentional soak-test tooling per its docstring; V7 verdict stands |
| A2 | `types/global.d.ts`, `vite-env.d.ts` | unreachable | **DISPROVED** | ambient type decls consumed by tsc, not imports |
| A3 | `engine/traits.ts` compat barrel (26 lines) | barrel | **APPROVED** | self-described "re-export barrel for backward compatibility" — zero-compat pass repoints ~N importers to `traitDefs`/`traitGeneration`/`traitMods`, deletes file |

No unreachable production modules, no parallel engines. (orphan-scan: 987 prod-reachable, 0 unexplained unreachable.)

## B. Dead state fields

**None.** orphan-scan state-field index: all audited fields have live writers+readers (`meta`, `houseRules`, `contentPacks`, `lifetimeStats`, … all `status: ok`). Prior B-table stays closed.

## C. Dead data / narrative content

| # | Finding | Verdict | Evidence |
|---|---------|---------|----------|
| C1 | `arenas.ts` individual `*_ARENA` exports "dead" | **DISPROVED** | values are live via the registry's internal `registerArena` calls; only the `export` keyword is unnecessary → resolved naturally by the I1 file split (registry imports its own venue modules) |

## D. Dead exports in live modules (orphan-scan: 500 raw)

Bulk classification: ~430 are intentional surface — Radix wrapper re-exports (`ui/*`), type/props exports, script stubs (`scripts/stubs/*` are vitest aliases), Electron main internals, lazy `default` exports (`ResolutionReveal` IS consumed via `lazy(() => import())` — scanner edge case, **DISPROVED**), registry-fed arena constants (C1). Residual candidates to verdict during Phase-3/4 batches when their files are open. No cluster requires a dedicated removal pass beyond A3.

## E. Nav-hidden / unrouted UI

| # | Route | Verdict | Evidence |
|---|-------|---------|----------|
| E1 | `/arena-hub` | **DISPROVED** | documented legacy redirect → `/stable/arena`; covered by `top-routes.test.tsx` "legacy alias" suite |
| E2 | `/world/arena-leaderboards` | **DISPROVED** | documented redirect → `/world/arenas` (boards moved onto arena cards) |
| E3 | param routes (`/warrior/$id`, `/world/stable/$id`, `/stable/promoter/$id`, `/world/arenas/$arenaId`) | **DISPROVED** | entity deep-links via EntityLink/page cross-links |
| E4 | `/` index | **DISPROVED** | Control Center is the hub root |

Zero unexplained nav-hidden routes.

## F. AI-unreachable subsystems

No new AI-only gaps surfaced by scan; prior audit's intentional-divergence NOTES stand (player-scout prose vs rival dossiers; rival rest via bid suppression; rival draft vs player scouting). Per-row re-verification happens when their modules are touched.

## G. Spec-matrix gaps (Feature Integration Matrix re-check)

| # | Matrix row | Verdict | Evidence |
|---|-----------|---------|----------|
| G1 | #6 Style Archives Browser (10 warrior types) | **APPROVED — gap** | only FightingStyle enumeration in UI is the WarriorBuilder dropdown (`IdentitySection.tsx:64`); no compendium/browser. Spec data exists (`Fighting_Styles_Compendium` doc + `tagDescriptions`). Build per Phase 5. |
| G2 | #5 Favorite Weapon Charting Toolkit | **CORRECTED — partial** | favorites display exists (`warrior/favorites/*`, `FavoritesCard`); "charting toolkit" (cross-warrior affinity chart) absent → scoped wiring item |
| G3 | #23 Tournament Prep Mode (class calc, FE freeze checks) | **APPROVED — gap candidate** | PhysicalsSimulator covers physicals (#9); no prep-mode surface for FE/class checks. Verify scope in Phase 5 |
| G4 | All other matrix rows (#1,3,4,7,8,9,10,11,15,25,27,29,31,33,34,36,38,39) | **DISPROVED as gaps** | implemented per prior audit + spot verification (SchedulingWidget, bibleIndex, QuestsWidget, houseRules, importExport, contentPacks, KillAnalyticsPanel, AdminTools/TelemetryPanel, saveSlots) |

## H. File/dir shadows & misplaced modules — disposition map

| Flat file | Lines | Target | Verdict |
|---|---|---|---|
| `aging.ts` | 225 | `aging/agingSystem.ts` (or split `penalties`/`retirement`) | APPROVED |
| `economy.ts` | 292 | `economy/weeklyBreakdown.ts` (merge `economy/utils.ts`) | APPROVED |
| `favorites.ts` | 210 | `favorites/favorites.ts`→`favorites/discovery.ts` | APPROVED |
| `injuries.ts` | 227 | `injuries/injurySystem.ts` (+ existing `utils.ts`) | APPROVED |
| `promoters.ts` | 30 | `promoters/promoterHistory.ts` | APPROVED |
| `simulate.ts` | 150 | `simulate/simulateFight.ts` | APPROVED |
| `training.ts` | 316 | `training/trainingImpact.ts` | APPROVED |
| `telemetry.ts` | 108 | `core/telemetry.ts` | APPROVED |
| `jobQueue.ts` `session.ts` `worker.ts` `workerProxy.ts` | 87+59+87+29 | `engine/runtime/` (new) | APPROVED |
| `deathNotifier.ts` | 66 | `core/` (EventBus sibling) | APPROVED |
| `draftService.ts` `recruitment.ts` `recruitScouting.ts` | 92+345+121 | `engine/recruitment/` (new) | APPROVED |
| `scouting.ts` `scoutInsights.ts` | 293+121 | `engine/scouting/` (new) | APPROVED |
| `matchmakingServices.ts` `schedulingAssistant.ts` | 78+435 | `matchmaking/` | APPROVED |
| `metaDrift.ts` | 88 | `analytics/` — **plus** `getMetaColor`/`getMetaLabel` emit CSS classes → split UI helpers out (L-table) | APPROVED |
| `planBias.ts` `strategyAnalysis.ts` `strategyValidator.ts` `tacticSuitability.ts` | 65+66+153+102 | `engine/strategy/` (new) | APPROVED |
| `weaponSuitability.ts` `equipmentOptimizer.ts` | 122+299 | `engine/equipment/` (new) | APPROVED |
| `potential.ts` `skillCalc.ts` `skillBreakpoints.ts` `warriorStatus.ts` `warriorValue.ts` `progression.ts` `fame.ts` `health.ts` `crowdMood.ts` `stableReputation.ts` | ~1,500 | `warrior/` (potential/skills/status/value/progression/health), `bout/` (fame — bout-outcome tags), `stats/` (crowdMood? decide: arena-domain → `combat/` adjacent? → verdict: `bout/`), `stable/` for reputation | APPROVED w/ per-file final dir in Phase 3 |
| `trainers.ts` `trainerAging.ts` `trainerSpecialties.ts` | 213+95+146 | `engine/trainers/` (new) | APPROVED |
| `traitDefs.ts` `traitGeneration.ts` `traitMods.ts` `traits.ts`(barrel) | 998+81+130+26 | `engine/traits/` — traits.ts deleted (A3), traitDefs split per I3, `traitData/` folded in | APPROVED |
| `autosim.ts` | 246 | `engine/autosim/` (new dir — wraps pipeline, distinct from `simulate/`) | APPROVED |
| `index.ts` | 6 | keep — engine public API barrel (3 real exports) | NOTE |

## I. Monolithic files — authoritative (AST census)

| # | File | Lines | Verdict / split |
|---|---|---|---|
| I1 | `data/arenas.ts` | 1,559 | APPROVED → `data/arenas/{types,registry,venues/*.ts,lore,index}` |
| I2 | `data/names/warriorNames.ts` | 1,222 | **EXEMPT** (homogeneous data; explicit budget exemption) |
| I3 | `engine/traitDefs.ts` | 998 | APPROVED → `traits/{types,common,notable,exceptional,signature,flaw,index}` |
| I4 | `engine/championship/arenaChampionship.ts` | 922 | APPROVED → `{lifecycle,titleOffers,perks,delta}` + `championsTournament.ts` |
| I5 | `pipeline/offseasonEvents/chaosHandlers.ts` | 829 | APPROVED → handler-DSL refactor w/ K1 dedup (do together) |
| I6 | `types/state.types.ts` | 791 | APPROVED → `types/state/*` shards + `state.types.ts` re-export barrel (public API — 252 `types/game` importers) |
| I7 | `narrative/lore/loreData.ts` | 659 | APPROVED → thematic shards + index |
| I8 | `pipeline/services/weekPipelineService.ts` | 611 | APPROVED → `weekPipeline/{passes,context,caches,runner,index}` |
| I9 | `types/shared.types.ts` | 568 | APPROVED → split by domain + barrel (same pattern as I6) |
| I10 | `constants/arena/weather.ts` | 532 | **DONE** → `arena/weather/{config,penalties,index}` + `weatherStats`/`weatherAmbience` |
| I11 | `constants/combat/combat.ts` | 509 | **DONE** → `combat/{global,balance,matchup,meta}` + 4-line re-export barrel |
| I12 | `data/equipment/weapons.ts` | 508 | **DONE** → `weapons/items.ts` (+ `weaponStyles`); `weapons.ts` is now a 25-line re-export barrel |
| I13 | `types/narrative.types.ts` | 503 | **DONE** → `types/narrative/{conclusions,events,fanfare,gazette,memorials,meta,passives,pbp,personas,recruitment,root,strikes,uxMetadata}` + 13-line barrel |
| I14 | `pages/ArenaDetail.tsx` 568 | — | decomposed via J-table (not a file split) |

## J. Long functions — authoritative (239 >80; top 25 >200 list)

`computeStableCouncilReport` 431 · `ArenaDetail` 420 · `Help` 383 · `Bookmarks` 325 · `narrateEvents` 307 · `StableDetail`/`WorldOverview` 301 · `PromoterDetail` 297 · `HallOfFights` 284 · `Training` 284 · `evaluateBoutOffers` 276 · `Orphanage` 274 · `Trainers` 269 · `BookingOffice` 260 · `processAllRivalsBoutOffers` 253 · `runSimulationLoop` 250 · `WarriorCouncilCard` 249 · `evaluateBoutOffer` 248 · `createStore` anon 245 · `NewGameForm` 233 · `PlanBuilder` 220 · `convertBidsToOffers` 220 · `resolveRound` 214 · `WarriorDetail` 211 · `StartGame` 202.

Policy: engine/AI/matchmaking functions decompose to ≤~80 via extract-fn (behavior-pinned by existing tests); page components decompose via sub-component extraction into `components/<domain>/` + hooks (Phase 3 for engine, Phase 6 batches for pages). Ratchet guard enforces ≤120 ceiling now, ≤80 target.

## K. Duplicate clusters (dup-scan: 967 pair-clusters; src↔src 84)

| # | Cluster | Verdict | Plan |
|---|---------|---------|------|
| K1 | `offseasonEvents/{buff,chaos,injury,social}Handlers.ts` — ~500+ duplicated lines: `getActiveWarriors`→`rng.pick`→`rosterUpdates.set`→`pushNewsletterItem` ceremony repeated per event | **APPROVED** | handler-DSL: shared `pickAndGrant` helpers + per-event declarative effect spec; lands with I5 |
| K2 | `schemaEnums.ts` 39 literal `z.enum([...])` arrays vs `enumSources.ts` 38 canonical tuples (only 1 derives) | **APPROVED** | derive `z.enum(TUPLE)` where tuple exists; remove literal dupes (drift risk — `CROWD_MOOD_VALUES` already does this right) |
| K3 | test↔test clusters (780) — fixture/setup boilerplate (awardsTokens↔tournamentSelection ~270 lines; state persistence specs ~70×3; impact-merge specs ~60×4) | **APPROVED (test-scope)** | extract shared fixtures/helpers into `_fixtures/`/`_helpers` during test-batch work; lower priority |
| K4 | `types/game.ts` umbrella barrel (252 importers) | **NOTE — keep** | legitimate public types API |

## L. Design-Bible violations (ui-audit-scan + manual)

| # | Finding | Verdict |
|---|---------|---------|
| L1 | Static `ExecuteWeekButton` all routes; spec mandates per-route CTA — **plus** spec route names stale (`/run-round`,`/arena`,`/tournaments` vs `/stable/bouts`,`/stable/arena`,`/world/tournaments`) | **APPROVED** — location-aware CTA registry + `DESIGN_PAGE_SYSTEM_v1.0.md` route-table amendment |
| L2 | `PageFrame` missing: Graveyard, Help, PhysicalsSimulator, PromoterDirectory, WorldOverview, HallOfFame, StableEquipment (+`PageHeader` present); neither: Gazette, PromoterDetail, HallOfFights. FTUE-exempt: StartGame, Orphanage. NotFound: marginal. | **APPROVED** — conform or `data-bible-exempt` token |
| L3 | 90 token-violation hits in 24 files (NewGameForm 15, Gazette 16, surface-utils 7, orphanage cluster ~30, startGame cluster ~15) | **APPROVED** — token migration + `uiTokens` guard test |
| L4 | 114 motion-violation hits in 49 files (`animate-*`/`transition` w/o `motion-reduce`) | **APPROVED** — sweep add `motion-reduce:` variants |
| L5 | 92 screaming-copy candidates in 37 files — mixed real display copy vs legit const-valued strings; classify during Phase 6 | **APPROVED** — verdict per hit |
| L6 | 0 rng-violations, 0 fake-chrome | **DISPROVED** (as open problems) |
| L7 | `engine/metaDrift.ts::getMetaColor/getMetaLabel`, `strategyAnalysis::getScoreColor` emit Tailwind classes from engine layer | **APPROVED** — move UI helpers to `lib/`/`components/` side in Phase 3 |

## M. Test-suite findings

| # | Finding | Verdict |
|---|---------|---------|
| M1 | `advanceWeekPerformance` timing-ratio flake under parallel load (passes isolated) | **NOTE** — pre-existing flake; candidate for `.slow` promotion in Phase 7 |
| M2 | Test-plan table (change → tests → status) | see below |
| M3 | No colocated tests outside `src/test/` | **DISPROVED** (as a problem — clean) |
| M4 | Registry enumeration order is observable — two splits reordered it | **CONFIRMED + FIXED** — `b6d1caa5` arena registration regrouped seed→variants→late; `b6e62956` re-sharded `TRAITS` keys by tier. Both shifted seeded sim trajectories (worldLiveness 104-wk diverged by wk5/wk9, `stripped` endings 0). Fixed in `4584df58`: legacy registration order restored + pinned by test, `LEGACY_TRAIT_ORDER` + drift guard. Post-fix seeded trajectory byte-identical to `3bc5476e` baseline. |
| M5 | `bun test` deadlocks on user-authored async `vi.mock` factories | **CONFIRMED + FIXED** — dynamic-import/async factories hang the runner silently (stale processes spin at ~100% CPU). All converted to sync factories backed by `__SHARED_MOCKS` registry; `bunRunnerSafety` canary regex repaired (it previously missed `async () =>` shapes). |
| M6 | `awardTournamentPrizes` positional bronze fallback awards 3rd place to irregular-bracket bouts | **CONFIRMED — PRE-EXISTING, NOT FIXED** — in brackets whose semifinal yields ≠2 losers (non-power-of-2 fields), no `isBronzeMatch` bout is injected, so the engine's `(round 6, matchIndex 1)` fallback can pin "3rd place" on a real finalists-round or pre-resolved bye bout — awarding purse/medal/fame to a warrior who never fought a playoff. Fixing would shift seeded trajectories; recorded instead. The e2e spec now mirrors the engine's exact podium derivation (`isBronzeMatch` snapshotted + same sort), so purse accounting verifies regardless of geometry. Related: the champions-only Grand Championship is legitimately conditional (cancelled when <MIN_FIELD crowns are held) — the soak asserts 16-or-17 year-1 tournaments accordingly. |

### M2. Test-plan table — test-first inventory

| Change (phase) | Required test(s) | Status |
|---|---|---|
| H-table engine moves (P3) | existing suite + type-check (imports repoint) | covered |
| I6/I9 types split (P3) | `megaplan/typeSurface.test.ts` — export manifest parity pre/post | ✅ built (2c, green) |
| I5/K1 handler DSL (P3/P4) | per-event tests exist (seasonal*.test.ts ~9 files) + `offseasonDeterminism` | covered — verify completeness per handler |
| I4 championship split (P3) | `arenaChampionship*.test.ts` ×5 | covered |
| I8 weekPipeline split (P3) | `weekPipeline.test.ts` + `weekPipelineDAG.test.ts` | covered |
| J engine fns (P3) | council/economy/simulationLoop coverage exists | covered |
| J page components (P6) | RTL region-pinning specs: `pages/ArenaDetail.test.tsx`, `PromoterDetail.test.tsx`, `PromoterDirectory.test.tsx`, `Graveyard.test.tsx` (the 4 largest pages with zero direct coverage) | ✅ built (2a, green) |
| L1 per-route CTA (P6) | `megaplan/appShell.cta.test.tsx` — registry spec (glob-loaded so it compiles pre-implementation) | ✅ built (2b, `describe.skip` MEGAPLAN-L1) |
| L2 primitives conformance (P6) | `megaplan/pagePrimitives.conformance.test.tsx` | ✅ built (2b, `describe.skip` MEGAPLAN-L2) |
| L3 token sweep (P6) | `megaplan/uiTokens.guard.test.ts` — classified token/copy/motion budgets | ✅ built (2c, green — baseline counts pinned) |
| G1 style archives (P5) | `megaplan/styleArchives.wired.test.tsx` | ✅ built (2b, `describe.skip` MEGAPLAN-G1) |
| G2 favorites charting (P5) | `megaplan/wiring.wired.test.tsx` | ✅ built (2b, `describe.skip` MEGAPLAN-G2) |
| G3 tourney prep (P5) | `megaplan/wiring.wired.test.tsx` | ✅ built (2b, `describe.skip` MEGAPLAN-G3) |
| Guard: orphans | `megaplan/orphanScan.guard.test.ts` — runs scripts/orphan-scan.mjs, baseline-capped | ✅ built (2c, green) |
| Guard: budgets | `megaplan/fileBudget.test.ts` — 800-line file ceiling + exemptions (`routeTree.gen`, `warriorNames`, `arenas.ts` pending I1 split) | ✅ built (2c, green) |
| Guard: dup ceiling | `megaplan/duplication.guard.test.ts` — 84 src↔src pair baseline embedded; new clusters fail | ✅ built (2c, green) |
| Guard: skip count | `megaplan/skipCount.guard.test.ts` — no hard `.skip` outside megaplan; every megaplan skip names a registered ticket; count ≤ 5 | ✅ built (2c, green) |
| Schema changes (P5) | zod round-trip + `SAVE_STATE_VERSION` bump assert | only if B/D rows land a schema change (currently none) |

**Phase-2 status:** test-first batch landed — 5 guards green (fileBudget, duplication, uiTokens, orphanScan, skipCount), type-surface parity green, 4 page pinning specs green, 5 spec-encoding suites committed `.skip`ped (8 tests, all ticketed). Gate run: 26 pass / 8 ticketed skips, `bun run type-check` green.
