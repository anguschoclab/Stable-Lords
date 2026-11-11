# Trait Training (System 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-week **Trait Training** assignment: a warrior trains with a trainer for N weeks, then a risk/reward roll yields a positive trait (random from the trainer's pool), nothing, or a Flaw — gated by a 3-slot cap, a 1-personality-trait rule, conflict groups, and the trainer's tier ceiling.

**Architecture:** Reuse the existing weekly training pipeline. `TrainingAssignment` (`src/types/state.types.ts:208`) gains a `'trait'` variant with `trainerId`/`weeksRemaining`. `computeTrainingImpact` (`src/engine/training.ts:156`) gains a `'trait'` branch that decrements the timer and, on completion, calls a **pure** `rollTraitTraining(...)`. Because `finalizeState` (`src/engine/pipeline/services/weekPipelineService.ts:167`) clears assignments each week, it is tweaked to **retain in-progress trait assignments**. A hidden `trainability` field on `Warrior` (rolled at birth, like potential) feeds aptitude.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest.

**Scope:** System 3. **Depends on System 1** (`tier`/`styles`/`sign`, `traitsForStyle`, `traitsByTier`). The full training-screen UI is a System 7 increment; this plan ships the engine + the assignment-creation action.

**Grounded reconciliations vs the spec:** trainer tiers are **3** (`Novice | Seasoned | Master`), not 5 — ceiling remapped below. `TrainingAssignment` has no duration field — we add `weeksRemaining`.

---

## File Structure

- **Modify** `src/types/state.types.ts` — extend `TrainingAssignment`.
- **Modify** `src/types/warrior.types.ts` — add `trainability?: number`.
- **Modify** `src/engine/factories/warriorFactory.ts` — roll `trainability` at creation.
- **Create** `src/engine/training/trainingGains/traitTraining.ts` — pure ceiling/pool/aptitude/roll + acquisition gating.
- **Create** `src/test/engine/training/traitTraining.test.ts` — unit tests.
- **Modify** `src/engine/training.ts` — `'trait'` branch in `computeTrainingImpact`.
- **Modify** `src/engine/pipeline/services/weekPipelineService.ts` — retain in-progress trait assignments in `finalizeState`.
- **Modify** `src/pages/Training.tsx` — `handleAssignTraitTraining` action.

---

## Task 1: Data model — assignment timer + warrior trainability

**Files:**

- Modify: `src/types/state.types.ts`, `src/types/warrior.types.ts`, `src/engine/factories/warriorFactory.ts`

- [ ] **Step 1: Extend `TrainingAssignment`**

In `src/types/state.types.ts`, change the `TrainingAssignment` interface:

```typescript
export interface TrainingAssignment {
  warriorId: WarriorId;
  type: 'attribute' | 'recovery' | 'skillDrill' | 'trait';
  attribute?: keyof Attributes;
  skill?: keyof BaseSkills;
  /** Trait training: which trainer is teaching (sets the tier ceiling + pool). */
  trainerId?: string;
  /** Trait training: weeks left before the outcome roll. Counts down each week. */
  weeksRemaining?: number;
}
```

- [ ] **Step 2: Add hidden `trainability` to `Warrior`**

In `src/types/warrior.types.ts`, in `interface Warrior`, near `traits`:

```typescript
  /** Hidden 0–1 aptitude for learning new traits, rolled at birth (like potential). */
  trainability?: number;
```

- [ ] **Step 3: Roll `trainability` at creation**

In `src/engine/factories/warriorFactory.ts`, where the warrior object is built (near the `traits` assignment at line ~43), add a field to the returned warrior:

```typescript
const trainability = overrides?.trainability ?? (rng ? 0.4 + rng.next() * 0.5 : 0.65);
```

and include `trainability` on the returned object. (Range 0.4–0.9; default 0.65 when no rng.)

- [ ] **Step 4: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/types/state.types.ts" "src/types/warrior.types.ts" "src/engine/factories/warriorFactory.ts"
git commit -m "feat(traits): trait-training assignment fields + hidden trainability"
```

---

## Task 2: Pure trait-training logic (TDD)

**Files:**

- Create: `src/engine/training/trainingGains/traitTraining.ts`
- Create: `src/test/engine/training/traitTraining.test.ts`

- [ ] **Step 1: Write the failing unit test**

`src/test/engine/training/traitTraining.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import {
  traitTrainingCeiling,
  traitTrainingPool,
  canAcquireTrait,
  rollTraitTraining,
  TRAIT_TRAIN_WEEKS,
} from '@/engine/training/trainingGains/traitTraining';
import { SeededRNGService } from '@/utils/random';

const trainer = (tier: 'Novice' | 'Seasoned' | 'Master') => ({ id: 't', name: 'T', tier }) as any;
const warrior = (over: any = {}) =>
  ({
    id: 'w',
    style: FightingStyle.WallOfSteel,
    traits: [],
    age: 22,
    attributes: { ST: 12, CN: 12, SZ: 10, WT: 12, WL: 12, SP: 12, DF: 12 },
    trainability: 0.7,
    ...over,
  }) as any;

describe('traitTrainingCeiling', () => {
  it('maps the 3 trainer tiers to a max trait tier', () => {
    expect(traitTrainingCeiling('Novice')).toBe('Notable');
    expect(traitTrainingCeiling('Seasoned')).toBe('Exceptional');
    expect(traitTrainingCeiling('Master')).toBe('Signature');
  });
});

describe('traitTrainingPool', () => {
  it("includes the warrior's class traits and generic positives up to the ceiling, excluding owned", () => {
    const pool = traitTrainingPool(warrior({ traits: ['braced'] }), trainer('Master'));
    expect(pool.some((t) => t.id === 'living_wall')).toBe(true); // WS Signature, Master ceiling
    expect(pool.some((t) => t.id === 'braced')).toBe(false); // already owned
    expect(pool.every((t) => t.sign === 'positive')).toBe(true);
    // a different class's trait must not appear
    expect(
      pool.some(
        (t) =>
          t.styles?.includes(FightingStyle.AimedBlow) &&
          !t.styles?.includes(FightingStyle.WallOfSteel)
      )
    ).toBe(false);
  });

  it('a Novice trainer cannot reach Signature traits', () => {
    const pool = traitTrainingPool(warrior(), trainer('Novice'));
    expect(pool.some((t) => t.tier === 'Signature' || t.tier === 'Exceptional')).toBe(false);
  });
});

describe('canAcquireTrait', () => {
  it('blocks at the 3-trait cap', () => {
    expect(canAcquireTrait(warrior({ traits: ['a', 'b', 'c'] }), 'quick')).toBe(false);
  });
  it('blocks a second personality (fightPlanMod) trait', () => {
    // 'brutal' and 'aggressive' are both personality traits
    expect(canAcquireTrait(warrior({ traits: ['brutal'] }), 'aggressive')).toBe(false);
  });
  it('blocks a conflicting trait', () => {
    expect(canAcquireTrait(warrior({ traits: ['quick'] }), 'slow')).toBe(false);
  });
  it('allows an otherwise-valid trait', () => {
    expect(canAcquireTrait(warrior({ traits: ['quick'] }), 'agile')).toBe(true);
  });
});

describe('rollTraitTraining', () => {
  it('a Master trainer + apt warrior mostly succeeds; results are valid traits or flaws', () => {
    const rng = new SeededRNGService('roll');
    let success = 0,
      botch = 0,
      none = 0;
    for (let i = 0; i < 300; i++) {
      const r = rollTraitTraining(warrior(), trainer('Master'), rng);
      if (r.outcome === 'success') {
        success++;
        expect(typeof r.traitId).toBe('string');
      } else if (r.outcome === 'botch') {
        botch++;
        expect(typeof r.traitId).toBe('string');
      } else none++;
    }
    expect(success).toBeGreaterThan(botch); // apt + Master ⇒ success-weighted
    expect(success + botch + none).toBe(300);
  });

  it('exposes the standard training duration', () => {
    expect(TRAIT_TRAIN_WEEKS).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL (module not found)**

Run: `npx vitest run src/test/engine/training/traitTraining.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the pure logic**

`src/engine/training/trainingGains/traitTraining.ts`:

```typescript
import type { IRNGService } from '@/engine/services/rngService'; // confirm path: grep "IRNGService"
import type { Warrior } from '@/types/warrior.types';
import type { Trainer, TrainerTier } from '@/types/shared.types';
import { TRAITS, traitsForStyle, type TraitDef, type TraitTier } from '@/engine/traits';

export const TRAIT_TRAIN_WEEKS = 4;
export const TRAIT_CAP = 3;

const CEILING: Record<TrainerTier, TraitTier> = {
  Novice: 'Notable',
  Seasoned: 'Exceptional',
  Master: 'Signature',
};
const TIER_ORDER: TraitTier[] = ['Common', 'Notable', 'Exceptional', 'Signature'];

/** Directly contradictory pairs — a conflict blocks acquisition. */
const CONFLICT_GROUPS: string[][] = [
  ['quick', 'slow'],
  ['agile', 'fragile'],
  ['aggressive', 'evasive', 'sturdy', 'timid', 'coward'], // opposing fightplan intents
  ['heavy_handed', 'clumsy'],
];

export function traitTrainingCeiling(tier: TrainerTier): TraitTier {
  return CEILING[tier];
}

const withinCeiling = (t: TraitDef, ceiling: TraitTier) =>
  t.tier !== 'Flaw' && TIER_ORDER.indexOf(t.tier) <= TIER_ORDER.indexOf(ceiling);

/** Positive traits a session can yield: generic + the warrior's class traits, ≤ ceiling, not owned. */
export function traitTrainingPool(warrior: Warrior, trainer: Trainer): TraitDef[] {
  const ceiling = traitTrainingCeiling(trainer.tier);
  const owned = new Set(warrior.traits ?? []);
  return Object.values(TRAITS).filter((t) => {
    if (owned.has(t.id) || t.sign !== 'positive' || !withinCeiling(t, ceiling)) return false;
    if (t.styles) return t.styles.includes(warrior.style); // class trait: must match style
    return true; // generic positive
  });
}

const isPersonality = (id: string) => !!TRAITS[id]?.effect?.fightPlanMod;

export function conflictsWith(traitId: string, existing: string[]): boolean {
  return CONFLICT_GROUPS.some((g) => g.includes(traitId) && existing.some((e) => g.includes(e)));
}

/** Cap, single-personality, and conflict gating. */
export function canAcquireTrait(warrior: Warrior, traitId: string): boolean {
  const traits = warrior.traits ?? [];
  if (traits.length >= TRAIT_CAP) return false;
  if (traits.includes(traitId)) return false;
  if (isPersonality(traitId) && traits.some(isPersonality)) return false;
  if (conflictsWith(traitId, traits)) return false;
  return true;
}

function aptitude(warrior: Warrior, trainer: Trainer): number {
  const a = warrior.attributes;
  const mind = (a.WT + a.WL) / 50; // ~0.3–0.7
  const youth = Math.max(0, (30 - (warrior.age ?? 24)) / 30); // younger ⇒ higher
  const train = warrior.trainability ?? 0.6;
  return mind * 0.4 + youth * 0.3 + train * 0.3; // ~0–1
}

const TIER_DIFFICULTY: Record<TraitTier, number> = {
  Common: 0,
  Notable: 0.1,
  Exceptional: 0.25,
  Signature: 0.4,
  Flaw: 0,
};

/** Resolve a completed trait-training session. Pure given the rng. */
export function rollTraitTraining(
  warrior: Warrior,
  trainer: Trainer,
  rng: IRNGService
): { outcome: 'success' | 'none' | 'botch'; traitId?: string } {
  const pool = traitTrainingPool(warrior, trainer).filter((t) => canAcquireTrait(warrior, t.id));
  if (pool.length === 0) return { outcome: 'none' };

  // Pick a candidate (weighted toward lower tiers so Signature is rare).
  const candidate = pickWeighted(pool, rng);
  const apt = aptitude(warrior, trainer);
  const successChance = Math.max(
    0.05,
    Math.min(0.9, 0.35 + apt * 0.5 - TIER_DIFFICULTY[candidate.tier])
  );
  const botchChance = Math.max(
    0.02,
    Math.min(0.4, 0.2 - apt * 0.15 + TIER_DIFFICULTY[candidate.tier])
  );

  const r = rng.next();
  if (r < successChance) return { outcome: 'success', traitId: candidate.id };
  if (r > 1 - botchChance) {
    const flaws = Object.values(TRAITS).filter(
      (t) => t.tier === 'Flaw' && canAcquireTrait(warrior, t.id)
    );
    if (flaws.length === 0) return { outcome: 'none' };
    return { outcome: 'botch', traitId: pickWeighted(flaws, rng).id };
  }
  return { outcome: 'none' };
}

function pickWeighted(pool: TraitDef[], rng: IRNGService): TraitDef {
  // Lower tiers more likely; weight = trait.weight × tier-rarity factor.
  const tierFactor: Record<TraitTier, number> = {
    Common: 1,
    Notable: 0.7,
    Exceptional: 0.4,
    Signature: 0.2,
    Flaw: 1,
  };
  let total = 0;
  const w = pool.map((t) => {
    const x = (t.weight ?? 0.5) * tierFactor[t.tier];
    total += x;
    return x;
  });
  let target = rng.next() * total;
  for (let i = 0; i < pool.length; i++) {
    target -= w[i]!;
    if (target <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}
```

> Confirm imports: `grep -rn "export.*IRNGService" src` and `grep -n "TraitTier\|TraitDef\|traitsForStyle" src/engine/traits.ts`. Adjust the `IRNGService` import path if needed. `traitsForStyle` is imported for parity but the filter above uses `TRAITS` directly — drop the unused import if lint complains.

- [ ] **Step 4: Run the test — expect PASS + typecheck**

Run: `npx vitest run src/test/engine/training/traitTraining.test.ts` → PASS.
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/training/trainingGains/traitTraining.ts" "src/test/engine/training/traitTraining.test.ts"
git commit -m "feat(traits): pure trait-training roll, pool, ceiling, and acquisition gating"
```

---

## Task 3: Wire into the weekly training pipeline

**Files:**

- Modify: `src/engine/training.ts`
- Modify: `src/engine/pipeline/services/weekPipelineService.ts`

- [ ] **Step 1: Handle the `'trait'` assignment in `computeTrainingImpact`**

In `src/engine/training.ts`, inside the `for (const assignment of state.trainingAssignments)` loop (around line 174, alongside the recovery/skillDrill/attribute branches), add **before** the attribute branch:

```typescript
if (assignment.type === 'trait') {
  const remaining = (assignment.weeksRemaining ?? 1) - 1;
  if (remaining > 0) continue; // still training; the assignment survives finalizeState (Step 2)
  const trainer = (state.trainers ?? []).find((t) => t.id === assignment.trainerId);
  if (!trainer) continue;
  const roll = rollTraitTraining(warrior, trainer, rng);
  if (roll.outcome !== 'none' && roll.traitId) {
    const updated = { ...warrior, traits: [...(warrior.traits ?? []), roll.traitId] };
    currentRoster.set(warrior.id, updated);
    results.push({
      warriorId: warrior.id,
      type: 'gain',
      message:
        roll.outcome === 'success'
          ? `${warrior.name} learned a new trait: ${TRAITS[roll.traitId]?.name}.`
          : `${warrior.name}'s training went wrong — gained a flaw: ${TRAITS[roll.traitId]?.name}.`,
    });
  } else {
    results.push({
      warriorId: warrior.id,
      type: 'gain',
      message: `${warrior.name}'s trait training yielded nothing.`,
    });
  }
  continue;
}
```

Add imports at the top of `training.ts`: `import { rollTraitTraining } from '@/engine/training/trainingGains/traitTraining';` and `import { TRAITS } from '@/engine/traits';` (if not already imported). Confirm the `TrainingResult` shape accepts `type: 'gain'` + `message` (grep `interface TrainingResult`).

- [ ] **Step 2: Keep in-progress trait assignments through `finalizeState`**

In `src/engine/pipeline/services/weekPipelineService.ts`, `finalizeState` currently does `state.trainingAssignments = [];`. Replace with a filter that retains decremented trait assignments:

```typescript
state.trainingAssignments = (state.trainingAssignments ?? [])
  .filter((a) => a.type === 'trait' && (a.weeksRemaining ?? 0) > 1)
  .map((a) => ({ ...a, weeksRemaining: (a.weeksRemaining ?? 0) - 1 }));
```

> This decrements the _survivor_ copy here while `computeTrainingImpact` (Step 1) reads the pre-decrement value to detect completion (`remaining = weeksRemaining − 1`, completes at 0). Keep the two in sync: an assignment created with `weeksRemaining = TRAIT_TRAIN_WEEKS` completes after exactly that many weeks.

- [ ] **Step 3: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 4: Commit**

```bash
git add "src/engine/training.ts" "src/engine/pipeline/services/weekPipelineService.ts"
git commit -m "feat(traits): process multi-week trait training in the weekly pipeline"
```

---

## Task 4: Assignment-creation action

**Files:**

- Modify: `src/pages/Training.tsx`

- [ ] **Step 1: Add the assign handler**

Mirroring the existing `handleAssign` (`Training.tsx:61`), add:

```typescript
const handleAssignTraitTraining = (warriorId: WarriorId, trainerId: string) => {
  setState((s: GameStore) => {
    s.trainingAssignments = [
      ...(s.trainingAssignments ?? []).filter((a: TrainingAssignment) => a.warriorId !== warriorId),
      { warriorId, type: 'trait', trainerId, weeksRemaining: TRAIT_TRAIN_WEEKS },
    ];
  });
  toast.success('Trait training assigned — outcome in a few weeks.');
};
```

Import `TRAIT_TRAIN_WEEKS` from `@/engine/training/trainingGains/traitTraining`. The full picker UI (choose a trainer, show ceiling + aptitude + odds) is the **System 7** increment; this step exposes the action the UI will call.

- [ ] **Step 2: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`

```bash
git add "src/pages/Training.tsx"
git commit -m "feat(traits): expose trait-training assignment action"
```

---

## Task 5: Integration test + full suite

**Files:**

- Create: `src/test/engine/training/traitTraining.integration.test.ts`

- [ ] **Step 1: Drive a full training cycle**

```typescript
import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';
import { TRAIT_TRAIN_WEEKS } from '@/engine/training/trainingGains/traitTraining';

describe('trait training (integration)', () => {
  it('a blank warrior assigned to a Master trainer resolves after N weeks', () => {
    let state = createFreshState('train-int');
    const rng = new SeededRNGService('w');
    const w = makeWarrior(
      rng.uuid() as any,
      'Tyro',
      FightingStyle.WallOfSteel,
      { ST: 12, CN: 12, SZ: 10, WT: 14, WL: 14, SP: 12, DF: 12 },
      { traits: [], age: 20 }
    );
    state.roster = [w];
    state.trainers = [
      {
        id: 'm',
        name: 'Master',
        tier: 'Master',
        focus: 'Defense',
        fame: 0,
        age: 50,
        contractWeeksLeft: 99,
      } as any,
    ];
    state.trainingAssignments = [
      { warriorId: w.id, type: 'trait', trainerId: 'm', weeksRemaining: TRAIT_TRAIN_WEEKS },
    ];

    for (let i = 0; i < TRAIT_TRAIN_WEEKS; i++) state = advanceWeek(state);

    const after = state.roster.find((x) => x.id === w.id)!;
    // Either gained a trait/flaw or nothing — but the assignment is consumed and the warrior is intact.
    expect(after).toBeDefined();
    expect(state.trainingAssignments.some((a) => a.warriorId === w.id)).toBe(false);
  });
});
```

Run: `npx vitest run src/test/engine/training/traitTraining.integration.test.ts`
Expected: PASS. (If `advanceWeek`'s signature differs, match the call used in `simulation-harness.ts`.)

- [ ] **Step 2: Full suite + typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4` → green.

```bash
git add "src/test/engine/training/traitTraining.integration.test.ts"
git commit -m "test(traits): trait-training end-to-end weekly cycle"
```

---

## Self-Review Notes

- **The roll is pure; the pipeline is thin.** All risk/pool/cap/conflict logic lives in `traitTraining.ts` and is unit-tested; `computeTrainingImpact` just times it and applies the result.
- **Duration handling is the subtle bit.** `computeTrainingImpact` detects completion at `weeksRemaining − 1 === 0`; `finalizeState` retains+decrements survivors. Keep both edits in sync (Task 3).
- **Permanent + capped.** Acquisition gating enforces the 3-slot cap, the 1-personality rule, and conflicts; a botch that fills the last slot is permanent — that is the churn pressure (System 4/5 consume it).
- **Class traits are earned here.** A class Signature only appears for a matching-style warrior under a Master trainer — exactly the prestige path the design intends.

## Verification

1. `npx vitest run src/test/engine/training/` → unit + integration green.
2. A Novice trainer never yields Exceptional/Signature; a Master can; class traits only match the warrior's style.
3. Cap/conflict/personality gating holds; flaws can result from botches.
4. `bunx tsc …` → 0; full `npx vitest run` green.
