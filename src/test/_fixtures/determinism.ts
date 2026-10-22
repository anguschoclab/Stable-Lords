import { expect } from 'vitest';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/game';

/**
 * Runs a headless sim twice with the same seed and asserts the mechanical
 * outcome (winner/by/minutes) is identical. Returns run1 for extra asserts.
 */
export function simulateDeterministically(warriorA: Warrior, warriorD: Warrior, seed: number) {
  const run = () =>
    simulateFight({
      planA: defaultPlanForWarrior(warriorA),
      planD: defaultPlanForWarrior(warriorD),
      warriorA,
      warriorD,
      providedRng: seed,
    });
  const run1 = run();
  const run2 = run();
  expect({ w: run1.winner, b: run1.by, m: run1.minutes }, `seed ${seed} diverged`).toEqual({
    w: run2.winner,
    b: run2.by,
    m: run2.minutes,
  });
  return run1;
}

/** Generic run-twice-and-compare — for non-combat deterministic checks. */
export function expectDeterministic<T>(fn: () => T, label = 'run'): T {
  const r1 = fn();
  const r2 = fn();
  expect(r1, `${label} diverged between identical runs`).toEqual(r2);
  return r1;
}

/** Flat-attribute deterministic fighter — the A/D twins pinned by the
 * determinism/narration specs (all attrs equal, seeded rng, no id). */
export function makeFlatWarrior(
  name: string,
  style: FightingStyle,
  flat = 15,
  seed = 1
): Warrior {
  return makeWarrior({
    id: undefined,
    name,
    style,
    attrs: { ST: flat, CN: flat, SZ: flat, WT: flat, WL: flat, SP: flat, DF: flat },
    overrides: undefined,
    rng: new SeededRNG(seed),
  });
}
