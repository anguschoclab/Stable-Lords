import { describe, it, expect } from 'vitest';
import { makeFlatWarrior } from '@/test/_fixtures/determinism';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { runNarratedVsHeadless } from '@/test/_fixtures/narratedVsHeadless';
import { FightingStyle } from '@/types/shared.types';

describe('Narration RNG isolation', () => {
  it('narration does not affect mechanical outcome (narrated === headless)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const A = makeFlatWarrior('A', FightingStyle.StrikingAttack, 15, seed);
      const D = makeFlatWarrior('D', FightingStyle.TotalParry, 15, seed + 100);
      const { narrated, headless } = runNarratedVsHeadless(A, D, seed);
      expect(
        { w: narrated.winner, b: narrated.by, m: narrated.minutes },
        `seed ${seed} diverged`
      ).toEqual({ w: headless.winner, b: headless.by, m: headless.minutes });
    }
  });

  it('same seed produces identical outcomes across repeated runs', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const A = makeFlatWarrior('X', FightingStyle.LungingAttack, 13, seed);
      const D = makeFlatWarrior('Y', FightingStyle.WallOfSteel, 13, seed + 200);
      const run1 = simulateFight({
        planA: defaultPlanForWarrior(A),
        planD: defaultPlanForWarrior(D),
        warriorA: A,
        warriorD: D,
        providedRng: seed,
      });
      const run2 = simulateFight({
        planA: defaultPlanForWarrior(A),
        planD: defaultPlanForWarrior(D),
        warriorA: A,
        warriorD: D,
        providedRng: seed,
      });
      expect({ w: run1.winner, b: run1.by, m: run1.minutes }).toEqual({
        w: run2.winner,
        b: run2.by,
        m: run2.minutes,
      });
    }
  });
});
