# Plan 3 — Surface the Battle Plans editor (fix the dead tab)

## Problem (confirmed)
"Planner" nav (`navigationShared.tsx:52`) → `/stable/planner` → `TrainingPlanner/index.tsx`.
The **Battle Plans** button is a non-interactive `<div>` (`index.tsx:61-64`) styled active but
doing nothing — the panel below always shows the *training* UI. The real editor `PlanBuilder.tsx`
is mounted only in `WarriorDetail.tsx` → `MissionControlTab.tsx:66` (two levels deep).

## Persistence pattern to reuse (`WarriorDetail.tsx:84-96`)
```ts
const handlePlanChange = useCallback((newPlan: FightPlan) => {
  if (!warrior) return;
  setState((draft) => {
    const found = draft.roster[draft.roster.findIndex((w) => w.id === warrior.id)];
    if (found) found.plan = newPlan;
  });
}, [warrior, setState]);
```
`PlanBuilder` is fully **controlled** (`{ plan, onPlanChange, warrior?, rivalStyle? }`) — it
never touches the store. Plan lives at `warrior.plan` (`warrior.types.ts:181`); fallback is
`defaultPlanForWarrior(warrior)` (`@/engine/simulate`). Both entry points reading/writing the
same Zustand field stay in sync automatically.

## Decision
**Reuse `PlanBuilder` directly with local selected-warrior state; do NOT extract a new
component; keep the per-warrior editor in `WarriorDetail`.** The roster picker already exists:
reuse `TrainingPlanner/components/WarriorSelector.tsx`. Keep it on `/stable/planner` (zero
routing changes; the nav item finally does something).

## Change — `TrainingPlanner/index.tsx`
Keep the Training `<Link>`. In the right-hand panel, when `selectedWarrior` exists render
`PlanBuilder` wired to that warrior's plan; else keep the empty-state Surface (copy tweaked).
New imports: `PlanBuilder`, `useGameStore`, `defaultPlanForWarrior`, types `FightPlan`/`Warrior`.
Add the `handlePlanChange` above (using `selectedWarrior` from `useTrainingPlanner`). Render:
```tsx
{selectedWarrior ? (
  <PlanBuilder warrior={selectedWarrior}
    plan={selectedWarrior.plan ?? defaultPlanForWarrior(selectedWarrior)}
    onPlanChange={handlePlanChange} />
) : (/* empty-state Surface */)}
```
Optional: retitle the page header (currently training-centric) and swap header stats to a
"Plans set: X / N" metric.

## Verification
`npm run dev` → Planner → Battle Plans shows WarriorSelector + PlanBuilder; edit OE/AL/tactic →
Strategy Score updates; open same warrior's WarriorDetail STRATEGY tab → values match (shared
persistence); edit there → back to Planner → reflected; Training tab still navigates. `type-check`.

## Risks
State sync (mitigated by single store source); `Warrior` import source differs between files
(use WarriorDetail's imports); empty-roster (early-return + existing empty-state); first-edit on
a warrior with no plan (`?? defaultPlanForWarrior`); header stats become misleading (optional copy fix).

## Critical files
`src/pages/TrainingPlanner/index.tsx` (primary); `src/components/PlanBuilder.tsx` (no change);
`src/pages/WarriorDetail.tsx:84-96` (pattern source);
`src/pages/TrainingPlanner/components/WarriorSelector.tsx`; `.../hooks/useTrainingPlanner.ts`.
