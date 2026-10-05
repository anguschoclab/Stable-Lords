/**
 * Stage D — corner advice quality. `ctx.cornerAdvice` fires at every phase
 * boundary and bypasses the WT evaluation cadence unconditionally: a
 * cornerless fighter currently gets the same sideline guidance as a
 * Master-trained one. The trainer gate: no corner staff → keep the WT
 * cadence even at boundaries; trainer tier scales how many plan
 * conditions the corner can act on during the off-cadence re-check
 * (Novice 1, Seasoned 2, Master all).
 */
import { describe, it, expect } from 'vitest';
import { evaluateConditions } from '@/engine/combat/mechanics/conditionEngine';
import {
  makeFighterState,
  makeResolutionContext,
  makePlan,
  makeTrainer,
} from '@/test/_fixtures/factories';

/** Two conditions: the first misses, the second hits — order exposes
 *  how much of the plan the corner can actually act on. */
const twoConditionPlan = () =>
  makePlan({
    OE: 5,
    AL: 5,
    conditions: [
      {
        trigger: { type: 'OPPONENT_HP_BELOW', value: 10 }, // misses (full HP)
        override: { OE: 1 },
      },
      {
        trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 }, // hits (mom 3)
        override: { OE: 9, AL: 2 },
      },
    ],
  });

const slowWitted = (plan = twoConditionPlan()) =>
  // WT 4 → 3-exchange cadence; exchange 1 is OFF cadence.
  makeFighterState({ label: 'A', plan, attributes: { WT: 4 } });

const opponentAhead = () =>
  makeFighterState({ label: 'D', plan: makePlan(), momentum: 3 });

const boundaryCtx = (trainers?: Parameters<typeof makeResolutionContext>[0]['trainers']) =>
  makeResolutionContext({
    cornerAdvice: true,
    exchange: 1,
    trainers: trainers ?? [],
  });

describe('corner advice requires a corner', () => {
  it('a cornerless fighter keeps the WT cadence even at a phase boundary', () => {
    const res = evaluateConditions(slowWitted(), opponentAhead(), boundaryCtx([]), 4);
    // Off-cadence and nobody in the corner — no re-check, nothing fires.
    expect(res.firedTrigger).toBeUndefined();
    expect(res.newPlan.OE).toBe(5);
  });

  it('any trainer restores the boundary re-check', () => {
    const plan = makePlan({
      OE: 5,
      AL: 5,
      conditions: [
        {
          trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 },
          override: { OE: 9 },
        },
      ],
    });
    const res = evaluateConditions(
      slowWitted(plan),
      opponentAhead(),
      boundaryCtx([makeTrainer({ tier: 'Novice' })]),
      4
    );
    expect(res.firedTrigger).toBe('OPPONENT_MOMENTUM_LEAD');
  });
});

describe('trainer tier scales boundary breadth', () => {
  it('a Novice corner only reaches the first plan condition', () => {
    const res = evaluateConditions(
      slowWitted(),
      opponentAhead(),
      boundaryCtx([makeTrainer({ tier: 'Novice' })]),
      4
    );
    // First condition misses; the second (hitting) one is beyond a Novice.
    expect(res.firedTrigger).toBeUndefined();
  });

  it('a Master corner evaluates the whole plan at the boundary', () => {
    const res = evaluateConditions(
      slowWitted(),
      opponentAhead(),
      boundaryCtx([makeTrainer({ tier: 'Master' })]),
      4
    );
    expect(res.firedTrigger).toBe('OPPONENT_MOMENTUM_LEAD');
    expect(res.newPlan.OE).toBe(9);
  });
});
