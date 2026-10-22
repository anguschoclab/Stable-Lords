import { computeWarriorStats } from '@/engine/warrior/skillCalc';
import { generateId } from '@/utils/idUtils';
import { makeWarrior as fixtureWarrior } from '@/test/_fixtures/factories';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

/** Canonical zero-state warrior fields — the contract pinned by warriorFactory tests. */
export const ZERO_WARRIOR_FIELDS = {
  fame: 0,
  popularity: 0,
  titles: [],
  injuries: [],
  flair: [],
  career: { wins: 0, losses: 0, kills: 0 },
  champion: false,
  status: 'Active',
} as const;

/** Shared combat-test warrior — all-15 attributes, stats derived via computeWarriorStats. */
export function makeStatWarrior(
  style: FightingStyle,
  id: string,
  attrs?: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number }
): Warrior {
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

/** Mid-stat attributes shared by chart/matchmaking warrior specs. */
export const MID_ATTRIBUTES = { ST: 10, CN: 12, SZ: 8, WT: 15, WL: 14, SP: 11, DF: 9 };

/** Striking 'TestWarrior' w1 with MID_ATTRIBUTES — shared wrapper. */
export function makeMidWarrior(over: Partial<Warrior> = {}): Warrior {
  return fixtureWarrior({
    id: 'w1' as WarriorId,
    name: 'TestWarrior',
    style: 'Striking Attack' as FightingStyle,
    attributes: { ...MID_ATTRIBUTES },
    fame: 0,
    ...over,
  });
}

/** Striking 'TestWarrior' with generated id — shared economy/bankruptcy wrapper. */
export function makeEconomyWarrior(over: Partial<Warrior> = {}): Warrior {
  return fixtureWarrior({
    id: over.id ?? (generateId(undefined, 'w') as Warrior['id']),
    name: 'TestWarrior',
    style: 'Striking Attack' as FightingStyle,
    fame: 5,
    age: 20,
    ...over,
  });
}

/** StrikingAttack warrior with emptied skill bags — pipeline-impact specs
 *  that drive impacts from roster shape, not combat stats. */
export function makeBareWarrior(id: string, name: string = id): Warrior {
  return fixtureWarrior({
    id: id as WarriorId,
    name,
    style: 'Striking Attack' as FightingStyle,
    baseSkills: {} as any,
    derivedStats: {} as any,
    fame: 0,
    age: 20,
  });
}
