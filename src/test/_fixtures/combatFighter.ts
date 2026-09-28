import type { FighterState } from '@/engine/combat/resolution/types';
import { FightingStyle } from '@/types/shared.types';
import { makeFighterState } from '@/test/_fixtures/factories';

/** Shared FighterState with a fixed combat plan + CRUISING psych (resolution tests). */
export function makeCombatFighter(overrides: Partial<FighterState> = {}): FighterState {
  const combatPlan = {
    style: FightingStyle.StrikingAttack,
    OE: 5,
    AL: 5,
    killDesire: 5,
    target: 'Any',
  } as any;
  return makeFighterState({
    derived: { hp: 100, endurance: 100, damage: 5, encumbrance: 10 },
    plan: combatPlan,
    activePlan: combatPlan,
    psychState: 'CRUISING' as any,
    ...overrides,
  });
}
