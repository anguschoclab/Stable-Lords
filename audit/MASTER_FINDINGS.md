# SRP/DRY Audit — Master Findings

## Audit Date: 2026-08-02
## Branch: `refactor/srp-dry-audit` | Tag: `pre-audit-baseline`
## Baseline: 457 test files, 5837 tests pass, 8 skipped, 0 fail | tsc clean

---

## 1. SRP Violation Catalog

### 1.1 Monolithic Files (>500 lines, mixed responsibilities)

| File | Lines | Responsibilities | Severity |
|------|-------|-----------------|----------|
| `src/engine/pipeline/seasonal.ts` | 1753 | 45 event handlers + shared helpers + event registry + orchestrator | **Critical** |
| `src/schemas/gameStateSchema.ts` | 1429 | 50+ enum schemas + 30+ object schemas + main GameState schema | High |
| `src/components/arena/weather/effects.tsx` | 995 | Weather particle rendering + effect logic + style calculations | High |
| `src/engine/traits.ts` | 964 | Trait definitions (TRAITS dict) + generation logic + static/dynamic mod calculation + fight plan mods | High |
| `src/engine/combat/resolution/resolution.ts` | 901 | Initiative phase + whiff riposte + contested defense + combat offense/defense + exchange orchestration | High |

### 1.2 Mixed-Responsibility Functions

| File | Function | Issue |
|------|----------|-------|
| `seasonal.ts` | `runSeasonalPass` | Orchestrates event selection, creates context, dispatches to handler, applies impacts — mixes orchestration with impact application |
| `traits.ts` | `getDynamicTraitMods` | Evaluates conditional mods + applies fight plan mods + handles personality/attribute bonuses |
| `resolution.ts` | `resolveExchange` | Orchestrates all sub-phases + manages state + handles kill window + fatigue |

### 1.3 Decomposition Candidates

**`seasonal.ts` (1753 lines → ~45 handler files + 1 orchestrator)**
- 45 event handler functions (lines 156–1638), each 20–60 lines
- 4 shared helpers (`getActiveWarriors`, `makeInjury`, `addLedger`, `pushNarrative`) — lines 82–152
- 1 event registry (`EVENT_HANDLERS`) — lines 1642–1697
- 1 orchestrator (`runSeasonalPass`) — lines 1702–1754
- **Plan**: Extract each handler to `src/engine/pipeline/seasonal/handlers/`, extract shared helpers to `src/engine/pipeline/seasonal/helpers.ts`, keep orchestrator in `seasonal.ts`

**`traits.ts` (964 lines → 3 files)**
- Trait definitions (`TRAITS` dict, ~660 lines) → `src/engine/traitData/traits.ts`
- Generation logic (`generateTraits`, `traitsForStyle`, `traitsByTier`) → `src/engine/traitData/traitGeneration.ts`
- Mod calculation (`getStaticTraitMods`, `getDynamicTraitMods`, `getTraitFightPlanMods`) → `src/engine/traitData/traitMods.ts`

**`gameStateSchema.ts` (1429 lines → 3-4 files)**
- Enum schemas (lines 1–441) → `src/schemas/enums.ts`
- Object schemas (lines 443–1130) → `src/schemas/objects.ts`
- Main GameState schema (lines 1317–1406) → `src/schemas/gameStateSchema.ts` (keep)

**`resolution.ts` (901 lines → 3-4 files)**
- `resolveInitiativePhase` → `src/engine/combat/resolution/initiativePhase.ts`
- `resolveWhiffRiposte` + `resolveContestedDefense` → `src/engine/combat/resolution/defensePhases.ts`
- `resolveCombatOffenseDefense` → `src/engine/combat/resolution/offenseDefense.ts`
- `resolveExchange` stays as orchestrator

---

## 2. DRY Violation Catalog

### 2.1 Inline `Math.max(min, Math.min(max, value))` — should use `clamp` from `utils/math.ts`

**Total occurrences**: 40+ across 27 files
**Existing utility**: `clamp(value, min, max)` in `@/utils/math.ts`

Top offenders:
| File | Count | Example |
|------|-------|---------|
| `src/engine/skillCalc.ts` | 7 | `Math.max(1, Math.min(20, ATT_raw))` |
| `src/data/terrabloodCharts.ts` | 7 | `table[Math.max(3, Math.min(21, sz))]` |
| `src/engine/combat/resolution/exchangeSubPhases.ts` | 4 | `Math.max(0, Math.min(0.04, threshold))` |
| `src/engine/stableReputation.ts` | 2 | `Math.max(0, Math.min(100, raw + 20))` |
| `src/engine/combat/mechanics/tacticResolution.ts` | 2 | `Math.max(1, Math.min(10, avgEffort))` |
| `src/engine/bout/fighterState.ts` | 2 | `Math.max(1, Math.min(10, effOE + ...))` |
| `src/engine/ai/plan/strategyValidator.ts` | 2 | `Math.max(1, Math.min(10, plan.OE))` |
| + 20 more files | 1 each | Various inline clamp patterns |

### 2.2 Direct `status === 'Active'` — should use `isActive` from `@/engine/warriorStatus`

**Total occurrences**: 40+ across 30+ files
**Existing utility**: `isActive(w)` in `@/engine/warriorStatus.ts`

Top offenders:
| File | Count |
|------|-------|
| `src/engine/owner/roster/management.ts` | 6 |
| `src/pages/WorldOverview.tsx` | 4 |
| `src/engine/ai/workers/competitionWorker/boutBidding.ts` | 4 |
| `src/engine/pipeline/passes/EventPass.ts` | 3 |
| `src/engine/ai/intentEngine.ts` | 3 |
| `src/utils/roster.ts` | 2 (inside `filterActive`/`filterHealthy` — correct) |
| `src/engine/pipeline/seasonal.ts` | 2 (inside `getActiveWarriors` — correct) |
| + 25 more files | 1 each |

### 2.3 Duplicate `buildWarriorMap` — two implementations with different semantics

| Location | Scope | Includes dead/retired? |
|----------|-------|------------------------|
| `src/utils/roster.ts:13` | Player roster + rival rosters | **No** |
| `src/utils/warriorCollection.ts:28` | All known warriors (roster + graveyard + retired + rivals) | **Yes** |
| `src/engine/core/warriorCollection.ts` | Has `collectAllWarriors` (no map) + `collectAllActiveWarriors` | N/A (no map builder) |

**Issue**: Two functions with identical names but different semantics. Callers may use the wrong one.
**Plan**: Rename `roster.ts:buildWarriorMap` → `buildActiveWarriorMap`, keep `warriorCollection.ts:buildWarriorMap` as the comprehensive version.

### 2.4 Duplicate `collectAllWarriors`/`collectAllActiveWarriors` — two implementations

| Location | Implementation |
|----------|---------------|
| `src/engine/core/warriorCollection.ts:14` | Iterates roster + rivals with optional filter |
| `src/utils/warriorCollection.ts:10` | Flattens roster + graveyard + retired + rivals (no filter) |

**Issue**: `core/warriorCollection.ts` and `utils/warriorCollection.ts` have overlapping functionality with different signatures and scopes.
**Plan**: Consolidate into single module. `utils/warriorCollection.ts` should be the canonical source; `core/warriorCollection.ts` should re-export or be removed.

### 2.5 Duplicate ledger/newsletter helpers — local vs shared

| Pattern | Shared Helper | Local Duplicate | Used By |
|---------|--------------|-----------------|---------|
| Ledger entry creation | `makeLedgerEntry` in `engine/impacts/ledgerHelpers.ts` | `addLedger` in `seasonal.ts:116` | Only `EventPass.ts` uses shared; `seasonal.ts` uses local |
| Newsletter item creation | `makeNewsletterItem`/`pushNewsletterItem` in `engine/narrative/newsletterHelpers.ts` | `pushNarrative` in `seasonal.ts:137` | Only `EventPass.ts` uses shared; `seasonal.ts` uses local |
| Injury creation | (none shared) | `makeInjury` in `seasonal.ts:94` | Only `seasonal.ts` |

**Plan**: Replace `seasonal.ts` local helpers with shared helpers. Create shared `makeInjury` in `engine/injuries/`.

### 2.6 Inline `roster.find`/`roster.filter(id ===)` — should use roster utilities

**Total occurrences**: 10+ across 8 files
**Existing utility**: `buildWarriorMap` for lookups, `filterActive` for active filtering

Top offenders:
| File | Count |
|------|-------|
| `src/state/slices/rosterSlice/actions.ts` | 3 |
| `src/pages/WarriorDetail.tsx` | 2 |
| + 6 more files | 1 each |

### 2.7 Duplicate `filterActive`/`filterHealthy` — multiple implementations

| Location | Function | Implementation |
|----------|----------|---------------|
| `src/utils/roster.ts:44` | `filterActive` | `roster.filter(w => w.status === 'Active')` |
| `src/utils/roster.ts:59` | `filterHealthy` | `roster.filter(w => w.status === 'Active' && !w.injuries?.length)` |
| `src/engine/core/warriorCollection.ts:40` | `collectAllActiveWarriors` | `collectAllWarriors(state, w => isActive(w))` |
| `src/engine/core/warriorCollection.ts:80` | `collectHealthyWarriors` | `collectAllWarriors(state, w => isActive(w) && !w.injuries?.length)` |
| `src/engine/pipeline/seasonal.ts:87` | `getActiveWarriors` | `state.roster.filter(w => w.status === 'Active' && (!healthyOnly \|\| !w.injuries?.length))` |

**Issue**: 3 different implementations of "get active warriors" with subtly different semantics (player-only vs all stables, healthy filter optional vs required).
**Plan**: Consolidate. `utils/roster.ts` handles player roster; `core/warriorCollection.ts` handles all stables. Both should use `isActive()` from `warriorStatus.ts`.

---

## 3. Existing Utility Coverage Audit

### Utilities that exist but are underused:

| Utility | Location | Used By | Should Be Used By |
|---------|----------|---------|-------------------|
| `clamp` | `utils/math.ts` | 9 files | 27+ files with inline `Math.max/min` |
| `isActive` | `engine/warriorStatus.ts` | 9 files | 30+ files with `status === 'Active'` |
| `filterActive` | `utils/roster.ts` | 3 files | 30+ files with inline active filtering |
| `makeLedgerEntry` | `engine/impacts/ledgerHelpers.ts` | 1 file (`EventPass.ts`) | `seasonal.ts` (uses local `addLedger`) |
| `pushNewsletterItem` | `engine/narrative/newsletterHelpers.ts` | 1 file (`EventPass.ts`) | `seasonal.ts` (uses local `pushNarrative`) |
| `buildWarriorMap` (collection) | `utils/warriorCollection.ts` | 2 files | More callers should use for lookups |
| `isExhausted`/`isFatigued` | `engine/core/fatigueUtils.ts` | 2 files | Files with inline fatigue checks |
| `getFatigueBand` | `engine/core/fatigueUtils.ts` | 0 external | Files with inline fatigue thresholds |

### Missing utilities (need creation):

| Utility | Purpose | Consumers |
|---------|---------|-----------|
| `makeInjury` (shared) | Injury creation with RNG-deterministic ID | `seasonal.ts`, future injury sources |
| `clamp01` (already exists) | Clamp to [0,1] | UI components with `Math.max(0, Math.min(100, ...))` |
| `mapRange` (already exists) | Linear interpolation | Check if used where manual lerp exists |

---

## 4. Dependency & Import Analysis

### Circular dependency risk areas:
- `seasonal.ts` imports from `traits.ts` (TRAITS) and `narrativeContent` — no circular risk
- `resolution.ts` imports from multiple combat mechanics modules — no circular risk
- `traits.ts` imports from `combat.ts` constants — no circular risk

### Import normalization issues:
- `utils/roster.ts` and `utils/warriorCollection.ts` both export `buildWarriorMap` — naming conflict
- `engine/core/warriorCollection.ts` and `utils/warriorCollection.ts` both export `collectAllWarriors` — naming conflict
- Some files import from `@/utils/roster` and others from `@/engine/core/warriorCollection` for the same functionality

---

## 5. Findings Synthesis

### Priority Order for Phase 2 Implementation:

1. **DRY: Replace inline `Math.max/min` with `clamp`** — 40+ occurrences, mechanical, low risk
2. **DRY: Replace `status === 'Active'` with `isActive()`** — 40+ occurrences, mechanical, low risk
3. **DRY: Consolidate `buildWarriorMap`** — rename to avoid semantic confusion
4. **DRY: Consolidate `collectAllWarriors`/`collectAllActiveWarriors`** — merge modules
5. **DRY: Replace `seasonal.ts` local helpers with shared helpers** — `addLedger` → `makeLedgerEntry`, `pushNarrative` → `pushNewsletterItem`
6. **SRP: Decompose `seasonal.ts`** — extract 45 handlers to separate files
7. **SRP: Decompose `traits.ts`** — split definitions, generation, and mod calculation
8. **SRP: Decompose `gameStateSchema.ts`** — split enum/object/main schemas
9. **SRP: Decompose `resolution.ts`** — split phase resolvers

### Risk Assessment:
- Items 1-2: **Low risk** — mechanical replacements, characterization tests guard behavior
- Items 3-5: **Medium risk** — need careful import updates, but logic is identical
- Items 6-9: **Higher risk** — file splits require moving code, updating imports, but characterization tests + existing tests provide safety net
