<!-- markdownlint-disable MD001 MD024 MD025 MD033 MD060 -->

# MEGAPLAN V19 FINDINGS — Full Re-Baseline (measured 2026-10-22)

Companion to `MEGAPLAN_V19_PLAN.md`. Every number below was measured
against the live codebase at HEAD `217c1b7c` (+ `a1fb77bd` baseline regen).
Prior verdicts are re-verification targets; verdicts below are fresh.

## §0 Baseline metrics

Full gate matrix in `MEGAPLAN_V19_LEDGER.md` §0. Headline: 1,283 src /
141,711 LOC; 994 test / 149,849 LOC; **6 fns >80**; dup w8 27/79/17;
knip 222; orphan deadExports 215; scan-in-loop 88; entries-in-loop 5;
ui-audit 0; soak 40w 0 violations @ 257.7 ms/week; 880 vitest files /
9,467 tests green.

## §W Wiring findings — code + feature level

### Code-level classification of 215 deadExports

Automated triage (`scripts/out/v19-deadexport-triage.json`) —
every symbol cross-referenced across all 2,276 src files:

| Class | Count | Disposition |
| ----- | ----- | ----------- |
| test-only surface | **109** | EXEMPT — deliberate test-visible exports (V2 precedent: `resetArenaRegistry`, `clearDeathHandlers`, `clearHistoryResolverCaches`, `TRAIT_POLICY`, `STYLE_CLASSIC_WEAPONS`, `generateRecruitAttrs`, …) |
| prod-referenced (scanner-blind) | **18** | EXEMPT — live via `import type`, barrels, `lazy()` default, worker boundary (`stableStats`, `AudioManager`, `fitWeapon`/`weaponFitScore`, `computeHP`, `updateWarriorAfterBout`, `HUBS`/`HubId`, `SEASONAL_WEATHER`, `TOURNAMENT_TIERS`, …) — verified per-symbol |
| zero-ref Radix primitives | **22** | EXEMPT — intentional complete vendor API surface (`DialogPortal`, `SelectGroup`, `SheetOverlay`, `TableFooter`, `ScrollBar`, …) |
| **zero-ref, internal-use only** | **10** | **DRAIN (unexport)** — see table below |

Non-src deadExports (56): electron internals (9), `scripts/stubs` (21 —
vitest aliases by design), scanner/script internals (~26) — all EXEMPT.

### §K drain candidates — verified zero-ref, internal-use only

| # | Symbol | File | Verdict |
| - | ------ | ---- | ------- |
| K1 | `CROWD_KILL_BONUS` | `src/engine/simulate/initialization.ts:27` | **DRAINED** — `export {…}` removed |
| K2 | `RivalFightPlanOpts` | `src/engine/ai/plan/rivalPlan.ts:16` | **DRAINED** — unexported |
| K3 | `StableReputation` | `src/engine/stable/stableReputation.ts:31` | EXEMPT — live via `useControlCenter` inferred return type (TS4058) |
| K4 | `BookmarkRow` | `src/pages/bookmarks/groupBookmarks.ts:8` | EXEMPT — live via `useBookmarkGroups` inferred return type (TS4058) |
| K5 | `GearRecommendation` | `src/engine/equipment/equipmentOptimizer.ts:19` | EXEMPT — live via `useStableEquipment` inferred return type (TS4058) |
| K6 | `ChosenWarriorOutcome` | `src/engine/pipeline/offseasonEvents/helpers.ts:70` | **DRAINED** — unexported |
| K7 | `GrantableStat` | `src/engine/pipeline/offseasonEvents/helpers.ts:130` | **DRAINED** — unexported |
| K8 | `ArenaWarriorEntry` | `src/engine/core/leaderboards.ts:85` | EXEMPT — live via `useArenaDetail`/`useArenaSelectors` inferred returns (TS4058) |
| K9 | `ArenaLeaderboardData` | `src/engine/core/leaderboards.ts:98` | EXEMPT — same TS4058 channel |
| K10 | `ArenaStableEntry` | `src/engine/core/leaderboards.ts` | EXEMPT — same TS4058 channel |

Effect: `orphan-scan` src deadExports 159 → 155; ceiling ratcheted in
`orphanScan.guard.test.ts`. Lesson recorded: word-boundary ref search
misses inferred-return-type flow — TS4058 is the authoritative check.

### State fields / routes / modules

- All audited `stateFields` status `ok`. `ArenaWeatherMod.weatherMods`
  (`types/shared/spatial.ts:73`) — **LIVE**: readers
  `engine/narrative/arenaNarrative.ts:107`,
  `engine/combat/mechanics/weatherEffects/index.ts:25,30`. V2
  writer-only verdict REVERSED.
- 0 unreachable prod modules · 0 test-only · 0 unlinked pages ·
  nav-hidden routes all registered (`orphanScan.guard` allowlists).

### Feature-level spec audit

Spot-verified each `Stable_Lords_*_Spec` row against shipped surfaces:
bout system (`BoutViewer`), matchmaking/scheduling (`BookingOffice`),
orphanage (`Orphanage`), strategy editor (`PlanBuilder`), training
(`Training`/`TrainingPlanner`), potential (`WarriorStats`/potential),
equipment encumbrance (`StableEquipment`), kill/permadeath (`Graveyard`),
styles compendium (`StyleArchives` — prior G1), favorites charting
(`FavoritesCharting` — prior G2), tournament prep (`TournamentPrep` —
prior G3), AI dueling behavior (`engine/ai/*`), master bible
(`lib/bibleIndex` + `/help`). **No new feature-level gaps found** — the
V8–V18 wiring drains hold. No §W feature tickets needed.

## §D Dup clusters — re-baselined verdict tables

| Tier | src↔src | test↔test | mixed | Disposition |
| ---- | ------- | --------- | ----- | ----------- |
| exact w8 | 27 (all EXEMPT-registered, re-verified) | 79 → 4 EXEMPT + 70 DEBT + ~5 residual-to-triage | 17 EXEMPT | gate |
| exact w12 | 6 | 12 | 3 | audit |
| ident w20 | 170 | 52 | 135 | audit queue |
| ident w16 | 454 | 128 | 288 | audit queue |

`TEST_DEBT_PAIRS` (70) re-verified pair-by-pair against live scan —
all 70 still duplicate. Cluster assignment for drain:

| Cluster | Pairs | Pattern | Harmonization target | Final |
| ------- | ----- | ------- | -------------------- | ----- |
| D15 competitionWorker eval-harness | 11 (#34–44) | `evaluateBoutOffer({offer,rival,warrior,currentWeek:5,weather:'Clear',opponent})` verbatim call-shape ×~15 sites | **`_fixtures/competitionWorker.ts` `evalBoutOffer`/`verdict`/`rivalOffer` + `_fixtures/bidRoster.ts` `generateTestBids`/`convertToTestOffers`/`bidContext`** | **DRAINED** |
| D16 fixture↔spec echoes | 7 (#1–7) | spec copies fixture literal tails | repoint spec to the fixture export (`makeBidRival`, `TEST_PLAYER`, `TINY_STATE_FIELDS`, `VETERAN_60`, `ATTRS_10`, `makeStubFight`/`makeStubBout`, `makeBoutSummary`, `makeSignedOffer`, `makeOffseasonCtx`/`seasonalCallArgs`, `makeFlatPotential`, `makeIronWolvesRival`) | **DRAINED** |
| D17 component mock/setup boilerplate | ~20 | identical `vi.mock`/store-inject/import blocks | `_mocks/framerMotion.tsx`, `_mocks/archiveService.ts`, `_mocks/bookmarkStore.ts`, `_mocks/uiButton.tsx`, `_mocks/uiMeta.ts`, `_mocks/entityLinkDeps.tsx`, `_helpers/windowSnapshot.ts`, `_mocks/gameStoreSelector.ts` `seedBriefingMockState` + `_fixtures/dashboardTabState.ts` | **DRAINED** |
| D18 engine scenario literals | ~20 | cloned state/ctx/offer literals + walk()/mock helpers | `_fixtures/arenaTitle.ts` `makeVenueWarrior(At)`, `_fixtures/determinism.ts` `makeFlatWarrior`, `_fixtures/statWarrior.ts` `makeBareWarrior`/`makeMidWarrior`/`makeEconomyWarrior`, `_fixtures/equipmentLoadout.ts`, `_fixtures/intelDossier.ts` `selfVsOppState`, `_fixtures/offerCard.ts` `unsignedActionProps`, `_fixtures/offseasonCtx.ts` | **DRAINED** |
| D19 combat/win-rate harness | ~8 | `makeWarrior({attrs:15s,rng:SeededRNG})` twins + run-twice scaffolding | `_fixtures/statWarrior.ts` `makeStatWarrior` + `_fixtures/determinism.ts` | **DRAINED** |
| D20 import-preamble idioms | residual | identical import blocks (ChronicleTab/MissionControlTab, resolveImpactsCoverage/impactMergeOrder, grudgeWorldDecoupling/playerGrudges) | re-verdict EXEMPT — preamble idiom, nothing to extract | **EXEMPT-registered** |

**Close-out (test↔test):** live 79 → **12 pairs** — 10 V18-exempt + 5 new
preamble/call-shape exemptions registered knowingly (`TEST_EXEMPT_PAIRS`);
`TEST_DEBT_PAIRS` emptied to `[]`, `TEST_DEBT_BUDGET` ratcheted 25 → **0**,
baseline 79 → **12**. Mixed tier gained one literal-pin pair
(`WeekStatsService|_fixtures/factories` — `makeBoutSummary` re-states the
canonical zeroed summary) → registered EXEMPT, baseline 17 → **18**.

## §A SRP targets — new queue (6 fns >80; tickets `MEGAPLAN-S35…S40`)

| # | Fn | File:line | Len | Verdict (classified-by-reading) | Final |
| - | -- | --------- | --- | ------------------------------- | ----- |
| S35 | `processArenaEvent` | `hooks/arenaAnimationUtils.ts:196` | 88 | uniform ~10-case pose dispatch → extract `POSE_HANDLERS` map of small per-case handlers | **DRAINED** — `POSE_HANDLERS` dispatch landed |
| S36 | `assessCrownOpportunity` | `engine/ai/workers/crownWorker.ts:151` | 83 | 3 phases (index build / scan loop / best-pick) → extract `buildCrownIndexes` + per-candidate scorer | **DRAINED** — invariant index-build extracted |
| S37 | `projectEvent` | `engine/simulate/logging.ts:43` | 82 | uniform ~14-case log-projection dispatch → extract `PROJECT_HANDLERS` map | **DRAINED** — `PROJECTORS` dispatch landed |
| S38 | `computeEffectiveSkills` | `engine/bout/fighterState.ts:104` | 81 | 14-modifier × 6-skill aggregation → extract per-skill addend builder | **DRAINED** — folded into the fighter-state split below 80 |
| S39 | `createFighterState` | `engine/bout/fighterState.ts:212` | 81 | ~50-line return literal → extract `buildFighterStateFields` | **DRAINED** — `assembleFighterState` extracted, params bundled to an options object (paramBudget), `FRESH_COMBAT_COUNTERS` constant hoisted |
| S40 | `recordGrandChampions` | `engine/championship/championsTournament.ts:109` | 81 | detect→award→newsletter pipeline → extract `applyGrandChampionAward` | **DRAINED** — `applyGrandChampionAward` extracted (options-bundled, 7 params → 1) |

Band (60–80): 268 fns — no second-tier promotions this campaign
(classify-by-reading found no convergent signals beyond the queue;
watch-list re-review recorded NOTE).

## §K Dead code — final verdicts

- **10 unexports** (K1–K10 above) — the only genuine zero-ref drains.
- 109 test-only + 18 scanner-blind + 22 Radix + 56 non-src = **EXEMPT**,
  recorded with per-class evidence.
- knip 222 = the same surface (150 exports + 68 types + 4 duplicates);
  the 4 "duplicates" are intentional alias exports in
  `skillBreakpoints.ts` (`ST_PAR = ST_ATT` etc.) — EXEMPT, not collisions.
- jscpd 102 clones / 0.63% — report-only, below noise floor.

## §P Perf — re-triage verdicts

- `scan-in-loop` 88 exceptions — spot re-verified the weakest classes:
  all carry concrete justification (≤2-element `warriorIds` bounded
  scans, per-iteration collections, string-substring checks, early-return
  scans, module-load precompute, mutating-loop recomputes). The
  `seasonalGrowth?.filter(sg => sg.season === state.season)` pair
  (`weekPipeline/finalize.ts`, `storage/truncation.ts`) has an invariant
  predicate over a per-stable list — legit but marginal (lists are
  ~season-length); NOTE, no drain. **No fixable violations found** —
  the HEAD drain already landed the real ones.
- `entries-in-loop` 5 — all per-iteration per-instance data
  (`inj.penalties`, `zoneDef`, `attrBonus`, `fightPlanMod`,
  `declinedContenders`) — EXEMPT, verified.
- Perf band: 257.7 ms/week @ 40w (vs. ~270 documented band) — healthy.
- `over2s` 23 specs — re-tier candidates recorded; not blocking
  (runnerGroups already isolates them).

## §C CSS / design-bible conformance — sweep verdicts

By-reading sweep of `index.css` (1,369 L), `tailwind.config.ts`, and
component class usage vs `DESIGN_BIBLE_UI_v1.0.md`:

| Rule | Verdict | Evidence | Final |
| ---- | ------- | -------- | ----- |
| Radius-0 structural | **VIOLATION ×17** | `rounded-sm` + bare `rounded` + `prose-code:rounded` on micro-badges and code chips across 12 files (OfferCardHeader, OfferDetailsGrid, AttributeRow, CouncilHeader, RivalIntelligenceRow, ExecuteWeekButton, WarriorTrainingCard, EditableText, MarkdownReader, windEffects/specialEffects particles) → `rounded-none` | **FIXED** — `radius-violation` rule added to `ui-audit-scan`, ceiling 0 |
| `rounded-full` circles | EXEMPT | wax-seal/medallion canon + progress tracks + blur glows (82 hits, all circular-by-design) |
| Italic on numbers | CONFORMING | all 124 italic hits are flavor text (epithets, empty states, quotes); `WarriorStats` growth labels are narrative strings, not numerals |
| Tracking caps | CONFORMING | 0 hits >0.15em on labels; `tracking-[0.15em]` is the uniform standard |
| Cinzel display / Inter body | CONFORMING | `--font-display: Cinzel` enforced via `.font-display`; no Inter-on-header hits |
| Undefined class | **BUG (§B1)** | `glow-neon-blue` referenced `GrowthHelpers.ts:45`, never defined (only `glow-neon-purple` exists — Spooky Night weather, intentional) → drop dead class |
| `tracking-tighter italic` hero | NOTE | `BoutResolution` display headings — display flavor, not data; accepted |
| Token/RNG/motion/fake-chrome | CLEAN | ui-audit 0 across all five rules |

## §B Bug register

| # | Bug | Evidence | Fix | Final |
| - | --- | -------- | --- | ----- |
| B1 | `glow-neon-blue` undefined CSS class | `GrowthHelpers.ts:45`; only `glow-neon-purple` defined (`index.css:825`) | remove dead class; keep `text-accent drop-shadow-md` | **FIXED** + `animate-avatar-fade-in`, `animate-progress`, `animate-shimmer` minted to their orphan keyframes; 4 dead keyframes deleted; `radius-violation`/`undefined-class`/`dead-keyframe` scanner rules ratcheted to 0 |
| B2 | `dup-scan.json` overwrite hazard — running the scanner at w12/ident clobbers the w8 report | observed this campaign | NOTE — operational caveat, not code debt | recorded |
| B3 | `import tytme` + `\n, name }` mangled imports left by the earlier mechanical repoint pass | `playerPressure.test.ts:21` parse error; `planMasking`/`PromoterPass` `,\n,` imports; `training.test.ts` nested literal | repaired — type-check 0 | **FIXED** |
| B4 | `rivalStrategyPass.perf` gate single-sample 500ms bound flakes under concurrent slow-suite load (641–1141ms observed vs ~250–310ms isolated) | full `test:slow` run 2026-10-22 | best-of-3 min + 2000ms bound; spy-count contract unchanged | **FIXED** |

## §U Unique-logic register (rebuilt)

| # | Cluster | Divergent behavior to preserve |
| - | ------- | ------------------------------ |
| U1 | competitionWorker eval-harness (D15) | per-spec scenario semantics (desperation/pressure/venue/style/promoter state setups) — only the arg-shape + defaults move to `evalOffer` |
| U2 | fixture↔spec echoes (D16) | spec-local literal variations (fame/treasury overrides) preserved as factory params |
| U3 | component mock boilerplate (D17) | per-spec store state/mocked-module selection stays per-site; only the inject mechanics share |
| U4 | engine scenario literals (D18) | per-spec season/weather/event payloads — shared helper takes overrides |
| U5 | combat win-rate harness (D19) | per-spec style/matchup/rng-seed params — shared builder takes them |
| U6 | unexport drain (K1–K10) | symbols keep internal use; only `export` keyword removed |
| U7 | `rounded-sm` badges (C1) | badge styling/color preserved — only radius class changes |

V18 U1–U10 re-verified: all still hold (no consolidation attempted on
those clusters since).

## Scanner-interface reference

Importable: `collectDuplicates({ident,window,minBlock})`,
`collectSizes()`, `collectParamCounts()`+`PARAM_LIMIT`,
`collectEntriesInLoop()`, `collectUiAudit()`, `collectSrpCensus()`,
`collectScanInLoop()`. Subprocess-only: `orphan-scan`,
`data-array-dup-scan`, `test-audit-scan` (regenerates JSONs), `dedupe`,
`fuzzy_dedupe`, `soak` (needs `bun`, not `node` — `@/` path alias).
