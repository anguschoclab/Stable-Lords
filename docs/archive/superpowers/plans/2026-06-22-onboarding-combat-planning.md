# Plan 8 — Deepen onboarding to teach combat planning

## Problem (confirmed)

FTUE (`Orphanage.tsx`) is a 4-step wizard; `runTutorialBout` (`:89-109`) calls
`defaultPlanForWarrior` + `simulateFight` (`:96-98`) with **no player decisions and no seed**
(currently nondeterministic per re-run). After step 4 it dumps to `/stable` (`:134`). It teaches
the OE/AL/KD/tactics core nothing. **A coach system already exists** (`useCoachTip.ts`, sonner,
route-keyed, wired in `__root.tsx:20`, gated on `ftueComplete`) — but `COACH_ROUTES` has **no
`/stable` entry**, which is exactly the landing route. First real action route is `/stable/bouts`.

## New ordering (4→5)

0. Identity
1. Choose Warriors
2. **Set the Plan (NEW)**
3. First Blood
4. Your Story Begins

## Simplified plan model (warrior A only)

Two decisions seeded from `defaultPlanForWarrior(wA)` (everything else stays valid): an
**Aggression** slider → `plan.OE` (leave `AL`/`killDesire` at default to avoid accidental
tutorial deaths; couple `AL` only if the OE swing isn't visible enough), and a **Tactic** (2-3
buttons from `TACTIC_BANK`, written like `TacticBank.handleClick`). Do NOT import full
`PlanBuilder`/`CommonControls` — hand-roll the two controls from the same primitives
(`CommonControls.tsx:22-36` slider markup).

## Files

**Create** `src/components/orphanage/PlanStep.tsx` (`{ warrior, plan, onPlanChange, onBack,
onNext }`).

**Modify** `StepProgress.tsx` (grow both label/subtitle arrays to 5, insert at index 2).

**Modify** `Orphanage.tsx`:

- Add `playerPlan` state + fixed `boutSeed` (`cryptoRandomInt` once)
- `total={5}`
- In WarriorSelection `onNext` set `playerPlan=defaultPlanForWarrior(wA)` and `setStep(2)` (don't run bout yet)
- Insert the step-2 block running the bout on its `onNext`
- Renumber First Blood 2→3 and Story 3→4
- In `runTutorialBout` use `planA = playerPlan ?? defaultPlanForWarrior(wA)` and pass `boutSeed` as the 5th `simulateFight` arg (deterministic → the choice is the only variable)
- Optional: thread the plan into `buildFTUEInitialState` so it persists into week 1

**Modify** `useCoachTip.ts`: add a `/stable` `COACH_ROUTES` entry (open Bouts / advance week,
conditioned on `arenaHistory.length <= 1` and `boutOffers`).

## Verification

New game → 5-segment progress + "Set the Plan"; aggression 1 + defensive vs aggression 10 +
aggressive (same seed) → First Blood **changes**; finish → `/stable` coach toast appears,
dismiss permanent; "5/5" with no `undefined` label.

## Risks

Overwhelm (one slider + 2-3 buttons only); deterministic bout (the fix — fixed seed makes the
choice causal; today's unseeded bout hides it); accidental tutorial death (leave killDesire at
default); plan not persisted to week 1 (optional thread); step-renumber bugs (every `setStep`/
guard/array must shift); coach tip gating (`ftueComplete`, exact `/stable`, `boutOffers` seeded).

## Critical files

`src/pages/Orphanage.tsx`; `src/components/orphanage/PlanStep.tsx` (new);
`src/components/orphanage/StepProgress.tsx`; `src/hooks/useCoachTip.ts`;
`src/components/planBuilder/CommonControls.tsx` (reference).
