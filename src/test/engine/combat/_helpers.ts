import { FightingStyle, type Warrior, type FightPlan, type WarriorId } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';

export function makeWarrior(
  name: string,
  style: FightingStyle,
  attrs: Partial<Record<'ST' | 'CN' | 'SZ' | 'WT' | 'WL' | 'SP' | 'DF', number>> = {},
  overrides: Partial<Warrior> = {}
): Warrior {
  const full = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10, ...attrs };
  const { baseSkills, derivedStats } = computeWarriorStats(full, style);
  return {
    id: `test_${name}` as WarriorId,
    name,
    style,
    attributes: full,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    traits: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    ...overrides,
  };
}

export function makePlan(style: FightingStyle, overrides: Partial<FightPlan> = {}): FightPlan {
  return { style, OE: 7, AL: 6, killDesire: 5, target: 'Any', ...overrides };
}

export function mk(style: FightingStyle, id: string): Warrior {
  const attrs = { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  return {
    id: id as WarriorId,
    name: id,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    traits: [],
  };
}
