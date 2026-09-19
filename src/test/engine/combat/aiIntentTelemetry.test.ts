import { describe, it, expect, afterEach } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan, ExchangeLogEntry } from '@/types/combat.types';

function collectIntentCodes(entries: ExchangeLogEntry[] | undefined): string[] {
  return (entries ?? []).flatMap((e) =>
    (e.reasonCodes ?? []).filter((c) => c.startsWith('AI_INTENT_'))
  );
}

function makeFighters(seed: number) {
  const A = makeWarrior(
    undefined,
    'A',
    FightingStyle.LungingAttack,
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
  return { A, D };
}

describe('AI_INTENT telemetry (Stage F)', () => {
  afterEach(() => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = false;
  });

  it('emits AI_INTENT_* reason codes in non-headless mode', () => {
    const { A, D } = makeFighters(7);
    const out = simulateFight(
      defaultPlanForWarrior(A),
      defaultPlanForWarrior(D),
      A,
      D,
      7,
      undefined,
      'Clear',
      'standard_arena',
      undefined,
      false
    );
    const codes = collectIntentCodes(out.exchangeLog);
    expect(codes.length).toBeGreaterThan(0);
  });

  it('emits an intent for both fighters on the opening exchange', () => {
    const { A, D } = makeFighters(7);
    const out = simulateFight(
      defaultPlanForWarrior(A),
      defaultPlanForWarrior(D),
      A,
      D,
      7,
      undefined,
      'Clear',
      'standard_arena',
      undefined,
      false
    );
    const first = out.exchangeLog?.[0];
    const codes = (first?.reasonCodes ?? []).filter((c) => c.startsWith('AI_INTENT_'));
    expect(codes.length).toBe(2);
  });

  it('is deterministic — identical intent sequences for the same seed', () => {
    const run = () => {
      const { A, D } = makeFighters(11);
      return collectIntentCodes(
        simulateFight(
          defaultPlanForWarrior(A),
          defaultPlanForWarrior(D),
          A,
          D,
          11,
          undefined,
          'Clear',
          'standard_arena',
          undefined,
          false
        ).exchangeLog
      );
    };
    const r1 = run();
    const r2 = run();
    expect(r1.length).toBeGreaterThan(0);
    expect(r2).toEqual(r1);
  });

  it('emits no intent telemetry in headless mode', () => {
    const { A, D } = makeFighters(7);
    const out = simulateFight(
      defaultPlanForWarrior(A),
      defaultPlanForWarrior(D),
      A,
      D,
      7,
      undefined,
      'Clear',
      'standard_arena',
      undefined,
      true
    );
    expect(collectIntentCodes(out.exchangeLog)).toHaveLength(0);
  });

  it('emits telemetry in headless mode when __AI_DEBUG is set', () => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = true;
    const { A, D } = makeFighters(7);
    const out = simulateFight(
      defaultPlanForWarrior(A),
      defaultPlanForWarrior(D),
      A,
      D,
      7,
      undefined,
      'Clear',
      'standard_arena',
      undefined,
      true
    );
    expect(collectIntentCodes(out.exchangeLog).length).toBeGreaterThan(0);
  });

  it('records intent transitions — lopsided bouts surface FINISH and SURVIVE', () => {
    // Lopsided bout: strong attacker with a kill-hungry plan vs a frail
    // defender. Individual seeds may KO in one exchange, so sweep a fixed
    // seed range — every run is deterministic, so the union is stable.
    const union = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const A = makeWarrior(
        undefined,
        'KILLER',
        FightingStyle.LungingAttack,
        { ST: 21, CN: 15, SZ: 15, WT: 15, WL: 21, SP: 15, DF: 15 },
        undefined,
        new SeededRNGService(3)
      );
      const D = makeWarrior(
        undefined,
        'PREY',
        FightingStyle.TotalParry,
        { ST: 5, CN: 5, SZ: 5, WT: 5, WL: 5, SP: 5, DF: 5 },
        undefined,
        new SeededRNGService(4)
      );
      const planA: FightPlan = { ...defaultPlanForWarrior(A), killDesire: 10 };
      collectIntentCodes(
        simulateFight(planA, defaultPlanForWarrior(D), A, D, seed, undefined, 'Clear')
          .exchangeLog
      ).forEach((c) => union.add(c));
    }
    expect(union.has('AI_INTENT_FINISH')).toBe(true);
    expect(union.has('AI_INTENT_SURVIVE')).toBe(true);
  });
});
