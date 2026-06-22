# Trait Saturation Fix + Live Multi-Flaw Churn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the rival world from saturating every warrior with traits (a 104-week sim ends with **375/378 = 99.2%** of warriors traited, ~2.0 each), and make the multi-flaw churn signal actually fire (currently `multiFlawWarriors = 0` forever). After the fix the standing world should show a *spread* — a meaningful share of permanently blank warriors, fewer fully-loaded ones — and 2+-flaw warriors should occur and get culled.

**Architecture:** The saturation comes from `rosterWorker.ts`'s trait-development pass rolling for *every* active warrior *every* week until a flat soft-cap of 2 — so over a multi-year career P(reaching the cap) → ~1. We replace the flat cap with **two combined gates**: (1) a **merit gate** — only warriors who've earned it (winning record or real fame) develop traits; (2) an **aptitude capacity cap** — each warrior's personal trait ceiling scales with their hidden `trainability` (rolled in [0.4, 0.9] at birth), so low-aptitude warriors permanently plateau at 0–1 traits. Separately, a small **flaw-exposure** roll lets already-flawed or losing warriors pick up a *further* flaw (up to the hard `TRAIT_CAP` of 3) even when they aren't developing positively — so 2-flaw warriors occur and the existing `recommendation === 'Release'` cull churns them.

**Tech Stack:** TypeScript, Bun (`bun`/`bunx` — never npm/node), Vitest. Tests: `npx vitest run <path>`. Typecheck: `bunx tsc --noEmit --project tsconfig.app.json`.

**Scope:** Pacing/churn knobs in the rival development pass + a new pure capacity/merit module. **Depends on** the three 2026-06-21 plans (world-decouple, liveness harness, trait tuning) being merged. **Non-goal:** changing player (manual) trait training, birth trait rates (`generateTraits` stays 68% blank / 7% flaw), or any combat math (`balance.test.ts` must stay green).

**Grounded facts (from code audit — do not re-derive):**
- Saturation source: `src/engine/ai/workers/rosterWorker.ts` lines ~140–161 — per active warrior, gated only by `treasury > 300`, `traits.length >= RIVAL_DEV_TRAIT_SOFT_CAP` (=2), and `rng.next() <= trainAppetite` (0.06–0.22). No merit gate, no per-warrior capacity.
- `trainability?: number` on `Warrior` (`src/types/warrior.types.ts:206`), generated as `0.4 + rng.next() * 0.5` → range **[0.4, 0.9]** (`src/engine/factories/warriorFactory.ts:44`), used for both player and rival warriors via `makeWarrior`.
- `canAcquireTrait(warrior, traitId)` (`src/engine/training/trainingGains/traitTraining.ts:57`) already enforces `TRAIT_CAP` (=3), uniqueness, single-personality, and conflict groups — reuse it for flaw exposure.
- The botch flaw pool pattern already exists in `rollTraitTraining` (lines ~105–109): `Object.values(TRAITS).filter((t) => t.tier === 'Flaw' && canAcquireTrait(warrior, t.id))` then `pickWeighted(flaws, rng)`.
- The liability cull already honors `recommendation === 'Release'` (`src/engine/owner/roster/management.ts:100`); a 2-flaw warrior scores ~88, recommendation `Release` — so once 2-flaw warriors *exist*, they get cut.
- The liveness harness ceiling was dropped to a floor-only assert (`src/test/engine/sim/worldLiveness.integration.test.ts:120` asserts only `traitedShare > 0.2`).

---

## File Structure

- **Create** `src/engine/training/trainingGains/traitCapacity.ts` — pure `traitCapacity`, `meritsTraitDevelopment`, `countFlaws`, `pickExposureFlaw`.
- **Create** `src/test/engine/training/traitCapacity.test.ts` — unit tests for the above.
- **Modify** `src/engine/ai/workers/rosterWorker.ts` — replace the flat-cap dev pass with merit+capacity gating and a flaw-exposure path.
- **Modify** `src/test/engine/ai/rivalTraitAI.integration.test.ts` — assert de-saturation (a real blank share remains) and that the run still grows traits.
- **Modify** `src/test/engine/sim/worldLiveness.integration.test.ts` — reinstate a saturation ceiling + blank floor.

---

## Task 1: Pure capacity, merit & flaw-exposure helpers (TDD)

**Files:**
- Create: `src/engine/training/trainingGains/traitCapacity.ts`
- Create: `src/test/engine/training/traitCapacity.test.ts`

- [ ] **Step 1: Write the failing test**

`src/test/engine/training/traitCapacity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  traitCapacity,
  meritsTraitDevelopment,
  countFlaws,
  pickExposureFlaw,
} from '@/engine/training/trainingGains/traitCapacity';
import { TRAITS } from '@/engine/traits';
import { SeededRNGService } from '@/utils/random';
import type { Warrior } from '@/types/warrior.types';

const w = (over: Partial<Warrior> = {}): Warrior =>
  ({
    id: 'x', traits: [], trainability: 0.65,
    fame: 0, career: { wins: 0, losses: 0, kills: 0 },
    ...over,
  } as unknown as Warrior);

describe('traitCapacity', () => {
  it('scales the personal trait ceiling with trainability across the [0.4,0.9] range', () => {
    expect(traitCapacity(w({ trainability: 0.45 }))).toBe(0); // low aptitude → permanent blank
    expect(traitCapacity(w({ trainability: 0.6 }))).toBe(1);
    expect(traitCapacity(w({ trainability: 0.72 }))).toBe(2);
    expect(traitCapacity(w({ trainability: 0.88 }))).toBe(3);
  });

  it('defaults sanely when trainability is missing', () => {
    expect(traitCapacity(w({ trainability: undefined }))).toBeGreaterThanOrEqual(0);
  });
});

describe('meritsTraitDevelopment', () => {
  it('gates development behind a winning record or real fame', () => {
    expect(meritsTraitDevelopment(w({ career: { wins: 0, losses: 4, kills: 0 }, fame: 5 }))).toBe(false);
    expect(meritsTraitDevelopment(w({ career: { wins: 4, losses: 1, kills: 0 }, fame: 5 }))).toBe(true);
    expect(meritsTraitDevelopment(w({ career: { wins: 0, losses: 0, kills: 0 }, fame: 40 }))).toBe(true);
  });
});

describe('countFlaws', () => {
  it('counts only Flaw-tier traits', () => {
    expect(countFlaws(w({ traits: ['fragile', 'slow', 'quick'] }))).toBe(2);
    expect(countFlaws(w({ traits: ['quick'] }))).toBe(0);
  });
});

describe('pickExposureFlaw', () => {
  it('returns an acquirable Flaw id, or null when none can be added', () => {
    const rng = new SeededRNGService('flaw');
    const id = pickExposureFlaw(w({ traits: [] }), rng);
    expect(id).not.toBeNull();
    expect(TRAITS[id!]!.tier).toBe('Flaw');

    // A full roster (3 traits) cannot take another flaw (hard cap).
    const full = pickExposureFlaw(w({ traits: ['quick', 'agile', 'sturdy'] }), rng);
    expect(full).toBeNull();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL.** `npx vitest run src/test/engine/training/traitCapacity.test.ts` → module not found.

- [ ] **Step 3: Implement the helpers**

`src/engine/training/trainingGains/traitCapacity.ts`:

```typescript
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import { TRAITS } from '@/engine/traits';
import { canAcquireTrait } from './traitTraining';

/**
 * Per-warrior trait ceiling from hidden aptitude (`trainability`, rolled in
 * [0.4, 0.9] at birth). Low-aptitude warriors permanently plateau, so the world
 * keeps a spread of blank / lightly-traited / fully-developed warriors instead of
 * saturating everyone to the cap. Thresholds are tuned for the [0.4,0.9] range;
 * adjust against the liveness harness, not by feel.
 */
export const CAPACITY_T1 = 0.52; // below → capacity 0 (never develops)
export const CAPACITY_T2 = 0.66; // below → capacity 1
export const CAPACITY_T3 = 0.8; // below → capacity 2, else 3

export function traitCapacity(w: Warrior): number {
  const t = w.trainability ?? 0.65;
  if (t < CAPACITY_T1) return 0;
  if (t < CAPACITY_T2) return 1;
  if (t < CAPACITY_T3) return 2;
  return 3;
}

/** Traits are earned: only warriors with a winning record or real fame develop. */
export const WINS_FOR_MERIT = 3;
export const FAME_FOR_MERIT = 25;

export function meritsTraitDevelopment(w: Warrior): boolean {
  const wins = w.career?.wins ?? 0;
  const losses = w.career?.losses ?? 0;
  const fame = w.fame ?? 0;
  return (wins >= WINS_FOR_MERIT && wins >= losses) || fame >= FAME_FOR_MERIT;
}

export function countFlaws(w: Warrior): number {
  return (w.traits ?? []).filter((id) => TRAITS[id]?.tier === 'Flaw').length;
}

/** Pick an acquirable Flaw (respects hard cap + conflicts), or null if none fit. */
export function pickExposureFlaw(w: Warrior, rng: IRNGService): string | null {
  const flaws = Object.values(TRAITS).filter(
    (t) => t.tier === 'Flaw' && canAcquireTrait(w, t.id)
  );
  if (flaws.length === 0) return null;
  const idx = Math.floor(rng.next() * flaws.length);
  return flaws[Math.min(idx, flaws.length - 1)]!.id;
}
```

> `canAcquireTrait` already blocks a 4th trait (hard `TRAIT_CAP`), duplicates, and conflicting flaws — so `pickExposureFlaw` cannot overflow or add a contradictory flaw.

- [ ] **Step 4: Run + typecheck.** `npx vitest run src/test/engine/training/traitCapacity.test.ts` → PASS; `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/training/trainingGains/traitCapacity.ts" "src/test/engine/training/traitCapacity.test.ts"
git commit -m "feat(traits): per-warrior trait capacity, merit gate, and flaw-exposure helpers"
```

---

## Task 2: Rewire the rival development pass — merit + capacity + flaw exposure

**Files:**
- Modify: `src/engine/ai/workers/rosterWorker.ts`

- [ ] **Step 1: Add the flaw-exposure constant + imports**

At the top of `rosterWorker.ts`, alongside the existing imports from `traitTraining`, add the capacity-module import. Find the existing import line (it imports `rollTraitTraining`) and add:

```typescript
import {
  traitCapacity,
  meritsTraitDevelopment,
  countFlaws,
  pickExposureFlaw,
} from '@/engine/training/trainingGains/traitCapacity';
import { TRAIT_CAP } from '@/engine/training/trainingGains/traitTraining';
```

Near the `RIVAL_DEV_TRAIT_SOFT_CAP` definition (line ~261), add:

```typescript
/** Weekly chance that a struggling or already-flawed warrior picks up a (further)
 *  flaw even when not developing positively — keeps multi-flaw churn alive. Knob. */
export const FLAW_EXPOSURE_CHANCE = 0.02;
```

> Leave `RIVAL_DEV_TRAIT_SOFT_CAP` in place only if something else still imports it; otherwise delete its declaration in Step 2's cleanup. Check with `grep -rn "RIVAL_DEV_TRAIT_SOFT_CAP" src` before removing.

- [ ] **Step 2: Replace the development map**

Replace the trait-development block (lines ~150–161, the `updatedRival.roster = updatedRival.roster.map(...)` that uses `RIVAL_DEV_TRAIT_SOFT_CAP`) with:

```typescript
    updatedRival.roster = updatedRival.roster.map((w) => {
      if (w.status !== 'Active') return w;
      const traits = w.traits ?? [];
      if (traits.length >= TRAIT_CAP) return w; // hard cap reached, nothing more

      // (1) Merit gate + (2) aptitude capacity: only earned, capable warriors develop.
      const canDevelop = meritsTraitDevelopment(w) && traits.length < traitCapacity(w);
      if (canDevelop) {
        if (rngService.next() > traitPolicy.trainAppetite) return w;
        const roll = rollTraitTraining(w, aiTrainer, rngService);
        if (roll.outcome !== 'none' && roll.traitId) {
          return { ...w, traits: [...traits, roll.traitId] };
        }
        return w;
      }

      // Flaw exposure: warriors who are struggling (losing record) or already
      // carry a flaw risk picking up a further flaw — feeding multi-flaw churn.
      const struggling = (w.career?.losses ?? 0) > (w.career?.wins ?? 0);
      if ((struggling || countFlaws(w) >= 1) && rngService.next() < FLAW_EXPOSURE_CHANCE) {
        const flawId = pickExposureFlaw(w, rngService);
        if (flawId) return { ...w, traits: [...traits, flawId] };
      }
      return w;
    });
```

> The synthetic `aiTrainer` and `traitPolicy` are already in scope from the surrounding `if ((updatedRival.treasury ?? 0) > 300) { … }` block — keep that treasury gate wrapping this map. Only the map body changes.

- [ ] **Step 3: Remove the now-dead flat soft-cap (if unused)**

Run: `grep -rn "RIVAL_DEV_TRAIT_SOFT_CAP" src`
If the only remaining hit is its `export const` declaration, delete that line. If any test references it, update that test to the new model instead (see Task 3).

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/engine/ai/workers/rosterWorker.ts"
git commit -m "feat(traits): merit+aptitude-gated rival development with flaw exposure (de-saturate world)"
```

---

## Task 3: De-saturation assertions in the rival-AI integration test

**Files:**
- Modify: `src/test/engine/ai/rivalTraitAI.integration.test.ts`

This test currently asserts traits grow over a season and `< 25%` reach 3 traits. Update it to the new model: traits still grow, but a real share of warriors remain **blank** (proving de-saturation), and the `RIVAL_DEV_TRAIT_SOFT_CAP` reference (if any) is removed.

- [ ] **Step 1: Read the current test**

Open `src/test/engine/ai/rivalTraitAI.integration.test.ts`. Note the variable holding the post-season state and the existing `after > before` assertion. If it references `RIVAL_DEV_TRAIT_SOFT_CAP`, remove that import/usage.

- [ ] **Step 2: Add the blank-share assertion**

After the existing post-season assertions, add (adapt `state` to the file's actual variable name):

```typescript
    const allRivalWarriors = state.rivals.flatMap((r) => r.roster);
    const blank = allRivalWarriors.filter((w) => (w.traits ?? []).length === 0).length;
    const blankShare = blank / Math.max(1, allRivalWarriors.length);
    // De-saturation: development is earned + capacity-gated, so a meaningful slice
    // of the world stays permanently blank (low-aptitude / unproven warriors).
    expect(blankShare).toBeGreaterThan(0.15);
```

- [ ] **Step 3: Run it**

Run: `npx vitest run src/test/engine/ai/rivalTraitAI.integration.test.ts`
Expected: PASS — traits still grow (`after > before`) AND `blankShare > 0.15`. If `blankShare` is too low, the capacity thresholds (`CAPACITY_T1..T3`) are too generous — raise `CAPACITY_T1` toward 0.55; if traits don't grow at all, the merit gate is too strict — lower `WINS_FOR_MERIT`.

- [ ] **Step 4: Commit**

```bash
git add "src/test/engine/ai/rivalTraitAI.integration.test.ts"
git commit -m "test(traits): rival world keeps a blank share (de-saturation guard)"
```

---

## Task 4: Reinstate the liveness harness saturation ceiling + multi-flaw guard

**Files:**
- Modify: `src/test/engine/sim/worldLiveness.integration.test.ts`

The harness ceiling was dropped to a floor-only assert. Reinstate a ceiling proving the world no longer saturates, and assert multi-flaw warriors actually occur during the run (churn is live).

- [ ] **Step 1: Tighten the band assertion**

In the test `class identity and Signatures emerge, with acquisition in a sane band`, replace the single floor assert (currently `expect(traitedShare).toBeGreaterThan(0.2)`) with a real band + blank floor:

```typescript
    const traitedShare = end.traitedWarriors / Math.max(1, allWarriors.length);
    expect(traitedShare).toBeGreaterThan(0.2); // traits do emerge
    expect(traitedShare).toBeLessThan(0.8); // …but the world is NOT saturated (was 0.99)
    const blankShare = 1 - traitedShare;
    expect(blankShare).toBeGreaterThan(0.18); // a real population stays permanently blank
```

- [ ] **Step 2: Add a live-churn assertion**

Add a new test that tracks whether any pulse during the run observed a multi-flaw warrior (they get culled, so check the max across pulses, not just the end):

```typescript
  it('multi-flaw warriors occur during the run, feeding the Release cull', () => {
    const { pulses } = runSimulation({
      weeks: 104,
      seed: 4242,
      logFrequency: 2, // sample often so transient multi-flaw warriors are caught
      ignoreBankruptcy: true,
    });
    const peakMultiFlaw = Math.max(...pulses.map((p) => p.multiFlawWarriors));
    // Flaw exposure pushes some struggling/flawed warriors to 2 flaws before the
    // liability cull releases them — so we must see at least one across the run.
    expect(peakMultiFlaw).toBeGreaterThan(0);
  }, 300000);
```

- [ ] **Step 3: Run it**

Run: `npx vitest run src/test/engine/sim/worldLiveness.integration.test.ts`
Expected: PASS — `traitedShare` now in (0.2, 0.8) with `blankShare > 0.18`; `peakMultiFlaw > 0`. Inspect the `[liveness]` diagnostic line: `traited` should be far below the old 99% and `multiFlaw` should be small but the per-run peak non-zero. If `peakMultiFlaw` is 0, raise `FLAW_EXPOSURE_CHANCE` toward 0.03; if `traitedShare` exceeds 0.8, raise `CAPACITY_T1`.

- [ ] **Step 4: Commit**

```bash
git add "src/test/engine/sim/worldLiveness.integration.test.ts"
git commit -m "test(sim): reinstate saturation ceiling + assert live multi-flaw churn"
```

---

## Task 5: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Balance + full suite**

Run: `npx vitest run src/test/engine/economy/balance.test.ts` → green (no combat math touched).
Run: `npx vitest run 2>&1 | tail -6` → no new failures vs. the known-unrelated reds (`scouting`, `Trainers`, `useDigestSummary`, `Bookmarks`, `HallOfFame`, `Tournaments`).

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit --project tsconfig.app.json 2>&1 | grep -c "error TS"` → `0`.

- [ ] **Step 3: Commit if needed**

```bash
git add -A && git commit -m "test: verify suite green after saturation + churn fix" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Both gates, as chosen.** Merit (`meritsTraitDevelopment`) caps *how many* warriors ever develop; aptitude (`traitCapacity`) caps *how far* each one can — together they replace the flat soft-cap that merely relocated saturation from 3 to 2.
- **Blanks are guaranteed, not incidental.** Capacity-0 warriors (`trainability < 0.52`, ~24% of the [0.4,0.9] range) never develop, so the world keeps a permanent blank slice regardless of career length — that's the spread.
- **Churn is now live.** Flaw exposure targets struggling/already-flawed warriors, so 2-flaw warriors occur and the existing `Release` cull (`management.ts:100`) churns them — closing the `multiFlaw = 0` gap without flaw-flooding healthy warriors.
- **Knobs are named + harness-gated.** `CAPACITY_T1..T3`, `WINS_FOR_MERIT`, `FAME_FOR_MERIT`, `FLAW_EXPOSURE_CHANCE` are exported constants; the liveness band and blank-floor are the acceptance gate, so tuning is measured, not vibes.
- **Nothing else moves.** Births, player training, and combat are untouched; `balance.test.ts` proves it.

## Verification

1. `traitCapacity.test.ts` → capacity scales with aptitude; merit gate works; flaw exposure respects the hard cap.
2. `rivalTraitAI.integration.test.ts` → traits still grow but `blankShare > 0.15`.
3. `worldLiveness.integration.test.ts` → `traitedShare ∈ (0.2, 0.8)`, `blankShare > 0.18`, `peakMultiFlaw > 0`.
4. `balance.test.ts` green; `bunx tsc …` → 0; full suite → no new failures.
