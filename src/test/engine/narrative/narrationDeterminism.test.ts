import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

describe('Narration RNG isolation', () => {
  it('narration does not affect mechanical outcome (narrated === headless)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const A = makeWarrior(
        undefined,
        'A',
        FightingStyle.StrikingAttack,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        undefined,
        new SeededRNGService(seed)
      );
      const D = makeWarrior(
        undefined,
        'D',
        FightingStyle.TotalParry,
        { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 },
        undefined,
        new SeededRNGService(seed + 100)
      );
      const narrated = simulateFight(
        defaultPlanForWarrior(A),
        defaultPlanForWarrior(D),
        A,
        D,
        seed,
        undefined,
        'Clear',
        'standard_arena',
        undefined,
        false
      );
      const headless = simulateFight(
        defaultPlanForWarrior(A),
        defaultPlanForWarrior(D),
        A,
        D,
        seed,
        undefined,
        'Clear',
        'standard_arena',
        undefined,
        true
      );
      expect(
        { w: narrated.winner, b: narrated.by, m: narrated.minutes },
        `seed ${seed} diverged`
      ).toEqual({ w: headless.winner, b: headless.by, m: headless.minutes });
    }
  });

  it('same seed produces identical outcomes across repeated runs', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const A = makeWarrior(
        undefined,
        'X',
        FightingStyle.LungingAttack,
        { ST: 13, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 },
        undefined,
        new SeededRNGService(seed)
      );
      const D = makeWarrior(
        undefined,
        'Y',
        FightingStyle.WallOfSteel,
        { ST: 13, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 },
        undefined,
        new SeededRNGService(seed + 200)
      );
      const run1 = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed);
      const run2 = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed);
      expect({ w: run1.winner, b: run1.by, m: run1.minutes }).toEqual({
        w: run2.winner,
        b: run2.by,
        m: run2.minutes,
      });
    }
  });
});
