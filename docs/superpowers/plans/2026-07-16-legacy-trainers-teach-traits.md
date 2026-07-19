# Legacy Trainers Teach Their Own Traits Implementation Plan (F2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retired champions who become trainers can teach **their own former traits** — even above their trainer-tier ceiling — so the only way to learn a dead legend's `living_wall` is to hire the legend. Turns permadeath into a long-game asset and gives the ~98-trait roster a scarce second acquisition path.

**Architecture:** The retiree→trainer conversion **already exists**: `runWarriorPass` (`src/engine/pipeline/passes/WarriorPass.ts:25–35`) converts retirees with `fame > 500` at a 10% chance via `convertRetiredToTrainer` (`src/engine/trainers.ts:~195`), and `Trainer` already carries legacy fields (`retiredFromWarrior`, `retiredFromStyle`, `legacyWins`, `legacyKills` — `src/types/shared.types.ts:655`). We extend, not rebuild: (1) the conversion snapshots the retiree's positive traits into a new `Trainer.teachableTraits`; (2) `traitTrainingPool` additionally offers a legacy trainer's own former traits, bypassing the tier ceiling (style/conflict/cap gates still apply); (3) the hard-coded fame/chance magic numbers become named, slightly-loosened knobs so the feature actually occurs at observable rates; (4) trainer UI shows the teachable traits with the existing `TraitBadge`.

**Tech Stack:** TypeScript, React 18, Tailwind + shadcn/ui, Bun (`bun`/`bunx` — never npm/node), Vitest + Testing Library.

**Scope:** Engine + one UI surface. **Non-goals:** changing how player trait-training assignments work (System 3 flow untouched), rival AI trainer synthesis (the AI's synthetic coach has no `teachableTraits` and behaves exactly as before), combat math (`balance.test.ts` stays green).

**Grounded facts (do not re-derive):**
- `runWarriorPass` legacy block: retirees with `w.fame > 500` get a `rng.next() < 0.1` chance to `convertRetiredToTrainer(w)` and are pushed into `state.hiringPool` (`WarriorPass.ts:25–41`).
- `convertRetiredToTrainer` lives in `src/engine/trainers.ts` (sets `retiredFromWarrior: warrior.name` at ~line 195). Read the whole function before editing.
- `Trainer` interface (`src/types/shared.types.ts:655`): `id, name, tier, focus, fame, age, contractWeeksLeft, retiredFromWarrior?, retiredFromStyle?, styleBonusStyle?, legacyWins?, legacyKills?, specialty?`.
- `traitTrainingPool(warrior, trainer)` (`src/engine/training/trainingGains/traitTraining.ts:37–44`): filters `TRAITS` by not-owned, `sign === 'positive'`, `withinCeiling(t, ceiling)`, and `t.styles ? t.styles.includes(warrior.style) : true`. `traitTrainingCeiling` maps Novice→Notable, Seasoned→Exceptional, Master→Signature.
- `canAcquireTrait` gates cap/duplicates/conflicts and is applied by `rollTraitTraining` on top of the pool — unchanged.
- `TraitBadge` component: `src/components/warrior/traits/TraitBadge.tsx` (`<TraitBadge traitId={id} />`, returns null for unknown ids).
- Legacy trainers get a retirement discount already (`trainerAging.ts:51` reads `retiredFromWarrior`), proving the legacy path is live end-to-end.

---

## File Structure

- **Modify** `src/types/shared.types.ts` — `teachableTraits?: string[]` on `Trainer`.
- **Modify** `src/engine/trainers.ts` — conversion snapshots positive traits.
- **Modify** `src/engine/pipeline/passes/WarriorPass.ts` — named knobs for fame threshold + chance.
- **Modify** `src/engine/training/trainingGains/traitTraining.ts` — legacy traits join the pool above ceiling.
- **Modify** `src/test/engine/training/traitTraining.test.ts` — pool tests.
- **Create** `src/test/engine/legacyTrainer.test.ts` — conversion tests.
- **Modify** the trainer card UI (locate via grep, see Task 4) — show teachable traits.

---

## Task 1: Conversion carries the champion's traits (TDD)

**Files:**
- Modify: `src/types/shared.types.ts`
- Modify: `src/engine/trainers.ts`
- Create: `src/test/engine/legacyTrainer.test.ts`

- [ ] **Step 1: Add the field**

In `src/types/shared.types.ts`, inside the `Trainer` interface (line ~655), after `legacyKills?`:

```typescript
  /** The positive traits this trainer carried as a warrior — teachable even
   *  above their tier ceiling. Only set for retiree-converted legacy trainers. */
  teachableTraits?: string[];
```

- [ ] **Step 2: Write the failing test**

`src/test/engine/legacyTrainer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { convertRetiredToTrainer } from '@/engine/trainers';
import type { Warrior } from '@/types/warrior.types';

const retiree = (traits: string[]): Warrior =>
  ({
    id: 'w9', name: 'Old Iron', fame: 600, age: 34, status: 'Retired',
    career: { wins: 30, losses: 8, kills: 5 },
    attributes: { WT: 14, WL: 14, ST: 12, SP: 10, DF: 12, AG: 10 },
    traits,
  }) as unknown as Warrior;

describe('convertRetiredToTrainer teachableTraits', () => {
  it('snapshots the retiree’s POSITIVE traits (flaws are not teachable)', () => {
    const t = convertRetiredToTrainer(retiree(['living_wall', 'quick', 'fragile']));
    expect(t.teachableTraits).toEqual(expect.arrayContaining(['living_wall', 'quick']));
    expect(t.teachableTraits).not.toContain('fragile'); // Flaw tier
    expect(t.retiredFromWarrior).toBe('Old Iron');
  });

  it('a blank retiree yields no teachableTraits', () => {
    const t = convertRetiredToTrainer(retiree([]));
    expect(t.teachableTraits ?? []).toHaveLength(0);
  });
});
```

> Match `convertRetiredToTrainer`'s real signature first (read `src/engine/trainers.ts` around line 195 — it may take `(warrior, rng?)` or similar; adapt the calls, not the assertions). If it is not exported, export it.

- [ ] **Step 3: Run — expect FAIL.** `npx vitest run src/test/engine/legacyTrainer.test.ts`

- [ ] **Step 4: Implement**

In `src/engine/trainers.ts`, inside `convertRetiredToTrainer`, where the returned `Trainer` object is built (alongside `retiredFromWarrior: warrior.name`), add:

```typescript
    teachableTraits: (warrior.traits ?? []).filter((id) => TRAITS[id]?.sign === 'positive'),
```

Add `import { TRAITS } from '@/engine/traits';` if the file doesn't already import it.

- [ ] **Step 5: Run + typecheck + commit**

Run: `npx vitest run src/test/engine/legacyTrainer.test.ts` → PASS; `bunx tsc … | grep -c "error TS"` → `0`.

```bash
git add "src/types/shared.types.ts" "src/engine/trainers.ts" "src/test/engine/legacyTrainer.test.ts"
git commit -m "feat(trainers): legacy trainers snapshot their positive traits as teachable"
```

---

## Task 2: Legacy traits join the training pool above the ceiling (TDD)

**Files:**
- Modify: `src/engine/training/trainingGains/traitTraining.ts`
- Modify: `src/test/engine/training/traitTraining.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/test/engine/training/traitTraining.test.ts` (reuse the file's existing warrior/trainer builders — read the file; there is a Master-trainer fixture from the class-reach tests):

```typescript
describe('traitTrainingPool — legacy teachable traits', () => {
  it('a legacy trainer offers their own former trait even above their tier ceiling', () => {
    // Novice ceiling = Notable, but the legend personally carried a Signature.
    const legacyNovice = {
      id: 't9', name: 'Old Iron', tier: 'Novice', focus: 'Mind',
      fame: 100, age: 40, contractWeeksLeft: 10,
      retiredFromWarrior: 'Old Iron',
      teachableTraits: ['living_wall'], // WS Signature class trait
    } as unknown as Trainer;

    const wosWarrior = /* reuse the file's WallOfSteel warrior builder */ freshWosWarrior();
    const pool = traitTrainingPool(wosWarrior, legacyNovice);
    expect(pool.map((t) => t.id)).toContain('living_wall');
  });

  it('legacy traits still respect style restriction', () => {
    const legacyNovice = {
      id: 't9', name: 'Old Iron', tier: 'Novice', focus: 'Mind',
      fame: 100, age: 40, contractWeeksLeft: 10,
      teachableTraits: ['living_wall'],
    } as unknown as Trainer;
    // A non-WallOfSteel warrior cannot learn the WS class trait, legacy or not.
    const bashWarrior = { ...freshWosWarrior(), style: FightingStyle.BashingAttack };
    const pool = traitTrainingPool(bashWarrior as Warrior, legacyNovice);
    expect(pool.map((t) => t.id)).not.toContain('living_wall');
  });
});
```

(Adapt builder names to what the test file actually exports/defines — `freshWosWarrior` exists from the class-reach test added 2026-06-21; if it's scoped inside another `describe`, hoist it to module level.)

- [ ] **Step 2: Run — expect FAIL** (the pool's `withinCeiling` filter excludes the Signature under a Novice).

- [ ] **Step 3: Implement**

In `src/engine/training/trainingGains/traitTraining.ts`, replace the body of `traitTrainingPool` (lines ~37–44):

```typescript
export function traitTrainingPool(warrior: Warrior, trainer: Trainer): TraitDef[] {
  const ceiling = traitTrainingCeiling(trainer.tier);
  const owned = new Set(warrior.traits ?? []);
  const legacy = new Set(trainer.teachableTraits ?? []);
  return Object.values(TRAITS).filter((t) => {
    if (owned.has(t.id) || t.sign !== 'positive') return false;
    // A legacy trainer can teach traits they personally carried, above their
    // tier ceiling — the scarcity hook: only the retired legend teaches their
    // Signature. Style restriction still applies below.
    if (!withinCeiling(t, ceiling) && !legacy.has(t.id)) return false;
    if (t.styles) return t.styles.includes(warrior.style);
    return true;
  });
}
```

- [ ] **Step 4: Run + typecheck + commit**

Run: `npx vitest run src/test/engine/training/traitTraining.test.ts` → all green (existing pool/roll tests must not regress — the refactor is behavior-identical when `teachableTraits` is absent).
Run: `bunx tsc … | grep -c "error TS"` → `0`.

```bash
git add "src/engine/training/trainingGains/traitTraining.ts" "src/test/engine/training/traitTraining.test.ts"
git commit -m "feat(traits): legacy trainers teach their own former traits above tier ceiling"
```

---

## Task 3: Make legacy conversion actually occur (named knobs)

**Files:**
- Modify: `src/engine/pipeline/passes/WarriorPass.ts`

The current gate (`fame > 500` AND 10%) is likely near-never in practice. Convert to named knobs and loosen modestly so the feature is observable; the liveness diagnostic is the measurement.

- [ ] **Step 1: Extract + loosen the knobs**

In `WarriorPass.ts`, above `runWarriorPass`:

```typescript
/** Retirees at/above this fame can become trainers. Knob (was hard-coded 500). */
export const LEGACY_TRAINER_FAME_THRESHOLD = 300;
/** Chance an eligible retiree enters the hiring pool as a trainer. Knob (was 0.1). */
export const LEGACY_TRAINER_CHANCE = 0.25;
```

and in the legacy block (lines ~25–35) replace `w.fame > 500` with `w.fame >= LEGACY_TRAINER_FAME_THRESHOLD` and `rng.next() < 0.1` with `rng.next() < LEGACY_TRAINER_CHANCE`. Keep the comment.

- [ ] **Step 2: Measure via the liveness harness**

Run: `npx vitest run src/test/engine/sim/worldLiveness.integration.test.ts 2>&1 | grep -E "liveness|Tests "`
Expected: all green (the harness asserts nothing about trainers, so this is a regression + observation run). Optionally add a temporary `console.log(finalState.hiringPool.filter(t => t.retiredFromWarrior).length)` locally to confirm ≥1 legacy trainer appears over 104 weeks; remove it before committing. If zero appear, retirees' fame distribution is below 300 — lower the threshold to 200 and re-measure rather than raising the chance above 0.4.

- [ ] **Step 3: Typecheck + commit**

Run: `bunx tsc … | grep -c "error TS"` → `0`.

```bash
git add "src/engine/pipeline/passes/WarriorPass.ts"
git commit -m "tune(trainers): named legacy-conversion knobs; observable conversion rate"
```

---

## Task 4: Show teachable traits on the trainer UI

**Files:**
- Modify: the trainer card component (locate first)

- [ ] **Step 1: Locate the surface**

Run: `grep -rln "hiringPool\|contractWeeksLeft" src/components src/pages --include="*.tsx" | head`
Pick the component that renders individual trainer cards (likely `src/pages/Trainers.tsx` or a `TrainerCard` component it uses). Also check `src/components/warrior/WarriorTrainingCard.tsx` (~lines 341–388), which renders the trait-trainer selector — both surfaces benefit.

- [ ] **Step 2: Render the badges**

In the trainer card, where trainer metadata (tier/focus/fame) renders, add:

```tsx
{trainer.teachableTraits && trainer.teachableTraits.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-1" title="Traits this legend can personally teach">
    {trainer.teachableTraits.map((id) => (
      <TraitBadge key={id} traitId={id} />
    ))}
  </div>
)}
```

with `import { TraitBadge } from '@/components/warrior/traits/TraitBadge';`. Apply the same block in the trait-trainer selector in `WarriorTrainingCard.tsx` so the player sees the legacy pool when assigning trait training.

- [ ] **Step 3: Typecheck + component tests + commit**

Run: `bunx tsc … | grep -c "error TS"` → `0`; `npx vitest run src/test/pages/Trainers.test.tsx src/test/components 2>&1 | tail -4` → green.

```bash
git add -A
git commit -m "feat(ui): trainer cards show a legend's teachable traits"
```

---

## Task 5: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1:** `npx vitest run 2>&1 | tail -4` → all green (suite fully green as of 2026-07-16); `bunx tsc …` → `0`.
- [ ] **Step 2:** `git add -A && git commit -m "test: verify suite green after legacy trainers" || echo "nothing to commit"`

---

## Self-Review Notes

- **Extend, don't rebuild.** The conversion pipeline, legacy discount, and hiring pool all exist; this plan adds one field, one pool clause, two knobs, and badges. Measured before writing: `teachableTraits` appears **nowhere** in the codebase today.
- **Scarcity is preserved by two real gates:** the trait must have been *carried* by the retiree, and class traits remain style-locked for the learner. The ceiling bypass only widens *which trainer* can teach a high tier — not who can learn it (`canAcquireTrait` + `rollTraitTraining` difficulty unchanged, so a Signature is still a hard roll).
- **AI unaffected.** The rival synthetic coach never has `teachableTraits`, so `legacy.has(t.id)` is always false on that path — behavior-identical.
- **Emotional loop closes.** Death/retirement (permadeath tone) now feeds the training economy: your fallen champion's identity persists as the only source of their Signature.

## Verification

1. `legacyTrainer.test.ts` → conversion snapshots positive traits only.
2. `traitTraining.test.ts` → legacy Signature appears in a Novice legend's pool; style-lock holds; all pre-existing tests green.
3. Liveness harness green; ≥1 legacy trainer observed over 104 weeks (manual check).
4. Trainer card renders `TraitBadge`s; full suite green; typecheck 0.
