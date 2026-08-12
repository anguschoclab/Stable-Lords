import { describe, it, expect } from 'vitest';
import { computeWeeklyBreakdown, type StableEconomyInput } from '@/engine/economy';
import { WARRIOR_UPKEEP_BASE } from '@/constants/economy';
import type { Warrior } from '@/types/game';
import { FightingStyle } from '@/types/game';
import { generateId } from '@/utils/idUtils';

function makeWarrior(fame: number): Warrior {
  return {
    id: generateId(undefined, 'w') as Warrior['id'],
    name: 'TestWarrior',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 20,
    traits: [],
  } as Warrior;
}

function makeInput(fame: number): StableEconomyInput {
  return {
    week: 5,
    roster: [makeWarrior(fame)],
    fame: 0,
    weather: 'Clear',
    arenaHistory: [],
    trainers: [],
    trainingAssignments: [],
  };
}

describe('Upkeep formula — doc alignment', () => {
  it('base upkeep is 60g for fame-0 warrior', () => {
    expect(WARRIOR_UPKEEP_BASE).toBe(60);
    const b = computeWeeklyBreakdown(makeInput(0));
    const upkeep = b.expenses.find((e) => e.label.startsWith('Warrior upkeep'));
    expect(upkeep!.amount).toBe(60);
  });

  it('fame premium is Math.round(fame * 1.5) not floor(fame/10)*15', () => {
    // fame 25: round(25*1.5)=38, not floor(25/10)*15=30
    const b = computeWeeklyBreakdown(makeInput(25));
    const upkeep = b.expenses.find((e) => e.label.startsWith('Warrior upkeep'));
    expect(upkeep!.amount).toBe(60 + 38); // 98
  });

  it('30 fame = 105g/week (matches doc example)', () => {
    const b = computeWeeklyBreakdown(makeInput(30));
    const upkeep = b.expenses.find((e) => e.label.startsWith('Warrior upkeep'));
    expect(upkeep!.amount).toBe(105); // 60 + round(30*1.5) = 60 + 45
  });

  it('non-multiple-of-10 fame uses exact 1.5x multiplier', () => {
    // fame 7: round(7*1.5)=11, not floor(7/10)*15=0
    const b = computeWeeklyBreakdown(makeInput(7));
    const upkeep = b.expenses.find((e) => e.label.startsWith('Warrior upkeep'));
    expect(upkeep!.amount).toBe(60 + 11); // 71
  });
});
