/**
 * Psych State - Psychological state evaluation and desperate state handling
 */
import { PSYCH_STATE_MODS } from '../mechanics/conditionEngine';
import type { FighterState } from './types';
import type { ResolutionContext } from './types';
import type { CombatEvent } from '@/types/combat.types';
import type { PsychState } from '@/types/shared.types';

/**
 * Condition result with psych state.
 */
export interface ConditionResult {
  psychState: PsychState;
}

/**
 * Evaluate and apply psych state changes.
 */
export function evaluatePsychState(
  fA: FighterState,
  fD: FighterState,
  _ctx: ResolutionContext,
  condResultA: ConditionResult,
  condResultD: ConditionResult
): CombatEvent[] {
  const events: CombatEvent[] = [];

  if (condResultA.psychState !== fA.psychState) {
    fA.psychState = condResultA.psychState;
    if (condResultA.psychState !== 'Neutral') {
      events.push({
        type: 'STATE_CHANGE',
        actor: 'A',
        result: `PSYCH_${condResultA.psychState.toUpperCase()}`,
      });
    }
  }
  if (condResultD.psychState !== fD.psychState) {
    fD.psychState = condResultD.psychState;
    if (condResultD.psychState !== 'Neutral') {
      events.push({
        type: 'STATE_CHANGE',
        actor: 'D',
        result: `PSYCH_${condResultD.psychState.toUpperCase()}`,
      });
    }
  }

  return events;
}

/**
 * Get psych state modifiers.
 */
export function getPsychStateMods(fA: FighterState, fD: FighterState) {
  return {
    psychA: PSYCH_STATE_MODS[fA.psychState],
    psychD: PSYCH_STATE_MODS[fD.psychState],
  };
}

/**
 * Handle desperate state override.
 */
export function handleDesperateState(fA: FighterState, fD: FighterState): CombatEvent[] {
  const events: CombatEvent[] = [];

  for (const f of [fA, fD] as FighterState[]) {
    if (
      !f.desperate &&
      f.plan.desperatePlan &&
      (f.hp < f.maxHp * 0.3 || f.endurance < f.maxEndurance * 0.2)
    ) {
      const dp = f.plan.desperatePlan;
      f.activePlan = {
        ...f.plan,
        OE: dp.OE,
        AL: dp.AL,
        ...(dp.killDesire !== undefined && { killDesire: dp.killDesire }),
        offensiveTactic: dp.offensiveTactic ?? f.plan.offensiveTactic,
        defensiveTactic: dp.defensiveTactic ?? f.plan.defensiveTactic,
        target: dp.target ?? f.plan.target,
        protect: dp.protect ?? f.plan.protect,
        phases: undefined,
      };
      f.desperate = true;
      events.push({ type: 'STATE_CHANGE', actor: f.label, result: 'DESPERATE' });
    }
  }

  return events;
}
