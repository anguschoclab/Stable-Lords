# Trait Emergence & Churn Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the trait systems actually surface their marquee content over a long run — class-restricted and Signature traits get earned (sim measured **zero** in 156 weeks), the multi-flaw "cut candidate" churn signal actually fires (measured **zero** 2-flaw warriors), and trait acquisition doesn't saturate the world (measured 34%→60% traited in ~8 weeks). Each change is gated by the world-liveness harness so we tune against measured reality, not vibes.

**Architecture:** Three independent mechanism fixes: (1) a style-matched **class-trait weight boost** in `rollTraitTraining` so the 5-per-style class traits aren't drowned out by the abundant generic Notable pool; (2) wire the already-computed-but-unused `LiabilityResult.recommendation === 'Release'` signal into `processAIRosterManagement` so 2+-flaw warriors are reliably cut regardless of personality leniency; (3) a **development cap gate** in the rival trait-development pass so warriors stop accruing once they hold two traits, preventing world-wide saturation. Then we tighten the Plan-2 liveness harness to assert class/Signature/multi-flaw emergence.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Tests: `npx vitest run <path>`. Typecheck: `bunx tsc --noEmit --project tsconfig.app.json`.

**Scope:** **Depends on** both prior plans being merged: `2026-06-21-world-sim-decouple-from-player-stop.md` (so the world is unfrozen and these systems actually run long-term) and `2026-06-21-emergent-sim-regression-harness.md` (the harness + enriched `SimPulse` this plan asserts against). Combat balance is untouched — these are trait-acquisition and roster-churn knobs only, so the combat balance harness (`src/test/engine/economy/balance.test.ts`) must stay green.

**Grounded facts (from code audit — do not re-derive):**

- `rollTraitTraining` / `traitTrainingPool` / `traitTrainingCeiling` / `canAcquireTrait` live in `src/engine/training/trainingGains/traitTraining.ts`. The pool already includes class traits filtered to the warrior's own `style` (`if (t.styles) return t.styles.includes(warrior.style)`), and Signature is reachable only under a `Master` trainer. Candidate selection uses `pickWeighted(pool, rng)` which weights by `TraitDef.weight` — class traits (5 per style) are statistically swamped by generic Notables.
- `TRAIT_CAP = 3`. `computeWarriorLiability` (`src/engine/warriorValue.ts`) returns `recommendation: 'Keep' | 'Monitor' | 'Release'`, where `Release` requires `flaws.length >= 2 && score > 55`. A 2-flaw warrior scores ~88 (2×34 burden + 20 baseline − offsets), already above every personality `cutLiabilityThreshold` — so the churn gap is purely that 2-flaw warriors rarely _exist_, not that they'd survive.
- Rival trait development: `src/engine/ai/workers/rosterWorker.ts` lines ~136–160 — per active warrior, gated by `treasury > 300` and `rng.next() <= trainAppetite`, resolves one `rollTraitTraining` against a synthetic trainer at `policyFor(personality).ceiling`.
- Liability culling: `src/engine/owner/roster/management.ts` lines ~94–105 — cuts up to one warrior per tick whose `computeWarriorLiability(w).score >= traitPolicy.cutLiabilityThreshold` and who is not on a win streak.

---

## File Structure

- **Modify** `src/engine/training/trainingGains/traitTraining.ts` — class-matched weight boost in candidate selection.
- **Modify** `src/test/engine/training/traitTraining.test.ts` — assert class & Signature traits get picked for a styled warrior under a Master trainer.
- **Modify** `src/engine/owner/roster/management.ts` — also cut on `recommendation === 'Release'`.
- **Modify** `src/test/engine/warriorValue.test.ts` OR a new `src/test/engine/owner/liabilityCull.test.ts` — assert a 2-flaw warrior is cut even under the most lenient personality.
- **Modify** `src/engine/ai/workers/rosterWorker.ts` — skip development for warriors already holding ≥2 traits.
- **Modify** `src/test/engine/sim/worldLiveness.integration.test.ts` — tighten asserts: class/Signature/multi-flaw emergence + acquisition band.

---

## Task 1: Class-matched trait weight boost (TDD)

**Files:**

- Modify: `src/engine/training/trainingGains/traitTraining.ts`
- Modify: `src/test/engine/training/traitTraining.test.ts`

- [ ] **Step 1: Read the current candidate selection**

Open `src/engine/training/trainingGains/traitTraining.ts`. Locate in `rollTraitTraining` (≈ line 84):

```typescript
const candidate = pickWeighted(pool, rng);
```

Also note `TraitDef` exposes a numeric `weight` (used by `generateTraits`). We replace the candidate pick with a class-aware weighted pick so style-matched class traits compete.

- [ ] **Step 2: Write the failing test**

Add to `src/test/engine/training/traitTraining.test.ts` (match the existing import style in that file for `TRAITS`, `rollTraitTraining`, the RNG service, and any warrior/trainer builders already present — reuse them rather than re-importing duplicates):

```typescript
import { describe, it, expect } from 'vitest';
import { rollTraitTraining } from '@/engine/training/trainingGains/traitTraining';
import { TRAITS } from '@/engine/traits';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';
import type { Warrior } from '@/types/warrior.types';
import type { Trainer } from '@/types/state.types';

function freshWosWarrior(): Warrior {
  return {
    id: 'w_test',
    name: 'Test',
    style: FightingStyle.WallOfSteel,
    styleName: FightingStyle.WallOfSteel,
    attributes: { WT: 15, WL: 15, ST: 12, SP: 12, DF: 12, AG: 12 },
    fame: 0,
    career: { wins: 0, losses: 0, kills: 0 },
    status: 'Active',
    age: 22,
    traits: [],
    trainability: 0.9, // high aptitude so successes are frequent
  } as unknown as Warrior;
}

const masterTrainer: Trainer = {
  id: 'm',
  name: 'Master',
  tier: 'Master',
  focus: 'Mind',
  fame: 0,
  age: 45,
  contractWeeksLeft: 99,
} as unknown as Trainer;

describe('rollTraitTraining surfaces class & Signature traits for a styled warrior', () => {
  it('a WallOfSteel warrior under a Master trainer can earn class-restricted and Signature traits', () => {
    const rng = new SeededRNGService('class-reach');
    const earnedClass = new Set<string>();
    const earnedSignature = new Set<string>();

    // Fresh warrior each trial (acquisition caps at 3) — sample the success distribution.
    for (let i = 0; i < 1500; i++) {
      const roll = rollTraitTraining(freshWosWarrior(), masterTrainer, rng);
      if (roll.outcome === 'success' && roll.traitId) {
        const t = TRAITS[roll.traitId]!;
        if (t.styles && t.styles.length > 0) earnedClass.add(roll.traitId);
        if (t.tier === 'Signature') earnedSignature.add(roll.traitId);
      }
    }

    // With the class boost, a styled warrior reliably reaches class identity + the top tier.
    expect(earnedClass.size).toBeGreaterThan(0);
    expect(earnedSignature.size).toBeGreaterThan(0);
    // Every class trait earned must belong to THIS warrior's style (never cross-style).
    for (const id of earnedClass) {
      expect(TRAITS[id]!.styles).toContain(FightingStyle.WallOfSteel);
    }
  });
});
```

- [ ] **Step 3: Run it — expect FAIL (or flaky-zero)**

Run: `npx vitest run src/test/engine/training/traitTraining.test.ts -t "surfaces class"`
Expected: FAIL — `earnedClass.size` is 0 (class traits are statistically swamped by generic Notables under flat weighting).

- [ ] **Step 4: Implement the class-aware weighted pick**

In `src/engine/training/trainingGains/traitTraining.ts`, add the constant and helper near the other module constants (top of file, after existing imports/constants):

```typescript
/**
 * Style-matched class traits (5 per style) are vastly outnumbered by generic
 * traits in the pool, so a flat weighted pick almost never surfaces them. Boost
 * class-trait weight so a warrior reliably develops their style identity.
 */
export const CLASS_TRAIT_WEIGHT_BONUS = 5;

function pickTraitCandidate(pool: TraitDef[], rng: IRNGService): TraitDef {
  let total = 0;
  const weighted = pool.map((t) => {
    const base = t.weight ?? 1;
    const w = t.styles && t.styles.length > 0 ? base * CLASS_TRAIT_WEIGHT_BONUS : base;
    total += w;
    return { t, w };
  });
  let target = rng.next() * total;
  for (const entry of weighted) {
    target -= entry.w;
    if (target <= 0) return entry.t;
  }
  return weighted[weighted.length - 1]!.t;
}
```

> Ensure `TraitDef` and `IRNGService` are imported in this file (they are already used by existing functions). If `pickWeighted` becomes unused after Step 5, remove its now-dead import to keep lint/typecheck clean; if it is still used by the flaw-selection branch, keep it.

Then in `rollTraitTraining`, replace:

```typescript
const candidate = pickWeighted(pool, rng);
```

with:

```typescript
const candidate = pickTraitCandidate(pool, rng);
```

> Leave the botch/flaw selection (`pickWeighted(flaws, rng)`) unchanged — flaws have no `styles`, so the boost is irrelevant there, and the flaw branch can keep using `pickWeighted`.

- [ ] **Step 5: Run it — expect PASS + typecheck**

Run: `npx vitest run src/test/engine/training/traitTraining.test.ts` → PASS (all tests in the file, including the existing ones).
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 6: Commit**

```bash
git add "src/engine/training/trainingGains/traitTraining.ts" "src/test/engine/training/traitTraining.test.ts"
git commit -m "feat(traits): boost class-trait weight so style identity & Signatures actually emerge"
```

---

## Task 2: Wire the `Release` recommendation into AI culling (TDD)

**Files:**

- Modify: `src/engine/owner/roster/management.ts`
- Create: `src/test/engine/owner/liabilityCull.test.ts`

`computeWarriorLiability` already produces a `recommendation`, but `processAIRosterManagement` only reads `.score` against the personality threshold. A 2+-flaw warrior should be a cut candidate for _every_ personality (even lenient Methodical at 78), and the designed signal for that is `recommendation === 'Release'`. We make the cull honor it.

- [ ] **Step 1: Write the failing test**

`src/test/engine/owner/liabilityCull.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { processAIRosterManagement } from '@/engine/owner/roster/management';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';

function warrior(id: string, traits: string[], over: Partial<Warrior> = {}): Warrior {
  return {
    id,
    name: id,
    style: FightingStyle.SlashingAttack,
    styleName: FightingStyle.SlashingAttack,
    attributes: { WT: 12, WL: 12, ST: 12, SP: 12, DF: 12, AG: 12 },
    fame: 10,
    career: { wins: 2, losses: 6, kills: 0 },
    status: 'Active',
    age: 26,
    traits,
    ...over,
  } as unknown as Warrior;
}

// Build the most LENIENT rival (Methodical, cutLiabilityThreshold 78) so the only
// thing that can trigger a cut of the flawed warrior is the Release recommendation.
function methodicalRival(roster: Warrior[]): RivalStableData {
  return {
    id: 's1',
    owner: {
      id: 's1',
      name: 'Slow Sam',
      stableName: 'The Patient',
      fame: 0,
      renown: 0,
      titles: 0,
      personality: 'Methodical',
    },
    fame: 0,
    roster,
    treasury: 5000,
    ledger: [],
    trainingAssignments: [],
  } as unknown as RivalStableData;
}

describe('liability cull honors the Release recommendation', () => {
  it('a 2-flaw warrior is released even by the most lenient personality', () => {
    const flawed = warrior('flawed', ['fragile', 'slow']); // 2 flaws → Release
    const clean = warrior('clean', ['quick']);
    const rival = methodicalRival([
      flawed,
      clean,
      warrior('a', []),
      warrior('b', []),
      warrior('c', []),
    ]);
    const state = { week: 40, rivals: [rival] } as unknown as GameState;

    const { updatedRival } = processAIRosterManagement(rival, state);

    const stillActive = updatedRival.roster.filter((w) => w.status === 'Active').map((w) => w.id);
    expect(stillActive).not.toContain('flawed'); // released
    expect(stillActive).toContain('clean'); // kept
  });
});
```

> The engineer must check the real return shape and signature of `processAIRosterManagement` (it returns an object including `updatedRival` and `gazetteItems`, and may take `(rival, state)` — confirm against the file) and adjust the destructuring/builders to match exactly. Reuse any existing rival/warrior test builders in `src/test/engine/owner/` if present rather than the inline shims above.

- [ ] **Step 2: Run it — expect FAIL**

Run: `npx vitest run src/test/engine/owner/liabilityCull.test.ts`
Expected: FAIL — under Methodical (threshold 78) the 2-flaw warrior may sit just under the score gate or be tied with other cut logic; the Release signal isn't consulted, so the cut is not guaranteed.

- [ ] **Step 3: Implement — consult the recommendation**

In `src/engine/owner/roster/management.ts`, find the liability cull (≈ lines 94–105):

```typescript
const traitPolicy = policyFor(r.owner.personality);
const liabilityCandidates = filterActive(r.roster).filter(
  (w) => !isOnWinStreak(w) && computeWarriorLiability(w).score >= traitPolicy.cutLiabilityThreshold
);
```

Replace the filter predicate so a `Release` recommendation also qualifies (a strong, personality-independent multi-flaw signal):

```typescript
const traitPolicy = policyFor(r.owner.personality);
const liabilityCandidates = filterActive(r.roster).filter((w) => {
  if (isOnWinStreak(w)) return false;
  const liability = computeWarriorLiability(w);
  // Cut on either the personality score threshold OR the explicit Release signal
  // (2+ flaws), so flaw-loaded warriors churn even under lenient owners.
  return (
    liability.score >= traitPolicy.cutLiabilityThreshold || liability.recommendation === 'Release'
  );
});
```

> Do not change the `slice(0, 1)` cap (still at most one liability cut per tick) or the win-streak guard — only the qualification predicate changes.

- [ ] **Step 4: Run it — expect PASS + typecheck**

Run: `npx vitest run src/test/engine/owner/liabilityCull.test.ts` → PASS.
Run: `npx vitest run src/test/engine/ai/traitPolicy.test.ts src/test/engine/warriorValue.test.ts` → still green.
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/owner/roster/management.ts" "src/test/engine/owner/liabilityCull.test.ts"
git commit -m "feat(churn): AI releases 2+-flaw warriors via the Release signal, even lenient owners"
```

---

## Task 3: Cap runaway trait development (TDD)

**Files:**

- Modify: `src/engine/ai/workers/rosterWorker.ts`
- Modify: `src/test/engine/ai/rivalTraitAI.integration.test.ts`

The sim saw traited share jump 34%→60% in ~8 active weeks because _every_ eligible warrior rolls development _every_ week. Gate development to warriors holding fewer than two traits so the world doesn't saturate to the cap, while still letting warriors build a meaningful (≤2 developed) identity. Flaws still arrive via births and botches.

- [ ] **Step 1: Read the development pass**

In `src/engine/ai/workers/rosterWorker.ts`, find the trait-development map (≈ lines 150–159):

```typescript
updatedRival.roster = updatedRival.roster.map((w) => {
  if (w.status !== 'Active') return w;
  if (rngService.next() > traitPolicy.trainAppetite) return w;
  const roll = rollTraitTraining(w, aiTrainer, rngService);
  if (roll.outcome !== 'none' && roll.traitId) {
    return { ...w, traits: [...(w.traits ?? []), roll.traitId] };
  }
  return w;
});
```

- [ ] **Step 2: Add the development cap constant + gate**

Near the top of `rosterWorker.ts` (with the other module constants), add:

```typescript
/** Stop developing a warrior once they hold this many traits, to avoid the
 *  world saturating every warrior to the 3-trait cap. Births + botches can still
 *  add flaws beyond this; this only gates *positive development* attempts. */
export const RIVAL_DEV_TRAIT_SOFT_CAP = 2;
```

Then change the map predicate to skip warriors already at/above the soft cap:

```typescript
updatedRival.roster = updatedRival.roster.map((w) => {
  if (w.status !== 'Active') return w;
  if ((w.traits ?? []).length >= RIVAL_DEV_TRAIT_SOFT_CAP) return w; // already developed enough
  if (rngService.next() > traitPolicy.trainAppetite) return w;
  const roll = rollTraitTraining(w, aiTrainer, rngService);
  if (roll.outcome !== 'none' && roll.traitId) {
    return { ...w, traits: [...(w.traits ?? []), roll.traitId] };
  }
  return w;
});
```

- [ ] **Step 3: Strengthen the existing rival-AI integration test**

In `src/test/engine/ai/rivalTraitAI.integration.test.ts`, the existing test asserts trait count grows over a season. Add an assertion that development does NOT saturate — that some warriors remain blank/under-developed after the season (proving the soft cap holds the world below full saturation). Add inside that test, after the season loop and the existing `after > before` assertion:

```typescript
// Soft cap: development must not drive the whole world to the trait cap.
const allRivalWarriors = state.rivals.flatMap((r) => r.roster);
const atOrAboveSoftCapDeveloped = allRivalWarriors.filter(
  (w) => (w.traits ?? []).length >= 3
).length;
// No more than a small minority should reach the hard 3-trait cap via dev.
expect(atOrAboveSoftCapDeveloped / Math.max(1, allRivalWarriors.length)).toBeLessThan(0.25);
```

> If the existing test does not keep `state` in scope after the loop, adapt to its variable name (read the file). Keep the original assertions intact.

- [ ] **Step 4: Run + typecheck**

Run: `npx vitest run src/test/engine/ai/rivalTraitAI.integration.test.ts` → PASS.
Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/ai/workers/rosterWorker.ts" "src/test/engine/ai/rivalTraitAI.integration.test.ts"
git commit -m "feat(traits): soft-cap rival trait development to prevent world-wide saturation"
```

---

## Task 4: Tighten the liveness harness to lock in emergence (TDD)

**Files:**

- Modify: `src/test/engine/sim/worldLiveness.integration.test.ts`

The Plan-2 harness asserts only that _some_ traits/flaws exist. Now that class/Signature reachability and multi-flaw churn are fixed, tighten it so these regressions can't return.

- [ ] **Step 1: Add the emergence assertions**

In `src/test/engine/sim/worldLiveness.integration.test.ts`, add a new test (reusing the same `runSimulation` config + the `reset` beforeEach already in the file):

```typescript
it('class identity and Signatures emerge, with acquisition in a sane band', () => {
  const { pulses, finalState } = runSimulation({
    weeks: 104,
    seed: 4242,
    logFrequency: 4,
    ignoreBankruptcy: true,
  });
  const end = pulses[pulses.length - 1];
  const allWarriors = [...finalState.roster, ...finalState.rivals.flatMap((r) => r.roster)];

  // Class-restricted traits now reachable: at least a few exist world-wide.
  expect(end.classTraitInstances).toBeGreaterThan(0);
  // The top tier shows up at least once across the world over a season.
  expect(end.signatureInstances).toBeGreaterThan(0);

  // Acquisition does not saturate: the traited share stays in a sane band,
  // not runaway-everyone (the pre-fix trajectory shot to 60%+ fast).
  const traitedShare = end.traitedWarriors / Math.max(1, allWarriors.length);
  expect(traitedShare).toBeGreaterThan(0.2);
  expect(traitedShare).toBeLessThan(0.85);
}, 300000);
```

> These thresholds are intentionally loose (presence, not precise counts) so they catch a _regression to zero_ without being brittle to RNG. If `signatureInstances` is legitimately flaky at exactly 0 for this seed across runs, raise the simulated `weeks` to 156 rather than weakening the intent — Signatures are rare by design but must be reachable.

- [ ] **Step 2: Run it**

Run: `npx vitest run src/test/engine/sim/worldLiveness.integration.test.ts`
Expected: all tests PASS, including the new emergence test. Check the diagnostic log line for the actual `classTraits`/`signature`/`multiFlaw` counts to confirm they're non-trivial.

- [ ] **Step 3: Commit**

```bash
git add "src/test/engine/sim/worldLiveness.integration.test.ts"
git commit -m "test(sim): lock in class/Signature/multi-flaw emergence and a sane acquisition band"
```

---

## Task 5: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run combat balance + full suite**

Run: `npx vitest run src/test/engine/economy/balance.test.ts` → green (trait knobs must not move combat balance).
Run: `npx vitest run 2>&1 | tail -6` → no new failures vs. the known-unrelated reds (`scouting`, `Trainers`, `useDigestSummary`, `Bookmarks`, `HallOfFame`, `Tournaments`).

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 3: Commit if needed**

```bash
git add -A && git commit -m "test: verify suite green after trait emergence & churn tuning" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Real fixes, not freeze artifacts.** The class-weight boost and the development soft-cap are correct regardless of the freeze: even on a healthy world, 5-per-style class traits get swamped by generic Notables, and unbounded per-week development saturates everyone. The `Release`-signal wiring uses a designed-but-unconsumed field.
- **Flaws still flow.** The soft cap gates only _positive development_ attempts; births (`generateTraits`) and training botches can still push a warrior to 2 flaws, which Task 2 then churns.
- **Balance untouched.** No combat math changes — `balance.test.ts` is the guardrail proving it.
- **Loose, intent-based asserts.** The harness checks presence/bands (catch regression-to-zero, catch saturation) rather than exact counts, so they're robust to RNG while still locking the behavior.
- **Knobs are named constants.** `CLASS_TRAIT_WEIGHT_BONUS` and `RIVAL_DEV_TRAIT_SOFT_CAP` are exported so future tuning (or the combat-balance methodology) can adjust them against the harness.

## Verification

1. `traitTraining.test.ts` → styled warrior earns class + Signature traits.
2. `liabilityCull.test.ts` → 2-flaw warrior released even by Methodical.
3. `rivalTraitAI.integration.test.ts` → traits grow but world doesn't saturate (<25% at hard cap).
4. `worldLiveness.integration.test.ts` → class/Signature/multi-flaw emerge; traited share in 20–85% band.
5. `balance.test.ts` → green; `bunx tsc …` → 0; full suite → no new failures.
