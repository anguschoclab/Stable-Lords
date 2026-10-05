import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { runNarratedVsHeadless } from '@/test/_fixtures/narratedVsHeadless';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

describe('Narration RNG isolation', () => {
  it('narration does not affect mechanical outcome (narrated === headless)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const A = makeWarrior(
        { id: undefined, name: 'A', style: FightingStyle.StrikingAttack, attrs: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 }, overrides: undefined, rng: new SeededRNG(seed) }
      );
      const D = makeWarrior(
        { id: undefined, name: 'D', style: FightingStyle.TotalParry, attrs: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 }, overrides: undefined, rng: new SeededRNG(seed + 100) }
      );
      const { narrated, headless } = runNarratedVsHeadless(A, D, seed);
      expect(
        { w: narrated.winner, b: narrated.by, m: narrated.minutes },
        `seed ${seed} diverged`
      ).toEqual({ w: headless.winner, b: headless.by, m: headless.minutes });
    }
  });

  it('same seed produces identical outcomes across repeated runs', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const A = makeWarrior(
        { id: undefined, name: 'X', style: FightingStyle.LungingAttack, attrs: { ST: 13, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 }, overrides: undefined, rng: new SeededRNG(seed) }
      );
      const D = makeWarrior(
        { id: undefined, name: 'Y', style: FightingStyle.WallOfSteel, attrs: { ST: 13, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 }, overrides: undefined, rng: new SeededRNG(seed + 200) }
      );
      const run1 = simulateFight({ planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: seed });
      const run2 = simulateFight({ planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: seed });
      expect({ w: run1.winner, b: run1.by, m: run1.minutes }).toEqual({
        w: run2.winner,
        b: run2.by,
        m: run2.minutes,
      });
    }
  });
});
