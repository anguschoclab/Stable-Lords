# Orphan Report — Stable Lords

**Generated:** 2026-11-09 · **Source:** `scripts/orphan-scan.mjs` + this generator (`scripts/orphan-report.mjs`)
**Scope:** all flagged `src/` exports + unreachable files + nav-hidden routes
**Purpose:** product-owner triage — decide **integrate** (wire it in), **delete**, or **keep** per orphan.

> **Ratchet status:** 173 src-scoped dead exports — under the 173 ratchet — guard green.

## Uniqueness tags

- 🟣 **UNIQUE** — the only implementation of this behavior in the repo; deleting permanently removes capability (or a pinned spec of it).
- 🔵 **DUPLICATE** — functionally equivalent logic ships elsewhere.
- ⚪ **PASS-THROUGH** — pure re-export/config surface; contains no logic.

## ⚠️ UNTRIAGED — new orphans since last annotation pass

Flagged by the latest scan with no curated entry in `orphan-report.mjs` `ANNOTATIONS`. Triage these first, then record the verdict there.

| Symbol | File | Evidence |
| --- | --- | --- |
| `HUBS` | src/components/layout/LeftNav.tsx | re-export with no local declaration — add ANNOTATIONS verdict |
| `planTournamentEntries` | src/engine/ai/workers/tournamentWorker.ts | test-only symbol with no internal use — lifecycle hook? |
| `updateWarriorFromBoutOutcome` | src/engine/warrior/careerUpdate.ts | test-only symbol with no internal use — lifecycle hook? |

## Duplication — alternate flows sharing an orphan's name

The same symbol name is declared in other production files. `@score` is token-level body similarity: **identical** ≥0.9 (true duplicate — delete loses nothing), **divergent** 0.3–0.9 (alternate flow — the orphan carries its own semantics), **distinct** <0.3 (name collision only).

| Symbol | Orphan file | Class | Alternate flow(s) |
| --- | --- | --- | --- |
| `WarriorRadarChart` | `src/components/charts/WarriorRadarChart.tsx` | D-lazy | `src/components/WarriorDossier.tsx` @0.19 **distinct**<br>`src/components/warrior/BiometricsTab.tsx` @0.19 **distinct** |
| `HUBS` | `src/components/layout/LeftNav.tsx` | untriaged | `src/components/layout/navigationHubs.ts` @0 **distinct** |
| `HubId` | `src/components/layout/LeftNav.tsx` | C | `src/components/layout/AlertStrip.tsx` @1 **identical**<br>`src/components/layout/HubSwitcher.tsx` @1 **identical**<br>`src/components/layout/MobileNav.tsx` @1 **identical**<br>`src/components/layout/SubPageList.tsx` @1 **identical**<br>`src/components/layout/navigationHubs.ts` @0.22 **distinct** |
| `RhythmBand` | `src/engine/ai/plan/strategyLab.ts` | B | `src/components/warrior/favorites/FavoritesCharting.tsx` @0.08 **distinct** |
| `extractWeekSummary` | `src/engine/autosim/autosim.ts` | C | `src/engine/pipeline/tick/timeAdvance/summaries.ts` @0.3 **distinct** |
| `TOURNAMENT_TIERS` | `src/engine/matchmaking/tournamentSelection.ts` | A | `src/engine/matchmaking/tournamentSelection/core.ts` @0 **distinct** |
| `ArchiveConflictError` | `src/engine/storage/electronArchive.ts` | keep | `src/engine/storage/ArchiveConflictError.ts` @0 **distinct** |
| `updateWarriorAfterBout` | `src/engine/warrior/careerUpdate.ts` | A | `src/engine/bout/warriorStateUpdater.ts` @0.32 **divergent** |
| `computeHP` | `src/engine/warrior/skillCalc.ts` | C | `src/data/terrabloodCharts.ts` @0.13 **distinct** |
| `stableStats` | `src/hooks/useScoutingStableComparison.ts` | C | `src/pages/arenaHub/useArenaHubData.ts` @0.2 **distinct** |

## Section A — Genuine orphans: integrate or delete

### `TOURNAMENT_TIERS` — redundant re-export ⚪ **PASS-THROUGH**

- **File:** `src/engine/matchmaking/tournamentSelection.ts`
- **Uniqueness:** zero code — a one-line re-export of the constant in
  `./tournamentSelection/core`; the real consumer
  (`engine/advisor/tournamentAdvisor.ts`) deep-imports from `core` anyway.
  **Recommendation:** **delete the re-export** (1 line) or route the
  advisor through it — either direction is cheap.

### `updateWarriorAfterBout` — legacy post-bout updater 🟣 **UNIQUE** *(superseded semantics)*

- **File:** `src/engine/warrior/careerUpdate.ts`
- **What it is:** A "legacy-compatible function matching the signature of the
  original `updateWarriorAfterBout`" (its own docstring). Wraps
  `calculateCareerUpdate` + `applyCareerUpdate` + `flashyFlair`.
  **Uniqueness:** not a pure duplicate — compared to the live
  `warriorStateUpdater.ts` twin (`wasKilled` = killer, fatigue resets for the
  killer, caller-computed fame deltas), this path treats `wasKilled` as the
  *victim* (`isVictim` → `status: 'Dead'`, fatigue resets for the dead),
  auto-computes fame +1 win/+3 kill, rolls epithet for any non-victim, and
  overwrites `status` — semantics the current bout model deliberately moved
  out (death status lives in `mortalityHandler`).
  **Why orphaned:** production uses `warriorStateUpdater.ts` (via
  `recordHandler.ts`) and `updateWarriorFromBoutOutcome` for tournaments;
  only `src/test/engine/warrior/careerUpdate.test.ts` calls this wrapper.
  **Recommendation:** **delete** — two same-named functions with divergent
  semantics in neighboring modules is a footgun, not a fallback.

### `clamp01` — unused clamp-to-[0,1] helper 🟣 **UNIQUE** *(trivial)*

- **File:** `src/utils/math.ts`
- **Uniqueness:** sole *shared* implementation, but the behavior already
  exists inline at 3 production sites (`AudioManager.ts` ×2,
  `economy/weeklyBreakdown.ts`) using `Math.min(1, Math.max(0, …))`.
  **Recommendation:** **delete or integrate** — either drop it or migrate
  the 3 inline sites so it stops flagging.

### `lerp` — unused linear-interpolation helper 🟣 **UNIQUE** *(trivial)*

- **File:** `src/utils/math.ts`
- **Uniqueness:** the only `lerp` implementation — called solely by
  `mapRange` (also orphaned) and tests. **Recommendation:** **delete**
  (~15 lines + spec).

### `mapRange` — unused range-remap helper 🟣 **UNIQUE** *(trivial)*

- **File:** `src/utils/math.ts`
- **Uniqueness:** the only `mapRange` implementation — called solely by
  tests. **Recommendation:** **delete** (~15 lines + spec).

### Test-only lifecycle hooks 🟣 **UNIQUE** *(test infra — keep)*

The only reset paths for module-level state between tests — product-dead but test-alive; deleting them breaks test isolation.

| Symbol | File | Verdict |
| --- | --- | --- |
| `resetArenaRegistry` | `src/data/arenas/index.ts` | The only reset path for the arena data-registry singleton — product-dead
  but test-alive; deleting it breaks test isolation. **Recommendation:**
  **keep** (a `_test` suffix convention would document intent). |
| `clearDeathHandlers` | `src/engine/core/deathNotifier.ts` | The only reset path for the `onWarriorDeath` listener registry —
  product-dead but test-alive. **Recommendation:** **keep**. |
| `clearHistoryResolverCaches` | `src/engine/core/historyResolver.ts` | The only reset path for the name/stable resolution caches —
  product-dead but test-alive. **Recommendation:** **keep**. |
| `ArchiveConflictError` | `src/engine/storage/electronArchive.ts` | Re-export of `ArchiveConflictError` (declared in `./ArchiveConflictError`)
  — the thrown conflict type for the save-archive service, consumed by
  `scripts/nodeArchiveService.ts` and archive tests. The class itself is
  unique; this line is just its public doorway. **Recommendation:** **keep**
  — deleting forces consumers onto a deep import. |

## Section B — Over-exports: zero external references (unexport candidates)

All 🟣 **unique code that is already live** — used inside its own module by live siblings — but no file outside references it, not even tests. The code stays; only the `export` keyword goes. (Typecheck after; TS4058 may force a keep on types in live signatures.)

| Symbol(s) | File | Notes |
| --- | --- | --- |
| `RhythmBand` | `src/engine/ai/plan/strategyLab.ts` | banding helpers for the strategy-memory grid — used by `recordPlanOutcome`, `pickStrategyTarget` |
| `bandOf` | `src/engine/ai/plan/strategyLab.ts` | banding helpers for the strategy-memory grid — used by `recordPlanOutcome`, `pickStrategyTarget` |
| `cellKey` | `src/engine/ai/plan/strategyLab.ts` | banding helpers for the strategy-memory grid — used by `recordPlanOutcome`, `pickStrategyTarget` |
| `StrategyTarget` | `src/engine/ai/plan/strategyLab.ts` | banding helpers for the strategy-memory grid — used by `recordPlanOutcome`, `pickStrategyTarget` |
| `DesignReviewItem` | `src/engine/warrior/designReview.ts` | internal row type — used by `reviewWarriorDesign` (~22 uses) |

## Section C — Test-visible exports: live code, no action needed

Every symbol below **runs in production** — called inside its own module by a live sibling. The `export` exists so unit/guard tests can pin internals directly (documented house pattern — see the ratchet comments in `orphanScan.guard.slow.test.ts`).

### UI, hooks & state (10)

| Symbol(s) | File | Live via (internal caller) | Alt-flow |
| --- | --- | --- | --- |
| `HubId` | `src/components/layout/LeftNav.tsx` | LeftNav | identical |
| `PRIMARY_CTA_BY_ROUTE` | `src/components/layout/primaryCta.ts` | resolvePrimaryCta, resolvePrimaryCtaKey | — |
| `buildFavoritesChart` | `src/components/warrior/favorites/FavoritesCharting.tsx` | FavoritesCharting | — |
| `stableStats` | `src/hooks/useScoutingStableComparison.ts` | useStableComparison | distinct |
| `A11Y_KEY` | `src/lib/a11yPrefs.ts` | loadA11yPrefs, saveA11yPrefs | — |
| `SfxType *(type)*` | `src/lib/AudioManager.ts` | AudioManager | — |
| `AudioManager` | `src/lib/AudioManager.ts` | module scope | — |
| `BIBLE_DOCS` | `src/lib/bibleIndex.ts` | BIBLE_SECTIONS | — |
| `BookmarkRow *(type)*` | `src/pages/bookmarks/groupBookmarks.ts` | BookmarkGroups, resolveBookmarkRow | — |
| `bookmarkKeySet` | `src/state/slices/bookmarksSlice.ts` | createBookmarksSlice | — |

### Data & schemas (16)

| Symbol(s) | File | Live via (internal caller) | Alt-flow |
| --- | --- | --- | --- |
| `STYLE_CLASSIC_WEAPONS` | `src/data/equipment/equipment.utils.ts` | getStyleDefaultLoadout, getClassicWeaponBonus | — |
| `ALL_STYLES` | `src/data/equipment/weaponStyles.ts` | without | — |
| `scaleToAttributeBudget` | `src/data/fighterConcepts.ts` | concept | — |
| `WinningFamily *(type)*` | `src/data/warriorArchetypes.ts` | ArchetypeGuide | — |
| `ArchetypeDesignBars *(type)*` | `src/data/warriorArchetypes.ts` | ArchetypeGuide, barRatio | — |
| `ArchetypeStrategy *(type)*` | `src/data/warriorArchetypes.ts` | ArchetypeGuide | — |
| `ArchetypeGuide *(type)*` | `src/data/warriorArchetypes.ts` | styleFit, classifyArchetype | — |
| `ArchetypeFit *(type)*` | `src/data/warriorArchetypes.ts` | classifyArchetype | — |
| `AIStrategySchema` | `src/schemas/economySchemas.ts` | RivalStableDataSchema | — |
| `AIEventSchema` | `src/schemas/economySchemas.ts` | RivalStableDataSchema | — |
| `AIAgentMemorySchema` | `src/schemas/economySchemas.ts` | RivalStableDataSchema | — |
| `AttributesSchema` | `src/schemas/warriorSchemas.ts` | WarriorSchema, PoolWarriorSchema | — |
| `BaseSkillsSchema` | `src/schemas/warriorSchemas.ts` | WarriorSchema, PoolWarriorSchema | — |
| `InjuryDataSchema` | `src/schemas/warriorSchemas.ts` | WarriorSchema | — |
| `PlanConditionSchema` | `src/schemas/warriorSchemas.ts` | FightPlanSchema | — |
| `FightPlanSchema` | `src/schemas/warriorSchemas.ts` | WarriorSchema | — |

### AI decisioning (20)

| Symbol(s) | File | Live via (internal caller) | Alt-flow |
| --- | --- | --- | --- |
| `COMPETENCE_QUALITY` | `src/engine/ai/competence.ts` | competenceQuality | — |
| `competenceOf` | `src/engine/ai/competence.ts` | competenceQuality | — |
| `pickWeeklyIntent` | `src/engine/ai/intentEngine/index.ts` | updateAIStrategy | — |
| `BoutIntentInput *(type)*` | `src/engine/ai/intentStates.ts` | module scope | — |
| `deriveBoutIntent` | `src/engine/ai/intentStates.ts` | BoutIntent, evaluateBoutIntent | — |
| `isPoachingEnabled` | `src/engine/ai/market/poachBid.ts` | computePoachBid, processPoachMarket | — |
| `seasonIndexFor` | `src/engine/ai/market/poachBid.ts` | processPoachMarket | — |
| `computePoachBid` | `src/engine/ai/market/poachBid.ts` | processPoachMarket, SettleAIPoachArgs | — |
| `DOSSIER_CAP` | `src/engine/ai/memory/intelDossier.ts` | pruneDossiers | — |
| `decayDossiers` | `src/engine/ai/memory/intelDossier.ts` | updateDossiers | — |
| `agentPlanForWarrior` | `src/engine/ai/plan/agentPlan.ts` | persistNPCPlans | — |
| `retireChanceFor` | `src/engine/ai/seasonalRetirementService.ts` | SeasonalRetirementService | — |
| `TRAIT_POLICY` | `src/engine/ai/traitPolicy.ts` | policyFor | — |
| `WEATHER_AI_DISPOSITION` | `src/engine/ai/weatherSuitability.ts` | HAZARDOUS_WEATHER, acceptanceWeatherBlock, offerWeatherDecline, committeeWeatherSkip, weatherBidModifier | — |
| `projectCashFlow` | `src/engine/ai/workers/budgetWorker.ts` | checkBudget | — |
| `learningSeekBonus` | `src/engine/ai/workers/competitionWorker/boutBidding/conversion.ts` | pickBestCandidate | — |
| `NegotiationOutcome *(type)*` | `src/engine/ai/workers/competitionWorker/negotiation.ts` | resolveSecondRound | — |
| `walkAwayTolerance` | `src/engine/ai/workers/competitionWorker/negotiation.ts` | resolveSecondRound | — |
| `assessCrownOpportunity` | `src/engine/ai/workers/crownWorker.ts` | processCrownPosture | — |
| `preferredTrainerFocus` | `src/engine/ai/workers/staffWorker.ts` | tryHireTrainer | — |

### Engine core & services (34)

| Symbol(s) | File | Live via (internal caller) | Alt-flow |
| --- | --- | --- | --- |
| `processPlayerOffers` | `src/engine/autosim/autosim.ts` | runAutosim | — |
| `extractWeekSummary` | `src/engine/autosim/autosim.ts` | runAutosim | distinct |
| `seedForEntity` | `src/engine/avatar/avatarGenerator.ts` | generateAvatar | — |
| `wearScore` | `src/engine/avatar/avatarGenerator.ts` | avatarDescription, generateAvatarFromCatalog | — |
| `avatarDescription` | `src/engine/avatar/avatarGenerator.ts` | generateAvatarFromCatalog | — |
| `clothingCategoryForStyle` | `src/engine/avatar/avatarGenerator.ts` | generateAvatarFromCatalog | — |
| `resolveAbsoluteWeek` | `src/engine/core/absoluteWeek.ts` | boutOfferAbsoluteWeek, boutOfferExpirationAbsoluteWeek | — |
| `FATIGUE_FRESH` | `src/engine/core/fatigueUtils.ts` | getFatigueBand, isFatigued | — |
| `FATIGUE_ELEVATED` | `src/engine/core/fatigueUtils.ts` | getFatigueBand, isExhausted | — |
| `ArenaLeaderboardEntry *(type)*` | `src/engine/core/leaderboards.ts` | collectActiveWarriorEntries, calculateGlobalFameLeaderboard | — |
| `ArenaWarriorEntry *(type)*` | `src/engine/core/leaderboards.ts` | ArenaLeaderboardData, cmpWarriors, cmpKillers, buildEntry, buildArenaLeaderboard, calculateArenaStyleLeaders | — |
| `ArenaLeaderboardData *(type)*` | `src/engine/core/leaderboards.ts` | buildArenaLeaderboard, calculateArenaLeaderboard | — |
| `ArenaStableEntry *(type)*` | `src/engine/core/leaderboards.ts` | calculateArenaStableStandings | — |
| `BEAST_PATHS` | `src/engine/crest/chargePaths.ts` | getChargePathsByType | — |
| `WEAPON_PATHS` | `src/engine/crest/chargePaths.ts` | getChargePathsByType | — |
| `SYMBOL_PATHS` | `src/engine/crest/chargePaths.ts` | getChargePathsByType | — |
| `NATURE_PATHS` | `src/engine/crest/chargePaths.ts` | getChargePathsByType | — |
| `CELESTIAL_PATHS` | `src/engine/crest/chargePaths.ts` | getChargePathsByType | — |
| `MYTHICAL_PATHS` | `src/engine/crest/chargePaths.ts` | getChargePathsByType | — |
| `getCrestColor` | `src/engine/crest/crestGenerator.ts` | selectColors | — |
| `GearRecommendation *(type)*` | `src/engine/equipment/equipmentOptimizer.ts` | generateRecommendations | — |
| `weaponFitScore` | `src/engine/equipment/loadoutFitting.ts` | fitWeapon | — |
| `fitWeapon` | `src/engine/equipment/loadoutFitting.ts` | getFittedLoadout, refitWeapon | — |
| `WEAPON_STYLE_SUITABILITY` | `src/engine/equipment/weaponSuitability.ts` | getWeaponSuitability | — |
| `FightAnalysisContext *(type)*` | `src/engine/gazette/gazetteDetections.ts` | computeFightAnalysis, detectRivalryMatchup, detectHotStreakers | — |
| `DEFAULT_CROWD_MOOD` | `src/engine/gazette/gazetteTemplateHelpers.ts` | resolveCrowdMood | — |
| `BoutEndContext *(type)*` | `src/engine/narrative/narrativePostBout.ts` | NarrateBoutEndArgs | — |
| `addStat` | `src/engine/pipeline/offseasonEvents/helpers.ts` | statGrantOutcome | — |
| `StatGrantOutcomeOpts *(type)*` | `src/engine/pipeline/offseasonEvents/helpers.ts` | statGrantOutcome | — |
| `HONOR_DOWN_CHALLENGE_MARGIN` | `src/engine/politics/honorCulture.ts` | isDownChallenge | — |
| `TRUNCATION_CAPS` | `src/engine/storage/truncation.ts` | ResolvedCaps, truncateState | — |
| `defaultSpecialtyMods` | `src/engine/trainers/trainerSpecialties.ts` | getSpecialtyMods | — |
| `validateArenaChampions` | `src/engine/validate/stateInvariants.ts` | validateStateInvariants | — |
| `SEASONAL_WEATHER` | `src/engine/weather/seasonalWeather.ts` | rollWeather | — |

### Combat & bout (16)

| Symbol(s) | File | Live via (internal caller) | Alt-flow |
| --- | --- | --- | --- |
| `getNPCPlan` | `src/engine/bout/services/boutResolution.ts` | runBoutSimulation | — |
| `STYLE_PRESETS` | `src/engine/bout/stylePresets.ts` | getStylePresets, defaultStylePreset | — |
| `derivePsychState` | `src/engine/combat/mechanics/conditionEngine.ts` | conditionMet, evaluateConditions | — |
| `ArenaSizeProfile *(type)*` | `src/engine/combat/mechanics/distanceResolution.ts` | ContestDistanceArgs | — |
| `WEAPON_PREFERRED_RANGE` | `src/engine/combat/mechanics/distanceResolution.ts` | getWeaponPreferredRange | — |
| `WEAPON_RANGE_MODIFIERS` | `src/engine/combat/mechanics/distanceResolution.ts` | getWeaponRangeMod | — |
| `computeReachScore` | `src/engine/combat/mechanics/distanceResolution.ts` | contestDistance | — |
| `clampRangeToMax` | `src/engine/combat/mechanics/distanceResolution.ts` | contestDistance | — |
| `willCheckChance` | `src/engine/combat/mechanics/willChecks.ts` | rollWillCheck | — |
| `applyDecoyMask` | `src/engine/combat/resolution/decoyShift.ts` | resolveDecoyMasks | — |
| `emitDecoyReveal` | `src/engine/combat/resolution/decoyShift.ts` | resolveDecoyMasks | — |
| `rollDisarmChance` | `src/engine/combat/resolution/disarm.ts` | tryDisarm | — |
| `isArmLocation` | `src/engine/combat/resolution/disarm.ts` | tryDisarm | — |
| `RECOVERY_ACTIVITY_CAP` | `src/engine/combat/resolution/exchangeHelpers/mechanics/enduranceRecovery.ts` | applyEnduranceRecovery | — |
| `RECOVERY_PER_BEAT` | `src/engine/combat/resolution/exchangeHelpers/mechanics/enduranceRecovery.ts` | applyEnduranceRecovery | — |
| `isVeryHighlyCoordinated` | `src/engine/combat/resolution/offhandAttack.ts` | tryOffhandAttack | — |

### Matchmaking, scouting & reputation (14)

| Symbol(s) | File | Live via (internal caller) | Alt-flow |
| --- | --- | --- | --- |
| `selectGrandChampionshipField` | `src/engine/championship/championsTournament.ts` | buildChampionsTournament | — |
| `scoreArenaFitForWarrior` | `src/engine/matchmaking/arenaFit.ts` | selectArenaForMatchup | — |
| `eligibleArenasFor` | `src/engine/matchmaking/arenaFit.ts` | matchupArenas | — |
| `BLOODFEUD_TURNS` | `src/engine/matchmaking/bloodfeud.ts` | bloodfeudMarksFromOutcome | — |
| `getEligibleArenasForTournament` | `src/engine/matchmaking/tournament/tournamentArenaSelection.ts` | selectArenaForTournamentBout | — |
| `lowerBound` | `src/engine/promoters/offerMatchmaking.ts` | findBestOpponent | — |
| `upperBound` | `src/engine/promoters/offerMatchmaking.ts` | findBestOpponent | — |
| `createStyleInsight` | `src/engine/scouting/scoutInsights.ts` | generateScoutInsights | — |
| `createAttributeInsights` | `src/engine/scouting/scoutInsights.ts` | generateScoutInsights | — |
| `createTacticInsight` | `src/engine/scouting/scoutInsights.ts` | generateScoutInsights | — |
| `createTraitInsights` | `src/engine/scouting/scoutInsights.ts` | generateScoutInsights | — |
| `StableReputation *(type)*` | `src/engine/stable/stableReputation.ts` | module scope | — |
| `getTopFameWarriors` | `src/engine/stable/stableReputation.ts` | calculateFame, computeRivalReputation | — |
| `computeFameScore` | `src/engine/stable/stableReputation.ts` | calculateFame | — |

### Warrior & training (10)

| Symbol(s) | File | Live via (internal caller) | Alt-flow |
| --- | --- | --- | --- |
| `generateRecruitAttrs` | `src/engine/owner/roster/recruitGenerator.ts` | generateAIRecruit | — |
| `CareerUpdateInput *(type)*` | `src/engine/warrior/careerUpdate.ts` | calculateCareerUpdate, updateWarriorAfterBout, updateWarriorFromBoutOutcome | — |
| `calculateCareerUpdate` | `src/engine/warrior/careerUpdate.ts` | updateWarriorAfterBout, updateWarriorFromBoutOutcome | — |
| `applyCareerUpdate` | `src/engine/warrior/careerUpdate.ts` | updateWarriorAfterBout, updateWarriorFromBoutOutcome | — |
| `DesignAxis *(type)*` | `src/engine/warrior/designReview.ts` | DesignReviewItem | — |
| `Handedness *(type)*` | `src/engine/warrior/skillCalc.ts` | computeBaseSkills | — |
| `computeHP` | `src/engine/warrior/skillCalc.ts` | computeDerivedStats | distinct |
| `computeEndurance` | `src/engine/warrior/skillCalc.ts` | computeDerivedStats | — |
| `computeDamage` | `src/engine/warrior/skillCalc.ts` | computeDerivedStats | — |
| `computeDerivedStats` | `src/engine/warrior/skillCalc.ts` | computeWarriorStats | — |

## Section D — Scanner blind spots: live, no action

### D1. Lazy-loaded modules — false positives

Consumed via `React.lazy(() => import(...))`; the scanner sees the file edge but cannot attribute a named consumer.

| Export | File |
| --- | --- |
| `WEATHER_VISUALS` | `src/components/arena/weather/index.tsx` |
| `WarriorRadarChart` | `src/components/charts/WarriorRadarChart.tsx` |
| `default` | `src/components/ResolutionReveal.tsx` |
| `BACKSTORIES` | `src/data/backstories.ts` |
| `OrphanWarrior` | `src/data/orphanPool.ts` |
| `SEASON_OBJECTIVE_WEEKS` | `src/engine/ai/plan/seasonPlan.ts` |
| `pickSeasonObjective` | `src/engine/ai/plan/seasonPlan.ts` |
| `createDefaultMeta` | `src/engine/analytics/metaDrift.ts` |
| `EVENT_HANDLERS` | `src/engine/pipeline/seasonal.ts` |
| `ShardWorkerApi` | `src/engine/pool/enginePool.ts` |
| `createEnginePool` | `src/engine/pool/enginePool.ts` |
| `traitTrainingCeiling` | `src/engine/training/trainingGains/traitTraining.ts` |
| `conflictsWith` | `src/engine/training/trainingGains/traitTraining.ts` |
| `default` | `src/pages/StartGame.tsx` |

### D2. Ambient declaration files

- `src/types/global.d.ts` — global/ambient types; never imported *by design* (allowlisted in the guard).
- `src/vite-env.d.ts` — global/ambient types; never imported *by design* (allowlisted in the guard).

### D3. shadcn/ui component-library surface

Generated-library exports — the components ship their full part API even when parts are unused. Not product features.

| Export | File |
| --- | --- |
| `AlertDialogPortal` | `src/components/ui/alert-dialog.tsx` |
| `AlertDialogOverlay` | `src/components/ui/alert-dialog.tsx` |
| `AlertDialogTrigger` | `src/components/ui/alert-dialog.tsx` |
| `ChartLegend` | `src/components/ui/chart.tsx` |
| `ChartLegendContent` | `src/components/ui/chart.tsx` |
| `DialogPortal` | `src/components/ui/dialog.tsx` |
| `DialogOverlay` | `src/components/ui/dialog.tsx` |
| `DialogClose` | `src/components/ui/dialog.tsx` |
| `DialogTrigger` | `src/components/ui/dialog.tsx` |
| `DialogHeader` | `src/components/ui/dialog.tsx` |
| `DialogFooter` | `src/components/ui/dialog.tsx` |
| `ScrollBar` | `src/components/ui/scroll-area.tsx` |
| `SelectGroup` | `src/components/ui/select.tsx` |
| `SelectLabel` | `src/components/ui/select.tsx` |
| `SelectSeparator` | `src/components/ui/select.tsx` |
| `SelectScrollUpButton` | `src/components/ui/select.tsx` |
| `SelectScrollDownButton` | `src/components/ui/select.tsx` |
| `SheetPortal` | `src/components/ui/sheet.tsx` |
| `SheetOverlay` | `src/components/ui/sheet.tsx` |
| `SheetFooter` | `src/components/ui/sheet.tsx` |
| `TableFooter` | `src/components/ui/table.tsx` |
| `TableCaption` | `src/components/ui/table.tsx` |

### D4. Nav-hidden routes — intentional deep links

- `/` (`src/routes/index.tsx`) — detail page reached by in-game navigation, not static nav.
- `/stable/promoter.:id` (`src/routes/stable/promoter.$id.tsx`) — detail page reached by in-game navigation, not static nav.
- `/warrior/:id` (`src/routes/warrior/$id.tsx`) — detail page reached by in-game navigation, not static nav.
- `/world/arenas.:arenaId` (`src/routes/world/arenas.$arenaId.tsx`) — detail page reached by in-game navigation, not static nav.
- `/world/stable/:id` (`src/routes/world/stable/$id.tsx`) — detail page reached by in-game navigation, not static nav.

## Decision summary

| Decision | Items | Unique code at stake |
| --- | --- | --- |
| **Delete / integrate** | 5 curated item(s) + **3 UNTRIAGED** | see per-item tags above |
| **Unexport** | 5 export(s) | 🟣 stays — code is live, only `export` goes |
| **Keep** | 4 test-reset hook(s); 120 test-visible export(s); 36 blind spots | all unique, all live-or-test-infra |
| **Guard hygiene** | ratchet: 173 / 173 | — |
| **Duplication** | 10 orphan(s) with same-name alternate flow(s) | 1 identical · 1 divergent · 8 distinct |

*Regenerate with `node scripts/orphan-scan.mjs` (or `node scripts/orphan-report.mjs` against the last JSON). Curated verdicts live in `ANNOTATIONS` at the top of `scripts/orphan-report.mjs`.*
