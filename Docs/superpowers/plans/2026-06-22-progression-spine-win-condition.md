# Plan 1 — Progression spine / win condition

## Problem (measured)
Week wraps 52→1 forever (`weekPipelineService.ts:47-61`, `SystemPass.ts:126-127`); years
increment with no terminal state. Header hardcodes `"Season Active"`
(`ControlCenter/index.tsx:50`). **Key finding:** the standing is already computed but never
shown — `useControlCenter.ts:49-53` computes `stableRank` and `:55-67` `topWarriorRank`, and
returns both; the page renders the literal string instead. `realmRankings` is warrior-level
only (`RankingsPass.ts`); there is no stable-level standing in engine state (UI fakes it ad
hoc). Year-boundary logic already exists in `SystemPass` (`isYearTransition = nextWeek === 1`).

## Recommendation: Championship Objectives culminating in a Realm Title (Option 2 + 1 hybrid)
A milestone/objective ladder that culminates in a #1 stable championship. Reuses
`realmRankings`, the fame-based standing already half-built in the UI, and the existing
year-boundary tick. After winning, the loop continues in legacy/endless mode. Avoid the
multi-tier escalating arc (Option 3) for MVP — defer.

## Core model — new types in `src/types/state.types.ts` (near `RankingEntry`/`AnnualAward`)
```ts
export type ObjectiveId =
  | 'TOP_10_STABLE' | 'TOP_3_STABLE' | 'FIRST_TOURNAMENT_WIN'
  | 'HALL_OF_FAMER' | 'REALM_CHAMPION';        // REALM_CHAMPION = the win condition

export interface ProgressionObjective {
  id: ObjectiveId; label: string; description: string;
  completed: boolean; completedWeek?: number; completedYear?: number; targetYear?: number;
}
export type ProgressionStatus = 'active' | 'won' | 'continued';
export interface ProgressionState {
  status: ProgressionStatus; stableStanding: number; totalStables: number;
  objectives: ProgressionObjective[]; wonYear?: number; wonWeek?: number; acknowledgedWin?: boolean;
}
```
Add `progression: ProgressionState;` to `GameState`.

## Where each change lands
1. **Types** — `src/types/state.types.ts`: the four types + `progression` field.
2. **Impact channel** — `src/engine/impacts/types.ts`: `progression?: ProgressionState;`.
3. **Impact handler** — `src/engine/impacts/world.ts` (or `awards.ts`):
   `(state, value) => { state.progression = value; }`. **Also add to `MERGE_CONFIG`
   (`impactSystem.ts:70-113`)** `progression: { strategy: 'replace', defaultValue: undefined }`
   — without this the headless/auto-sim batch path silently drops the field.
4. **New pass** — `src/engine/pipeline/passes/ProgressionPass.ts` (do NOT fork RankingsPass):
   `runProgressionPass(state, nextWeek, nextYear): StateImpact`. Logic: clone
   `state.progression`; compute **stable standing** by ranking `state.fame` against
   `rivals[].fame` (player is NOT in `rivals[]`, include explicitly; `totalStables =
   rivals.length + 1`; deterministic tie-break fame → titles → stableId); evaluate each
   incomplete objective (`TOP_10/TOP_3` by standing; `FIRST_TOURNAMENT_WIN` via
   `tournaments[].champion` ∈ player roster; `HALL_OF_FAMER` via `hallOfFame[]`;
   `REALM_CHAMPION` = standing 1 **gated to year-boundary** `nextWeek===1`); stamp
   `completedWeek/Year` once (guard on `!completed`), push `newsletterItems`/`gazettes`; on
   `REALM_CHAMPION` set `status='won'`. Never halt the loop.
5. **Wire** — `weekPipelineService.ts` `collectRemainingImpacts` (`:144-168`), after
   `runRankingsPass`.
6. **Serialization** — `src/state/serialization.ts`: add `progression` to `currentValues`
   and the `GameStateValues` type.
7. **Store slice** — `src/state/slices/economySlice.ts`: add field + default; shared
   `DEFAULT_PROGRESSION` in new `src/constants/progression.ts`; add `acknowledgeWin()` action
   (`status='continued'`).
8. **Hydration** — `src/state/createStore.ts`: `draft.progression = state.progression ||
   DEFAULT_PROGRESSION;` (old-save back-compat).
9. **Schema** — `src/schemas/gameStateSchema.ts`: `ProgressionStateSchema` +
   `progression: ProgressionStateSchema.optional()` (MUST be `.optional()` — schema is
   `.strict()`).
10. **Factory** — `src/engine/factories/gameStateFactory.ts`: seed `DEFAULT_PROGRESSION`.

## UI
- **Replace** `ControlCenter/index.tsx:50` with real `stableStanding`/`totalStables`
  (e.g. `#3 of 12`), "Realm Champion" when `status !== 'active'`. Add `progression` to
  `useControlCenter.ts` selector. Migrate `RankingsBar.tsx` + hook off the ad-hoc fame calc.
- **New** `src/components/dashboard/ObjectivesWidget.tsx` — checklist of `objectives`,
  mounted in the overview grid (`index.tsx:87-101`).
- **Win screen** — modal fires when `status === 'won' && !acknowledgedWin`; **reuse**
  `src/components/ledger/YearEndRecap.tsx` as the body, "Continue Legacy" (`acknowledgeWin()`)
  / "New Game".
- **Copy** — `Help.tsx:309` stable-level victory section; `Docs/USER_MANUAL.md:54,64`.

## Verification
Seeded sim tests stay green (`src/scripts/simulation.test.ts`, `src/test/engine/sim/`);
save-load round-trips an old save without `progression`; standing in header == widget;
trigger a win in a fast sim and confirm modal + `continued` state.

## Risks
`.strict()` rejects old saves → `.optional()` + default in `createStore`; standing-definition
mismatch → single-source in ProgressionPass; fluke win → year-boundary gate; batch-merge drops
field → MERGE_CONFIG entry; duplicate news → `!completed` guard; determinism → deterministic
tie-breaks.

## Critical files
`src/types/state.types.ts`; `src/engine/pipeline/passes/ProgressionPass.ts` (new) + `RankingsPass.ts`;
`weekPipelineService.ts`; `ControlCenter/index.tsx` + `hooks/useControlCenter.ts`;
`gameStateSchema.ts` + `serialization.ts` + `economySlice.ts` + `createStore.ts`.
