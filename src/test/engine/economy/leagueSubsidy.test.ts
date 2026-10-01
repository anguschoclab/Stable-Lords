import { describe, it, expect } from 'vitest';
import { computeWeeklyBreakdown } from '@/engine/economy';
import type { StableEconomyInput } from '@/engine/economy/weeklyBreakdown';
import { LEAGUE_SUBSIDY_RATE } from '@/constants/economy';
import type { Warrior } from '@/types/warrior.types';

const fame0Warrior = (id: string): Warrior =>
  ({
    id,
    name: id,
    style: 'StrikingAttack',
    fame: 0,
    status: 'Active',
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    career: { wins: 0, losses: 0, kills: 0 },
  }) as unknown as Warrior;

const baseInput = (over: Partial<StableEconomyInput> = {}): StableEconomyInput => ({
  week: 5,
  roster: [fame0Warrior('w1'), fame0Warrior('w2')],
  fame: 0,
  weather: 'Clear',
  arenaHistory: [],
  trainers: [],
  trainingAssignments: [],
  isPlayer: false,
  ...over,
});

describe('league subsidy', () => {
  it('covers stipendScale × (upkeep − purse income) for AI stables', () => {
    // 2 fame-0 warriors → upkeep 120; no fights → gap 120; × 0.65 = 78.
    const b = computeWeeklyBreakdown(baseInput({ stipendScale: LEAGUE_SUBSIDY_RATE }));
    const subsidy = b.income.find((i) => i.label === 'League subsidy');
    expect(subsidy?.amount).toBe(Math.round(LEAGUE_SUBSIDY_RATE * 120));
  });

  it('shrinks as purse income covers upkeep', () => {
    // One purse 90 + win 35 = 125 fight income vs 120 upkeep → gap 0 → no subsidy.
    const b = computeWeeklyBreakdown(
      baseInput({
        stipendScale: LEAGUE_SUBSIDY_RATE,
        arenaHistory: [
          {
            id: 'f1',
            week: 5,
            warriorIdA: 'w1',
            warriorIdD: 'x1',
            winner: 'A',
            by: 'KO',
            fameA: 0,
            arenaId: 'standard_arena',
          },
        ] as StableEconomyInput['arenaHistory'],
      })
    );
    expect(b.income.some((i) => i.label === 'League subsidy')).toBe(false);
  });

  it('is off at scale 0 (soft-cap world) and never applies to the player', () => {
    const zero = computeWeeklyBreakdown(baseInput({ stipendScale: 0 }));
    expect(zero.income.some((i) => i.label === 'League subsidy')).toBe(false);

    const player = computeWeeklyBreakdown(baseInput({ stipendScale: 1, isPlayer: true }));
    expect(player.income.some((i) => i.label === 'League subsidy')).toBe(false);
  });
});
