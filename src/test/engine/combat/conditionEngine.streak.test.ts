/**
 * Stage D — OPPONENT_TACTIC_STREAK trigger. The engine already tracks
 * `tacticStreakA`/`tacticStreakD` for the overuse penalty and narration;
 * this trigger lets a plan read the OPPONENT's streak and adapt — the
 * first plan-expressible counter-repetition read. Value N fires when the
 * opposing fighter's consecutive same-tactic count reaches N.
 */
import { describe, it, expect } from 'vitest';
import { evaluateConditions } from '@/engine/combat/mechanics/conditionEngine';
import { CONDITION_TRIGGERS } from '@/types/enumSources';
import { ConditionTriggerTypeSchema } from '@/schemas/schemaEnums';
import { PlanConditionSchema } from '@/schemas/warriorSchemas';
import {
  makeFighterState,
  makeResolutionContext,
  makePlan,
} from '@/test/_fixtures/factories';

const streakPlan = (streakValue = 3) =>
  makePlan({
    OE: 5,
    AL: 5,
    conditions: [
      {
        trigger: { type: 'OPPONENT_TACTIC_STREAK', value: streakValue },
        override: { OE: 9, AL: 2 },
        label: 'Read the repetition',
      },
    ],
  });

/** WT 20 → evaluate every exchange; exchange 1 is on-cadence anyway. */
const streakCtx = (streakA: number, streakD: number) =>
  makeResolutionContext({ tacticStreakA: streakA, tacticStreakD: streakD, exchange: 1 });

describe('OPPONENT_TACTIC_STREAK trigger', () => {
  it('is declared in the trigger union, enum source, and schemas', () => {
    expect(CONDITION_TRIGGERS).toContain('OPPONENT_TACTIC_STREAK');
    expect(ConditionTriggerTypeSchema.parse('OPPONENT_TACTIC_STREAK')).toBe(
      'OPPONENT_TACTIC_STREAK'
    );
    const cond = PlanConditionSchema.parse({
      trigger: { type: 'OPPONENT_TACTIC_STREAK', value: 3 },
      override: { OE: 9 },
    });
    expect(cond.trigger.type).toBe('OPPONENT_TACTIC_STREAK');
  });

  it('fires for side A when tacticStreakD reaches the threshold', () => {
    const fA = makeFighterState({ label: 'A', plan: streakPlan(3), attributes: { ST: 10, CN: 10, SZ: 10, WT: 20, WL: 10, SP: 10, DF: 10 } });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const res = evaluateConditions(fA, fD, streakCtx(0, 3), 20);
    expect(res.firedTrigger).toBe('OPPONENT_TACTIC_STREAK');
    expect(res.newPlan.OE).toBe(9);
  });

  it('fires for side D when tacticStreakA reaches the threshold — symmetric', () => {
    const fA = makeFighterState({ label: 'A', plan: makePlan() });
    const fD = makeFighterState({ label: 'D', plan: streakPlan(3), attributes: { ST: 10, CN: 10, SZ: 10, WT: 20, WL: 10, SP: 10, DF: 10 } });
    const res = evaluateConditions(fD, fA, streakCtx(3, 0), 20);
    expect(res.firedTrigger).toBe('OPPONENT_TACTIC_STREAK');
  });

  it('does not fire below the threshold', () => {
    const fA = makeFighterState({ label: 'A', plan: streakPlan(3), attributes: { ST: 10, CN: 10, SZ: 10, WT: 20, WL: 10, SP: 10, DF: 10 } });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    const res = evaluateConditions(fA, fD, streakCtx(0, 2), 20);
    expect(res.firedTrigger).toBeUndefined();
    expect(res.newPlan.OE).toBe(5);
  });

  it('reads the OPPONENT side — a fighter never triggers on its own streak', () => {
    const fA = makeFighterState({ label: 'A', plan: streakPlan(2), attributes: { ST: 10, CN: 10, SZ: 10, WT: 20, WL: 10, SP: 10, DF: 10 } });
    const fD = makeFighterState({ label: 'D', plan: makePlan() });
    // A's own streak is hot, D's is cold — nothing should fire.
    const res = evaluateConditions(fA, fD, streakCtx(4, 0), 20);
    expect(res.firedTrigger).toBeUndefined();
  });
});
