import { describe, it, expect, afterEach } from 'vitest';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan, ExchangeLogEntry } from '@/types/combat.types';

function collectIntentCodes(entries: ExchangeLogEntry[] | undefined): string[] {
  return (entries ?? []).flatMap((e) =>
    (e.reasonCodes ?? []).filter((c) => c.startsWith('AI_INTENT_'))
  );
}

function makeFighters(seed: number) {
  const A = makeWarrior(
    { id: undefined, name: 'A', style: FightingStyle.LungingAttack, attrs: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 }, overrides: undefined, rng: new SeededRNG(seed) }
  );
  const D = makeWarrior(
    { id: undefined, name: 'D', style: FightingStyle.TotalParry, attrs: { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 }, overrides: undefined, rng: new SeededRNG(seed + 100) }
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
      { planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: 7, trainers: undefined, weather: 'Clear', arenaId: 'standard_arena', crowdMood: undefined, headless: false }
    );
    const codes = collectIntentCodes(out.exchangeLog);
    expect(codes.length).toBeGreaterThan(0);
  });

  it('emits an intent for both fighters on the opening exchange', () => {
    const { A, D } = makeFighters(7);
    const out = simulateFight(
      { planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: 7, trainers: undefined, weather: 'Clear', arenaId: 'standard_arena', crowdMood: undefined, headless: false }
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
          { planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: 11, trainers: undefined, weather: 'Clear', arenaId: 'standard_arena', crowdMood: undefined, headless: false }
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
      { planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: 7, trainers: undefined, weather: 'Clear', arenaId: 'standard_arena', crowdMood: undefined, headless: true }
    );
    expect(collectIntentCodes(out.exchangeLog)).toHaveLength(0);
  });

  it('emits telemetry in headless mode when __AI_DEBUG is set', () => {
    (globalThis as { __AI_DEBUG?: boolean }).__AI_DEBUG = true;
    const { A, D } = makeFighters(7);
    const out = simulateFight(
      { planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: 7, trainers: undefined, weather: 'Clear', arenaId: 'standard_arena', crowdMood: undefined, headless: true }
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
        { id: undefined, name: 'KILLER', style: FightingStyle.LungingAttack, attrs: { ST: 21, CN: 15, SZ: 15, WT: 15, WL: 21, SP: 15, DF: 15 }, overrides: undefined, rng: new SeededRNG(3) }
      );
      const D = makeWarrior(
        { id: undefined, name: 'PREY', style: FightingStyle.TotalParry, attrs: { ST: 5, CN: 5, SZ: 5, WT: 5, WL: 5, SP: 5, DF: 5 }, overrides: undefined, rng: new SeededRNG(4) }
      );
      const planA: FightPlan = { ...defaultPlanForWarrior(A), killDesire: 10 };
      collectIntentCodes(
        simulateFight({ planA: planA, planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: seed, trainers: undefined, weather: 'Clear' }).exchangeLog
      ).forEach((c) => union.add(c));
    }
    expect(union.has('AI_INTENT_FINISH')).toBe(true);
    expect(union.has('AI_INTENT_SURVIVE')).toBe(true);
  });
});
