// @vitest-environment node
// @vitest-environment jsdom
/**
 * Stage D.2b — `FightPlan.decoyAxes`. A committed in-bout deception: the
 * fighter really performs the decoy axes (and optional decoy tactics) until
 * the named phase boundary, so the opponent's adaptive reads — tactic
 * streaks, momentum reads, streak triggers — build on the decoy pattern.
 * At `untilPhase` the plan snaps to the real axes and a `DECOY_REVEAL`
 * reason code is emitted once.
 */
import { describe, it, expect } from 'vitest';
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { FightPlanSchema } from '@/schemas/warriorSchemas';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { simulateFight, defaultPlanForWarrior } from '@/engine/simulate';
import { makeWarrior as makeEngineWarrior } from '@/engine/factories/warriorFactory';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';
import type { CombatEvent } from '@/types/combat.types';
import {
  makeFighterState,
  makeResolutionContext,
  makePlan,
  makeWarrior,
} from '@/test/_fixtures/factories';

const revealEvt = (events: CombatEvent[], actor: string) =>
  events.some((e) => e.type === 'STATE_CHANGE' && e.actor === actor && e.result === 'DECOY_REVEAL');

describe('decoyAxes — schema', () => {
  it('round-trips through FightPlanSchema', () => {
    const plan = FightPlanSchema.parse({
      style: 'PARRY-RIPOSTE',
      OE: 8,
      AL: 4,
      decoyAxes: { untilPhase: 'mid', OE: 2, AL: 7, offensiveTactic: 'Lunge' },
    });
    expect(plan.decoyAxes?.untilPhase).toBe('mid');
    expect(plan.decoyAxes?.OE).toBe(2);
  });
});

describe('decoyAxes — masked window resolves the decoy', () => {
  const decoyPlan = () =>
    makePlan({
      OE: 8,
      AL: 3,
      offensiveTactic: 'Decisiveness',
      decoyAxes: { untilPhase: 'mid', OE: 2, AL: 6, offensiveTactic: 'Lunge' },
    });

  it('during the masked window, resolved OE/AL and tactic come from the decoy', () => {
    const fA = makeFighterState({ label: 'A', plan: decoyPlan() });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const ctx = makeResolutionContext({ phase: 'OPENING', exchange: 1 });
    const setup = prepareExchange(ctx, fA, fD, []);
    // The decoy tactic is what the opponent's streak read will see.
    expect(setup.tactA.offTactic).toBe('Lunge');
    // Decoy OE 2 + AL 6 flow into the OE/AL resolution (fatigue-adjusted).
    expect(setup.OE_A).toBeLessThanOrEqual(3);
    expect(setup.AL_A).toBeGreaterThanOrEqual(5);
  });

  it('emits DECOY_REVEAL exactly once at the boundary, then resolves the real plan', () => {
    const fA = makeFighterState({ label: 'A', plan: decoyPlan() });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const ctx = makeResolutionContext({ phase: 'MID', exchange: 20 });
    const events: CombatEvent[] = [];
    const setup = prepareExchange(ctx, fA, fD, events);
    expect(revealEvt(events, 'A')).toBe(true);
    expect(setup.tactA.offTactic).toBe('Decisiveness');
    const events2: CombatEvent[] = [];
    prepareExchange(ctx, fA, fD, events2);
    expect(revealEvt(events2, 'A')).toBe(false);
  });

  it('no reveal event without decoyAxes', () => {
    const fA = makeFighterState({ label: 'A', plan: makePlan() });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const events: CombatEvent[] = [];
    prepareExchange(makeResolutionContext({ phase: 'MID', exchange: 20 }), fA, fD, events);
    expect(revealEvt(events, 'A')).toBe(false);
  });
});

describe('decoyAxes — AI authoring', () => {
  const smart = () =>
    makeWarrior({
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 16, WL: 10, SP: 10, DF: 10 },
    });

  it('deceptive personalities author a decoy on a smart fighter', () => {
    const plan = aiPlanForWarrior({
      w: smart(),
      personality: 'Tactician',
      philosophy: 'Opportunist',
      now: 10,
    });
    expect(plan.decoyAxes).toBeDefined();
    // The decoy must differ from the real axes — a carbon copy deceives no one.
    expect(plan.decoyAxes!.OE !== plan.OE || plan.decoyAxes!.AL !== plan.AL).toBe(true);
  });

  it('straightforward personalities never author a decoy', () => {
    const plan = aiPlanForWarrior({
      w: smart(),
      personality: 'Aggressive',
      philosophy: 'Opportunist',
      now: 10,
    });
    expect(plan.decoyAxes).toBeUndefined();
  });

  it('a dull fighter cannot hold a script — WT gate', () => {
    const plan = aiPlanForWarrior({
      w: makeWarrior({ attributes: { ST: 10, CN: 10, SZ: 10, WT: 8, WL: 10, SP: 10, DF: 10 } }),
      personality: 'Tactician',
      philosophy: 'Opportunist',
      now: 10,
    });
    expect(plan.decoyAxes).toBeUndefined();
  });
});

describe('decoyAxes — simulateFight integration', () => {
  const even = (name: string, seed: number) =>
    makeEngineWarrior({
      id: undefined,
      name,
      style: FightingStyle.ParryLunge,
      attrs: { ST: 13, CN: 17, SZ: 13, WT: 15, WL: 13, SP: 13, DF: 13 },
      overrides: undefined,
      rng: new SeededRNGService(seed),
    });

  const codes = (out: ReturnType<typeof simulateFight>) =>
    (out.exchangeLog ?? []).flatMap((e) => e.reasonCodes ?? []);

  it('DECOY_REVEAL lands in bout telemetry — exactly once per fight', () => {
    // Sweep a fixed seed range — fights may end inside the masked window, so
    // the union proves the reveal surfaces and never double-emits.
    let sawReveal = false;
    for (let seed = 1; seed <= 8; seed++) {
      const A = even('MASK', seed);
      const D = even('FOE', seed + 100);
      const planA = {
        ...defaultPlanForWarrior(A),
        killDesire: 1,
        decoyAxes: { untilPhase: 'mid' as const, OE: 2, AL: 7 },
      };
      const out = simulateFight({
        planA,
        planD: { ...defaultPlanForWarrior(D), killDesire: 1 },
        warriorA: A,
        warriorD: D,
        providedRng: seed,
        trainers: undefined,
        weather: 'Clear',
      });
      const reveals = codes(out).filter((c) => c === 'DECOY_REVEAL');
      expect(reveals.length).toBeLessThanOrEqual(1);
      if (reveals.length === 1) sawReveal = true;
    }
    expect(sawReveal).toBe(true);
  });

  it('is deterministic — identical reason-code sequences for the same seed', () => {
    const run = () => {
      const A = even('MASK', 42);
      const D = even('FOE', 142);
      return codes(
        simulateFight({
          planA: {
            ...defaultPlanForWarrior(A),
            killDesire: 1,
            decoyAxes: { untilPhase: 'mid' as const, OE: 2, AL: 7 },
          },
          planD: { ...defaultPlanForWarrior(D), killDesire: 1 },
          warriorA: A,
          warriorD: D,
          providedRng: 42,
          trainers: undefined,
          weather: 'Clear',
        })
      );
    };
    expect(run()).toEqual(run());
  });
});
