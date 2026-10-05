/**
 * Stage D.4 — `FightPlan.phaseShiftOn`. `buildPhasePlan` produces static,
 * personality-tweaked phase curves; phaseShiftOn makes the curve *reactive*:
 * at the declared phase boundary, if the momentum/HP read holds, the phase's
 * axes shift — committed for the rest of that phase, unlike per-exchange
 * condition overrides that re-evaluate every check.
 */
import { describe, it, expect } from 'vitest';
import { prepareExchange } from '@/engine/combat/resolution/exchangePrep';
import { FightPlanSchema } from '@/schemas/warriorSchemas';
import type { CombatEvent } from '@/types/combat.types';
import {
  makeFighterState,
  makeResolutionContext,
  makePlan,
} from '@/test/_fixtures/factories';

describe('phaseShiftOn — schema', () => {
  it('round-trips through FightPlanSchema', () => {
    const plan = FightPlanSchema.parse({
      style: 'STRIKING ATTACK',
      OE: 6,
      AL: 5,
      phaseShiftOn: [{ at: 'late', when: 'MOMENTUM_BEHIND', OE: 9, AL: 3 }],
    });
    expect(plan.phaseShiftOn?.[0]?.at).toBe('late');
    expect(plan.phaseShiftOn?.[0]?.when).toBe('MOMENTUM_BEHIND');
  });
});

describe('phaseShiftOn — boundary-reactive curve', () => {
  const shiftPlan = () =>
    makePlan({
      OE: 5,
      AL: 5,
      phases: {
        late: { OE: 5, AL: 5, killDesire: 3 },
      },
      phaseShiftOn: [{ at: 'late', when: 'MOMENTUM_BEHIND', OE: 9, AL: 3 }],
    });

  it('shifted axes apply when the declared read holds at the boundary', () => {
    const fA = makeFighterState({ label: 'A', plan: shiftPlan(), momentum: -3 });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const ctx = makeResolutionContext({ phase: 'LATE', exchange: 40, cornerAdvice: true });
    const setup = prepareExchange(ctx, fA, fD, [] as CombatEvent[]);
    // OE 9 flows into resolution (fatigue may trim it, never inflate it).
    expect(setup.OE_A).toBeGreaterThanOrEqual(8);
    expect(setup.AL_A).toBeLessThanOrEqual(4);
  });

  it('shift is committed — it still holds on the next exchange of that phase', () => {
    const fA = makeFighterState({ label: 'A', plan: shiftPlan(), momentum: -3 });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const ctx = makeResolutionContext({ phase: 'LATE', exchange: 40, cornerAdvice: true });
    prepareExchange(ctx, fA, fD, []);
    // Momentum swings back mid-phase — a committed shift does not re-check.
    fA.momentum = 3;
    const ctx2 = makeResolutionContext({ phase: 'LATE', exchange: 41, cornerAdvice: false });
    const setup2 = prepareExchange(ctx2, fA, fD, []);
    expect(setup2.OE_A).toBeGreaterThanOrEqual(8);
  });

  it('does not shift when the declared read does not hold', () => {
    const fA = makeFighterState({ label: 'A', plan: shiftPlan(), momentum: 3 });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const ctx = makeResolutionContext({ phase: 'LATE', exchange: 40, cornerAdvice: true });
    const setup = prepareExchange(ctx, fA, fD, []);
    expect(setup.OE_A).toBeLessThanOrEqual(6);
  });

  it('evaluates once at the boundary — a mid-phase state change cannot trigger it', () => {
    const fA = makeFighterState({ label: 'A', plan: shiftPlan(), momentum: -3 });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    // Already inside LATE (not the boundary exchange): no boundary evaluation.
    const ctx = makeResolutionContext({ phase: 'LATE', exchange: 42, cornerAdvice: false });
    const setup = prepareExchange(ctx, fA, fD, []);
    expect(setup.OE_A).toBeLessThanOrEqual(6);
  });
});
