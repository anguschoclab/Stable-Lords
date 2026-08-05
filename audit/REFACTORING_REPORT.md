# SRP/DRY Refactoring Report

## Branch
`refactor/srp-dry-audit`

## Summary

This refactoring pass applied Single Responsibility Principle (SRP) and DRY (Don't Repeat Yourself) improvements across the Stable Lords codebase. All changes maintain type safety, deterministic behavior, and zero regressions.

## Validation Results

| Check | Status |
|---|---|
| `bunx tsc --noEmit` | 0 errors |
| `npx vitest run` | 457 test files, 5837 tests, 0 failures |
| `bun run narrative-validate` | Pass |
| `npx eslint .` | 0 errors (pre-existing warnings only) |
| `npx vite build` | Success (7.1s) |
| Characterization tests | 141/141 pass |
| Circular dependencies | 0 (3 found and fixed) |

## Changes by Phase

### Phase 0: Baseline & Characterization Tests

Created 5 characterization test suites (141 tests total):
- `src/test/engine/pipeline/offseasonDeterminism.test.ts` — 92 tests (10 seeds × 46 events)
- `src/test/engine/combat/resolutionDeterminism.test.ts` — 7 tests (20 seeds)
- `src/test/engine/traits/traitsCharacterization.test.ts` — 8 tests (50 seeds)
- `src/test/schemas/schemaCharacterization.test.ts` — 27 tests
- `src/test/utils/buildWarriorMapDivergence.test.ts` — 7 tests

### Phase 1: Audit

- `audit/MASTER_FINDINGS.md` — comprehensive findings catalog
- `audit/baseline-snapshot.json` — baseline metrics

### Phase 2: Implementation

#### Step 2.1: Consolidate Existing Overlapping Utilities
- Consolidated `warriorCollection.ts` / `roster.ts` / `buildWarriorMap` divergent implementations
- Unified to shared `src/utils/warriorCollection.ts` with re-exports for backward compatibility

#### Step 2.2: Replace Seasonal.ts Local Duplicates
- Extracted 46 offseason event handlers from `seasonal.ts` (1696 lines) to `seasonalHandlers.ts` (1498 lines)
- `seasonal.ts` reduced to 178 lines (orchestrator only)

#### Step 2.3: Create Genuinely Missing Utilities

| Utility | File | Replaces |
|---|---|---|
| `formatWeek` | `src/utils/format.ts` | Inline `Week ${week}, Season ${season}` in rosterSlice, mortalityHandler |
| `formatDateOfDeath` | `src/utils/format.ts` | Inline date formatting in bout/mortalityHandler |
| `makeInjury` | `src/engine/injuries/utils.ts` | Local `makeInjury` in seasonalHandlers.ts |
| `makeInsightToken` | `src/engine/core/eventHelpers.ts` | 11+ inline `ctx.insightTokens.push({...})` blocks in seasonalHandlers.ts |
| `clamp` | `src/utils/math.ts` (existing) | Inline `Math.min(Math.max(...))` in economy.ts |

#### Step 2.4: Decompose Monolithic Modules

| Source File | Before | After | Extracted To |
|---|---|---|---|
| `src/engine/scouting.ts` | 343 lines | 237 lines | `src/engine/scoutInsights.ts` (125 lines) |
| `src/engine/combat/mechanics/weatherEffects.ts` | 531 lines | 444 lines | `src/engine/combat/mechanics/weatherOpeningLines.ts` (95 lines) |
| `src/engine/traits.ts` | 992 lines | ~100 lines | `src/engine/traitDefs.ts` (771), `src/engine/traitGeneration.ts` (81), `src/engine/traitMods.ts` (133) |
| `src/engine/combat/resolution/resolution.ts` | ~1100 lines | ~190 lines | `src/engine/combat/resolution/exchangePrep.ts` (191), `src/engine/combat/resolution/styleRiposteBonus.ts` (61) |
| `src/engine/combat/resolution/phaseResolvers.ts` | 569 lines | 11 lines | `src/engine/combat/resolution/initiativePhase.ts` (106), `src/engine/combat/resolution/offenseDefense.ts` (438) |
| `src/schemas/gameStateSchema.ts` | ~1500 lines | ~140 lines | `src/schemas/schemaEnums.ts` (440), `src/schemas/schemaObjects.ts` (880) → `src/schemas/warriorSchemas.ts` (378), `src/schemas/fightSchemas.ts` (347), `src/schemas/economySchemas.ts` (377) |
| `src/components/arena/weather/effects.tsx` | 995 lines | deleted | `src/components/arena/weather/effects/` (8 themed files + barrel index) |
| `src/engine/narrative/loreGenerator.ts` | 425 lines | 31 lines | `src/engine/narrative/lore/loreData.ts` (407 lines) |
| `src/engine/skillCalc.ts` | 472 lines | 213 lines | `src/engine/skillBreakpoints.ts` (260 lines) |
| `src/engine/ai/workers/rosterWorker.ts` | 441 lines | 185 lines | `src/engine/ai/workers/rosterWorkerTraining.ts` (246), `src/engine/ai/workers/rosterWorkerEquipment.ts` (42) |
| `src/engine/bout/services/boutProcessorService.ts` | 410 lines | 80 lines | `src/engine/bout/services/boutProcessorTypes.ts` (59), `src/engine/bout/services/boutResolution.ts` (278) |

All extracted modules use re-exports for backward compatibility.

#### Step 2.4b: DRY Fixes in Remaining Files
- **`schedulingAssistant.ts`**: Extracted `buildMatchupScore` helper to eliminate duplicated `MatchupScore` construction in `getRecommendedChallenges` and `getMatchupsToAvoid` (368→323 lines)

#### Step 2.5: Resolve Mixed-Responsibility Functions
- Replaced 11+ inline `ctx.insightTokens.push({...})` blocks with `makeInsightToken()` calls
- Replaced inline date formatting with `formatWeek()` / `formatDateOfDeath()`
- Replaced inline clamp pattern with `clamp()` utility

#### Step 2.6: Fix Layering & Dependency Issues
- **Removed dead exports**: `OFFSEASON_INJURY_TEMPLATES`, `OffseasonInjuryTemplate`, `OffseasonInjuryKey`, `createOffseasonInjury` from `injuries.ts` (zero consumers)
- **Removed unnecessary exports**: `getAttributeDescription`, `getAttributeRangeDescription` from `scouting.ts` (internal only)
- **Fixed circular dependency**: Moved `ScoutQuality` type from `scouting.ts` to `scoutInsights.ts` to break `scouting.ts ↔ scoutInsights.ts` cycle
- **Fixed gameStateSchema.ts imports**: Separated import-for-use from re-export-from to eliminate 12+ unused import warnings
- **Fixed 3 remaining circular dependencies**:
  1. `traits.ts ↔ traitData/flaws.ts`: Extracted `TraitDef`, `TraitEffect`, `TraitTier`, `TraitSign` to `traitData/traitTypes.ts`. Both `flaws.ts` and `classTraits.ts` now import types from `traitTypes.ts` instead of the traits barrel.
  2. `traits.ts ↔ traitData/classTraits.ts`: Same fix as above.
  3. `EntityLink.tsx → StableDossier.tsx → WarriorBadges.tsx → EntityLink.tsx`: Changed `WarriorBadges.tsx` to use `lazy()` import for `WarriorLink`, breaking the static import cycle.
- **Removed 40 duplicate ' 2' backup files**: All files with ' 2' suffix were identical copies (verified via diff), including 3 audit files, 13 source files, and 24 test files.

#### Step 2.7: Import Path Normalization
- Ran `eslint --fix` on all touched files
- Fixed empty JSDoc blocks in `weatherEffects.ts` and `gameStateSchema.ts`
- Verified `@/` prefix consistency

### Phase 3: Validation

All validation gates passed:
- **Functional**: tsc clean, vitest 5837/5837 pass, narrative-validate pass, eslint 0 errors, vite build success
- **Structural**: 0 circular dependencies, all files >300 lines have documented justification, import depth >5 limited to React page/component chains (not SRP/DRY issue)
- **Unique logic preservation**: 141/141 characterization tests pass, all deleted code was either consolidated into shared utilities or was genuinely dead
- **Export coverage**: 159 exports removed, 262 added — all removed exports are re-exported from new locations or were confirmed dead

## Files >300 Lines (with justification)

| File | Lines | Justification |
|---|---|---|
| `seasonalHandlers.ts` | 68 (barrel) | Re-export barrel for offseasonEvents/ directory |
| `schemaObjects.ts` | 880 (barrel) | Re-export barrel for warriorSchemas/fightSchemas/economySchemas |
| `traitDefs.ts` | 771 | Trait definitions (data, not logic) |
| `phaseResolvers.ts` | 11 (barrel) | Re-export barrel for initiativePhase/offenseDefense |
| `classTraits.ts` | 516 | Class trait data (data, not logic) |
| `chargePaths.ts` | 498 | SVG path data (data, not logic) |
| `combat.ts` (constants) | 476 | Combat constants (data, not logic) |
| `weather.ts` (constants) | 463 | Weather constants (data, not logic) |
| `weatherEffects.ts` | 444 | Weather effect data + lookup functions |
| `offenseDefense.ts` | 438 | Combat offense/defense resolution — cohesive single responsibility |
| `loreData.ts` | 407 | Lore data arrays (ORIGINS, CHILDHOOD_TRAITS, DEFINING_MOMENTS) |
| `chaosHandlers.ts` | 421 | Chaos offseason event handlers — single responsibility |
| `socialHandlers.ts` | 385 | Social offseason event handlers — single responsibility |
| `combatNarrators.ts` | 355 | 15 cohesive pure narration functions — single domain |
| `recruitment.ts` | 350 | Recruitment generation + pool management — cohesive |

## New Utilities Created

| Utility | Location | Purpose |
|---|---|---|
| `formatWeek(week, season)` | `src/utils/format.ts` | Consistent week/season string formatting |
| `formatDateOfDeath(week, season)` | `src/utils/format.ts` | Date of death string for warrior records |
| `makeInjury(rng, params)` | `src/engine/injuries/utils.ts` | Deterministic injury creation from template |
| `makeInsightToken(rng, params)` | `src/engine/core/eventHelpers.ts` | Deterministic insight token creation |
| `clamp(value, min, max)` | `src/utils/math.ts` (existing) | Value clamping utility |
| `TraitDef`, `TraitEffect`, `TraitTier`, `TraitSign` | `src/engine/traitData/traitTypes.ts` | Shared trait type definitions (extracted to break circular dependency) |
