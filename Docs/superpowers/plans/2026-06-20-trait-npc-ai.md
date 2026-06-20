# NPC Stable Trait AI (System 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make rival stables manage traits by personality — cut flaw-loaded warriors at personality-specific thresholds and invest in trait training per their appetite/risk — so different rivals visibly churn and develop differently.

**Architecture:** Rival personalities already exist (`OwnerPersonality = 'Aggressive' | 'Methodical' | 'Showman' | 'Pragmatic' | 'Tactician'` on `rival.owner.personality`) and already drive culling in `processAIRosterManagement` (`src/engine/owner/roster/management.ts:19`). We add a pure **`TRAIT_POLICY`** table mapping each personality to trait knobs, then (a) extend the cull loop to release high-liability warriors (reusing System 4's `computeWarriorLiability`) and (b) add a weekly trait-development step that resolves a trait-training roll for selected warriors (reusing System 3's `rollTraitTraining`).

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest.

**Scope:** System 5. **Depends on Systems 1, 3, 4.** Reuses `rollTraitTraining`, `canAcquireTrait` (System 3) and `computeWarriorLiability` (System 4). No new combat hooks.

**Grounded reconciliation vs the spec:** the spec's 4 archetypes (Ruthless/Loyal/Frugal/Prestige) map onto the 5 existing personalities (below). Rivals act per-week, so trait development resolves a completed-training roll probabilistically rather than tracking multi-week rival assignments.

---

## File Structure

- **Create** `src/engine/ai/traitPolicy.ts` — `TRAIT_POLICY` + helpers.
- **Create** `src/test/engine/ai/traitPolicy.test.ts` — policy tests.
- **Modify** `src/engine/owner/roster/management.ts` — liability-based culling in `processAIRosterManagement`.
- **Modify** `src/engine/ai/workers/rosterWorker.ts` (or `processAIStable`) — weekly trait-development step.
- **Create** `src/test/engine/ai/rivalTraitAI.integration.test.ts` — emergent-behavior test.

---

## Task 1: The personality → trait policy (TDD)

**Files:**
- Create: `src/engine/ai/traitPolicy.ts`
- Create: `src/test/engine/ai/traitPolicy.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/engine/ai/traitPolicy.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TRAIT_POLICY, OWNER_PERSONALITIES_WITH_POLICY } from '@/engine/ai/traitPolicy';

describe('TRAIT_POLICY', () => {
  it('covers every owner personality', () => {
    for (const p of OWNER_PERSONALITIES_WITH_POLICY) {
      expect(TRAIT_POLICY[p], p).toBeDefined();
      expect(TRAIT_POLICY[p].cutLiabilityThreshold).toBeGreaterThan(0);
      expect(TRAIT_POLICY[p].trainAppetite).toBeGreaterThanOrEqual(0);
    }
  });

  it('Aggressive cuts more readily than Methodical', () => {
    expect(TRAIT_POLICY.Aggressive.cutLiabilityThreshold).toBeLessThan(
      TRAIT_POLICY.Methodical.cutLiabilityThreshold
    );
  });

  it('Showman/Aggressive train more than Pragmatic', () => {
    expect(TRAIT_POLICY.Showman.trainAppetite).toBeGreaterThan(TRAIT_POLICY.Pragmatic.trainAppetite);
    expect(TRAIT_POLICY.Aggressive.trainAppetite).toBeGreaterThan(TRAIT_POLICY.Pragmatic.trainAppetite);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.** `npx vitest run src/test/engine/ai/traitPolicy.test.ts`

- [ ] **Step 3: Implement the policy**

`src/engine/ai/traitPolicy.ts`:

```typescript
import type { OwnerPersonality, TrainerTier } from '@/types/shared.types';

export interface TraitPolicy {
  /** Release a warrior whose liability score (System 4) reaches this. Lower = cuts faster. */
  cutLiabilityThreshold: number;
  /** Per-warrior weekly chance to resolve a trait-training arc. Higher = develops more. */
  trainAppetite: number;
  /** Max trainer tier the stable will gamble on (bold reaches Signature, cautious stays safe). */
  ceiling: TrainerTier;
}

export const OWNER_PERSONALITIES_WITH_POLICY: OwnerPersonality[] = [
  'Aggressive', 'Methodical', 'Showman', 'Pragmatic', 'Tactician',
];

/** Maps the 5 owner personalities onto the design's Ruthless/Loyal/Frugal/Prestige archetypes. */
export const TRAIT_POLICY: Record<OwnerPersonality, TraitPolicy> = {
  Aggressive: { cutLiabilityThreshold: 55, trainAppetite: 0.18, ceiling: 'Master' },   // ruthless, bold
  Showman:    { cutLiabilityThreshold: 60, trainAppetite: 0.22, ceiling: 'Master' },   // prestige-chaser
  Tactician:  { cutLiabilityThreshold: 62, trainAppetite: 0.12, ceiling: 'Seasoned' }, // strict, cautious
  Pragmatic:  { cutLiabilityThreshold: 70, trainAppetite: 0.06, ceiling: 'Seasoned' }, // frugal
  Methodical: { cutLiabilityThreshold: 78, trainAppetite: 0.10, ceiling: 'Seasoned' }, // loyal/developmental
};

export function policyFor(personality?: OwnerPersonality): TraitPolicy {
  return TRAIT_POLICY[personality ?? 'Pragmatic'];
}
```

- [ ] **Step 4: Run + typecheck.** `npx vitest run src/test/engine/ai/traitPolicy.test.ts` → PASS; `bunx tsc … ` → 0.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/ai/traitPolicy.ts" "src/test/engine/ai/traitPolicy.test.ts"
git commit -m "feat(ai): personality→trait policy (cut threshold, train appetite, ceiling)"
```

---

## Task 2: Liability-based culling for rivals

**Files:**
- Modify: `src/engine/owner/roster/management.ts`

`processAIRosterManagement` (line 19) already culls by win-rate/kills/age with win-streak protection (lines 36–101). Add a flaw-liability cut gated by the personality's threshold.

- [ ] **Step 1: Add the liability cull**

Inside the per-warrior cull evaluation in `processAIRosterManagement`, after the existing cull rules and **respecting the same win-streak protection**, add:

```typescript
import { computeWarriorLiability } from '@/engine/warriorValue';
import { policyFor } from '@/engine/ai/traitPolicy';
// ... inside the loop, `rival.owner.personality` in scope:
const policy = policyFor(rival.owner?.personality);
const liability = computeWarriorLiability(candidate);
const recentWins = /* reuse the existing win-streak-protection expression */;
if (recentWins < 3 && liability.score >= policy.cutLiabilityThreshold) {
  candidate.status = 'Retired';
  candidate.retiredWeek = state.week;
  gazetteItems.push(`${rival.owner?.stableName ?? 'A rival'} released ${candidate.name} — too many flaws.`);
  // mark for removal exactly as the existing cull does (filter / culledThisTick++)
  continue;
}
```

> Match the file's existing cull mechanics precisely — how it flags a warrior as culled (status set + filtered, and `culledThisTick` accounting). Reuse the existing win-streak guard expression rather than re-deriving it. This is additive: liability is one more reason to cut, scaled by personality.

- [ ] **Step 2: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
```bash
git add "src/engine/owner/roster/management.ts"
git commit -m "feat(ai): rivals cut flaw-loaded warriors per personality threshold"
```

---

## Task 3: Weekly trait development for rivals

**Files:**
- Modify: `src/engine/ai/workers/rosterWorker.ts`

Rivals train attributes in `processRoster` (line 39). Add a trait-development step: per active warrior, with probability `trainAppetite` (gated by treasury), resolve one `rollTraitTraining` against a synthetic trainer at the policy ceiling, and apply the result. This naturally produces both new traits *and* botched flaws — feeding Task 2's culling.

- [ ] **Step 1: Add the trait-development pass**

In `processRoster`, after the existing attribute-training block (around lines 69–130), with `rng` and `rival` in scope:

```typescript
import { rollTraitTraining } from '@/engine/training/trainingGains/traitTraining';
import { policyFor } from '@/engine/ai/traitPolicy';
// ...
const policy = policyFor(rival.owner?.personality);
const canTrain = (rival.treasury ?? 0) > 300; // don't develop if broke
if (canTrain) {
  rival.roster = rival.roster.map((w) => {
    if (w.status !== 'Active') return w;
    if ((rng?.next() ?? 1) > policy.trainAppetite) return w;
    const trainer = { id: 'ai', name: 'AI Coach', tier: policy.ceiling } as any;
    const roll = rollTraitTraining(w, trainer, rng!);
    if (roll.outcome !== 'none' && roll.traitId) {
      return { ...w, traits: [...(w.traits ?? []), roll.traitId] };
    }
    return w;
  });
}
```

> Confirm `processRoster` has an `rng` parameter (the signature is `processRoster(rival, currentWeek, season?, seed?, rng?)`). If `rng` may be undefined, derive a seeded one from `seed` as the surrounding code does. The synthetic trainer only needs `{ id, name, tier }` — `rollTraitTraining` reads only `trainer.tier`.

- [ ] **Step 2: Typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
```bash
git add "src/engine/ai/workers/rosterWorker.ts"
git commit -m "feat(ai): rivals develop traits weekly per personality appetite (botches feed churn)"
```

---

## Task 4: Emergent-behavior integration test

**Files:**
- Create: `src/test/engine/ai/rivalTraitAI.integration.test.ts`

- [ ] **Step 1: Show personalities diverge over a season**

```typescript
import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';

describe('rival trait AI (integration)', () => {
  it('over a season, rival rosters acquire traits and churn without crashing', () => {
    let state = populateInitialWorld(createFreshState('rival-ai'), 12345);
    const before = state.rivals.flatMap((r) => r.roster).reduce((s, w) => s + (w.traits?.length ?? 0), 0);
    for (let i = 0; i < 26; i++) state = advanceWeek(state, { headless: true });
    const after = state.rivals.flatMap((r) => r.roster).reduce((s, w) => s + (w.traits?.length ?? 0), 0);
    // Trait training over 26 weeks should have grown total trait count across rival rosters.
    expect(after).toBeGreaterThan(before);
    // No rival roster should be empty (churn cuts but recruitment refills).
    expect(state.rivals.every((r) => r.roster.length > 0)).toBe(true);
  });
});
```

Run: `npx vitest run src/test/engine/ai/rivalTraitAI.integration.test.ts`
Expected: PASS. (Match `advanceWeek`'s real signature from `simulation-harness.ts`. If trait growth is flat, raise `trainAppetite` slightly — it is a knob.)

- [ ] **Step 2: Full suite + typecheck + commit**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`
Run: `npx vitest run 2>&1 | tail -4` → green.
```bash
git add "src/test/engine/ai/rivalTraitAI.integration.test.ts"
git commit -m "test(ai): rivals develop traits and churn over a season"
```

---

## Self-Review Notes

- **Reuse, don't reinvent.** Culling reuses `computeWarriorLiability`; development reuses `rollTraitTraining` — both already unit-tested. This plan is mostly a policy table + two insertion points.
- **Emergence is the point.** Aggressive/Showman stables churn fast and chase Signatures (and eat more botch-flaws); Methodical/Pragmatic carry flawed veterans and develop slowly. The integration test only asserts the system runs and grows; the *texture* is the payoff a player feels.
- **Rivals resolve per-week** rather than tracking multi-week assignments — simpler and keeps rival trait-gain pace tunable via `trainAppetite`, so they don't out-develop the player.
- **Additive culling.** Liability is one more cut reason layered on the existing personality culls; it respects the same win-streak protection so a winning flawed warrior isn't dropped.

## Verification

1. `npx vitest run src/test/engine/ai/` → policy + integration green.
2. `TRAIT_POLICY` covers all 5 personalities; Aggressive cuts sooner, Showman/Aggressive train more.
3. Rivals acquire traits over a season and never empty their rosters.
4. `bunx tsc …` → 0; full `npx vitest run` green; base `balance.test.ts` unaffected.
```
