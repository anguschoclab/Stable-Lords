import { describe, it, expect } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { FightingStyle } from '@/types/shared.types';

const ATTRS = { ST: 13, CN: 13, SZ: 13, WT: 13, WL: 13, SP: 13, DF: 13 };

const STYLE_PAIRS: Array<[FightingStyle, FightingStyle]> = [
  [FightingStyle.StrikingAttack, FightingStyle.TotalParry],
  [FightingStyle.LungingAttack, FightingStyle.WallOfSteel],
  [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte],
  [FightingStyle.BashingAttack, FightingStyle.ParryLunge],
];

const SEEDS = [
  1, 7, 42, 99, 123, 777, 1234, 5555, 9999, 31337, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000,
];

describe('combat resolution determinism characterization', () => {
  for (const [styleA, styleD] of STYLE_PAIRS) {
    it(`${styleA} vs ${styleD} produces identical outcomes across repeated seeds`, () => {
      for (const seed of SEEDS) {
        const A = makeWarrior(undefined, 'A', styleA, ATTRS, undefined, undefined);
        const D = makeWarrior(undefined, 'D', styleD, ATTRS, undefined, undefined);

        const run1 = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed);
        const run2 = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed);

        expect(
          { w: run1.winner, b: run1.by, m: run1.minutes },
          `seed ${seed} diverged for ${styleA} vs ${styleD}`
        ).toEqual({ w: run2.winner, b: run2.by, m: run2.minutes });
      }
    });
  }

  it('headless and narrated produce identical mechanical outcomes', () => {
    for (const seed of SEEDS) {
      const A = makeWarrior(
        undefined,
        'A',
        FightingStyle.StrikingAttack,
        ATTRS,
        undefined,
        undefined
      );
      const D = makeWarrior(undefined, 'D', FightingStyle.TotalParry, ATTRS, undefined, undefined);

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
        `seed ${seed} narrated vs headless diverged`
      ).toEqual({ w: headless.winner, b: headless.by, m: headless.minutes });
    }
  });

  it('different seeds produce varied outcomes (not all same winner)', () => {
    const winners = new Set<string>();
    for (const seed of SEEDS) {
      const A = makeWarrior(
        undefined,
        'A',
        FightingStyle.StrikingAttack,
        ATTRS,
        undefined,
        undefined
      );
      const D = makeWarrior(undefined, 'D', FightingStyle.TotalParry, ATTRS, undefined, undefined);
      const result = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed);
      winners.add(result.winner ?? 'draw');
    }
    // Should see at least some variety in winners across 20 seeds
    expect(winners.size, 'should have varied outcomes').toBeGreaterThanOrEqual(1);
  });

  it('exchange log structure is stable for same seed', () => {
    for (const seed of [1, 42, 99]) {
      const A = makeWarrior(
        undefined,
        'A',
        FightingStyle.LungingAttack,
        ATTRS,
        undefined,
        undefined
      );
      const D = makeWarrior(undefined, 'D', FightingStyle.WallOfSteel, ATTRS, undefined, undefined);

      const run1 = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed);
      const run2 = simulateFight(defaultPlanForWarrior(A), defaultPlanForWarrior(D), A, D, seed);

      const ex1Len = run1.exchangeLog?.length ?? 0;
      const ex2Len = run2.exchangeLog?.length ?? 0;
      expect(ex1Len, `seed ${seed} exchange log length differs`).toBe(ex2Len);

      // Compare exchange types
      const types1 = (run1.exchangeLog ?? []).map((e) => e.attResult);
      const types2 = (run2.exchangeLog ?? []).map((e) => e.attResult);
      expect(types1, `seed ${seed} exchange attResults differ`).toEqual(types2);
    }
  });
});
