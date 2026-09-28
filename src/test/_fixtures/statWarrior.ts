import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

/** Shared combat-test warrior — all-15 attributes, stats derived via computeWarriorStats. */
export function makeStatWarrior(style: FightingStyle, id: string, attrs?: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number }): Warrior {
  const attributes = attrs ?? { ST: 15, CN: 15, SZ: 15, WT: 15, WL: 15, SP: 15, DF: 15 };
  const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
  return {
    id: id as WarriorId,
    name: id,
    style,
    attributes,
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
