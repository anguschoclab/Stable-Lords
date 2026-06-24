import { describe, it, expect } from 'vitest';
import { computeWeeklyBreakdown } from '@/engine/economy';
import type { StableEconomyInput } from '@/engine/economy';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';
import { FightingStyle } from '@/types/shared.types';
import { WARRIOR_UPKEEP_BASE, IDLE_STIPEND } from '@/constants/economy';

function makeIdleWarrior(): Warrior {
  return {
    id: 'w1' as any,
    name: 'Idle Warrior',
    style: FightingStyle.LungingAttack,
    attributes: { ST: 50, CN: 50, SZ: 50, WT: 50, WL: 50, SP: 50, DF: 50 },
    baseSkills: { OE: 50, KD: 50, DE: 50, AG: 50, IN: 50, HE: 50 },
    derivedStats: { AP: 10, DP: 10, HP: 100, SP: 10, IN: 10, HE: 10 } as any,
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
  } as unknown as Warrior;
}

describe('Idle stipend over-correction guard', () => {
  const baseInput: StableEconomyInput = {
    week: 1,
    roster: [makeIdleWarrior()],
    fame: 0,
    weather: 'Clear' as any,
    arenaHistory: [] as FightSummary[],
    trainers: [],
    trainingAssignments: [],
  };

  it('an idle stable with 1 warrior trends negative (stipend < upkeep)', () => {
    const breakdown = computeWeeklyBreakdown(baseInput);
    expect(breakdown.net).toBeLessThan(0);
  });

  it('stipend is less than per-warrior upkeep', () => {
    expect(IDLE_STIPEND).toBeLessThan(WARRIOR_UPKEEP_BASE);
  });

  it('an idle stable with 4 warriors trends strongly negative', () => {
    const input: StableEconomyInput = {
      ...baseInput,
      roster: [makeIdleWarrior(), makeIdleWarrior(), makeIdleWarrior(), makeIdleWarrior()],
    };
    const breakdown = computeWeeklyBreakdown(input);
    expect(breakdown.net).toBeLessThan(-100);
  });

  it('stipend is NOT credited when the stable fought bouts this week', () => {
    const input: StableEconomyInput = {
      ...baseInput,
      arenaHistory: [
        {
          week: 1,
          warriorIdA: 'w1' as any,
          warriorIdD: 'w2' as any,
          winner: 'A',
          arenaId: 'arena-1',
          fameA: 0,
          fameD: 0,
        } as FightSummary,
      ],
    };
    const breakdown = computeWeeklyBreakdown(input);
    const hasStipend = breakdown.income.some((i) => i.label === 'Idle Stipend');
    expect(hasStipend).toBe(false);
  });

  it('stipend is NOT credited when roster is empty', () => {
    const input: StableEconomyInput = {
      ...baseInput,
      roster: [],
    };
    const breakdown = computeWeeklyBreakdown(input);
    const hasStipend = breakdown.income.some((i) => i.label === 'Idle Stipend');
    expect(hasStipend).toBe(false);
  });

  it('stipend can be disabled via applyStipend=false', () => {
    const input: StableEconomyInput = {
      ...baseInput,
      applyStipend: false,
    };
    const breakdown = computeWeeklyBreakdown(input);
    const hasStipend = breakdown.income.some((i) => i.label === 'Idle Stipend');
    expect(hasStipend).toBe(false);
  });
});
