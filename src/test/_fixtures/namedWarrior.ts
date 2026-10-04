import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, FightPlan } from '@/types/game';
import { ATTRS_10, makePlan } from '@/test/_fixtures/factories';

/**
 * Positional-arg warrior for page/hook tests that call
 * `makeTestWarrior('w1', 'Alpha')` — StrikingAttack, all-10 attributes.
 */
export function makeTestWarrior(id: string, name: string, overrides?: Partial<Warrior>): Warrior {
  return makeWarrior({ id: id as any, name: name, style: FightingStyle.StrikingAttack, attrs: ATTRS_10, overrides: {
    ...overrides,
  } });
}

/** The repeated planner default plan: StrikingAttack 5/5/5 + Decisiveness. */
export function makeDefaultPlan(style: FightingStyle = FightingStyle.StrikingAttack): FightPlan {
  return makePlan({
    style,
    OE: 5,
    AL: 5,
    killDesire: 5,
    offensiveTactic: 'Decisiveness',
    defensiveTactic: 'none',
  });
}
