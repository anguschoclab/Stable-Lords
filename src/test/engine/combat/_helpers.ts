import { FightingStyle, type Warrior, type FightPlan, type WarriorId } from '@/types/game';
import { makeComputedWarrior } from '@/test/_fixtures/factories';
import { makeStatWarrior } from '@/test/_fixtures/statWarrior';

/**
 *
 */
export function makeWarrior(
  name: string,
  style: FightingStyle,
  attrs: Partial<Record<'ST' | 'CN' | 'SZ' | 'WT' | 'WL' | 'SP' | 'DF', number>> = {},
  overrides: Partial<Warrior> = {}
): Warrior {
  return makeComputedWarrior(attrs, style, {
    id: `test_${name}` as WarriorId,
    name,
    fame: 0,
    age: 20,
    ...overrides,
  });
}

/**
 *
 */
export function makePlan(style: FightingStyle, overrides: Partial<FightPlan> = {}): FightPlan {
  return { style, OE: 7, AL: 6, killDesire: 5, target: 'Any', ...overrides };
}

/**
 *
 */
export function mk(style: FightingStyle, id: string): Warrior {
  return makeStatWarrior(style, id);
}
