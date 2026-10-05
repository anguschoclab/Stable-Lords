// @vitest-environment node
/**
 * Stage E — new opponent-state triggers, percent normalization, and
 * phase-boundary corner advice.
 */
import { describe, it, expect } from 'vitest';
import { evaluateConditions } from '@/engine/combat/mechanics/conditionEngine';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import type { PlanCondition } from '@/types/shared.types';

function makeFighter(over: Partial<FighterState> = {}): FighterState {
  return {
    hp: 100,
    maxHp: 100,
    endurance: 100,
    maxEndurance: 100,
    momentum: 0,
    consecutiveHits: 0,
    hitsLanded: 0,
    hitsTaken: 0,
    attributes: { WT: 10 } as never,
    plan: { OE: 5, AL: 5 } as never,
    activePlan: { OE: 5, AL: 5 } as never,
    ...over,
  } as FighterState;
}

function ctx(over: Partial<ResolutionContext> = {}): ResolutionContext {
  return { exchange: 0, phase: 'MID', ...over } as ResolutionContext;
}

function planWith(conditions: PlanCondition[]) {
  return { OE: 5, AL: 5, conditions } as never;
}

describe('percent trigger normalization', () => {
  // Emitters and the editor write 0–100 percent values; the engine compares
  // against a 0–1 ratio. Values >1 are normalized — a stored 30 means 30%.
  it('HP_BELOW 30 does NOT fire at full health', () => {
    const fighter = makeFighter({
      plan: planWith([{ trigger: { type: 'HP_BELOW', value: 30 }, override: { OE: 1 } }]),
    });
    const { newPlan } = evaluateConditions(fighter, makeFighter(), ctx(), 10);
    expect(newPlan.OE).toBe(5);
  });

  it('HP_BELOW 30 fires when hp ratio drops under 30%', () => {
    const fighter = makeFighter({
      hp: 20,
      plan: planWith([{ trigger: { type: 'HP_BELOW', value: 30 }, override: { OE: 1 } }]),
    });
    const { newPlan } = evaluateConditions(fighter, makeFighter(), ctx(), 10);
    expect(newPlan.OE).toBe(1);
  });

  it('legacy 0–1 ratio values still work', () => {
    const fighter = makeFighter({
      hp: 20,
      plan: planWith([{ trigger: { type: 'HP_BELOW', value: 0.3 }, override: { OE: 1 } }]),
    });
    const { newPlan } = evaluateConditions(fighter, makeFighter(), ctx(), 10);
    expect(newPlan.OE).toBe(1);
  });

  it('ENDURANCE_BELOW 15 does not fire at full endurance', () => {
    const fighter = makeFighter({
      plan: planWith([{ trigger: { type: 'ENDURANCE_BELOW', value: 15 }, override: { OE: 1 } }]),
    });
    const { newPlan } = evaluateConditions(fighter, makeFighter(), ctx(), 10);
    expect(newPlan.OE).toBe(5);
  });
});

describe('opponent-state triggers', () => {
  it('OPPONENT_HP_BELOW fires when the opponent is hurt', () => {
    const fighter = makeFighter({
      plan: planWith([
        { trigger: { type: 'OPPONENT_HP_BELOW', value: 40 }, override: { killDesire: 9 } },
      ]),
    });
    const hurt = makeFighter({ hp: 30 });
    const healthy = makeFighter({ hp: 100 });
    expect(evaluateConditions(fighter, hurt, ctx(), 10).newPlan.killDesire).toBe(9);
    expect(evaluateConditions(fighter, healthy, ctx(), 10).newPlan.killDesire).not.toBe(9);
  });

  it('OPPONENT_ENDURANCE_BELOW fires on a gassed opponent', () => {
    const fighter = makeFighter({
      plan: planWith([
        { trigger: { type: 'OPPONENT_ENDURANCE_BELOW', value: 30 }, override: { OE: 9 } },
      ]),
    });
    const gassed = makeFighter({ endurance: 20 });
    expect(evaluateConditions(fighter, gassed, ctx(), 10).newPlan.OE).toBe(9);
  });

  it('OPPONENT_MOMENTUM_LEAD fires when the opponent has tempo', () => {
    const fighter = makeFighter({
      plan: planWith([
        { trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 }, override: { AL: 9 } },
      ]),
    });
    const rolling = makeFighter({ momentum: 2 });
    expect(evaluateConditions(fighter, rolling, ctx(), 10).newPlan.AL).toBe(9);
  });

  it('PSYCH_IS fires on the fighter psych state', () => {
    // hp < 30% → Desperate
    const fighter = makeFighter({
      hp: 20,
      plan: planWith([{ trigger: { type: 'PSYCH_IS', value: 'Desperate' }, override: { OE: 1 } }]),
    });
    expect(evaluateConditions(fighter, makeFighter(), ctx(), 10).newPlan.OE).toBe(1);
  });
});

describe('corner advice — phase-boundary re-evaluation', () => {
  it('a phase boundary overrides the WT evaluation gate', () => {
    // WT 1 → evaluates every 5 exchanges; exchange 2 would normally skip.
    const fighter = makeFighter({
      plan: planWith([{ trigger: { type: 'HP_BELOW', value: 50 }, override: { OE: 9 } }]),
      hp: 20,
      attributes: { WT: 1 } as never,
    });
    const noAdvice = evaluateConditions(
      fighter,
      makeFighter(),
      ctx({ exchange: 2, phase: 'MID' }),
      1
    );
    expect(noAdvice.newPlan.OE).toBe(5); // gated

    const withAdvice = evaluateConditions(
      fighter,
      makeFighter(),
      // Stage D: boundary advice now requires a real corner — a trainer
      // must be present for the off-cadence re-check to run.
      ctx({ exchange: 2, phase: 'MID', cornerAdvice: true, trainers: [{ tier: 'Master' } as never] }),
      1
    );
    expect(withAdvice.newPlan.OE).toBe(9); // corner spoke
  });
});
