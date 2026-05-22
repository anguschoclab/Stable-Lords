import { describe, it, expect } from 'vitest';
import { calculateStableStats } from '@/engine/stats/stableStats';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

// Mock warrior creation helper
const createMockWarrior = (
  id: string,
  status: 'Active' | 'Dead' | 'Retired',
  fame: number,
  wins: number,
  losses: number,
  style: string,
  attributes: Partial<Record<string, number>>
): Warrior => {
  return {
    id: id as WarriorId,
    name: `Warrior ${id}`,
    status,
    fame,
    popularity: 0,
    style: style as any, // Cast to FightingStyle
    champion: false,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins, losses, kills: 0 },
    attributes: {
      ST: 10,
      CN: 10,
      SZ: 10,
      WT: 10,
      WL: 10,
      SP: 10,
      DF: 10,
      ...attributes,
    },
  };
};

describe('calculateStableStats', () => {
  it('should calculate stats for an empty roster', () => {
    const stats = calculateStableStats([]);
    expect(stats.activeCount).toBe(0);
    expect(stats.totalWins).toBe(0);
    expect(stats.totalLosses).toBe(0);
    expect(stats.totalKills).toBe(0);
    expect(stats.totalFame).toBe(0);
    expect(stats.avgFame).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.styleCounts).toEqual({});
    expect(stats.topWarrior).toBeNull();
    expect(stats.avgAttributes).toEqual({ ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 });
  });

  it('should ignore non-active warriors', () => {
    const roster = [
      createMockWarrior('1', 'Dead', 100, 5, 2, 'Balanced', {}),
      createMockWarrior('2', 'Retired', 200, 10, 1, 'Aggressive', {}),
    ];

    const stats = calculateStableStats(roster);
    expect(stats.activeCount).toBe(0);
    expect(stats.totalFame).toBe(0);
  });

  it('should calculate aggregated stats correctly for active warriors', () => {
    const roster = [
      createMockWarrior('1', 'Active', 100, 5, 5, 'Balanced', { ST: 15, CN: 5 }), // 50% WR
      createMockWarrior('2', 'Active', 300, 15, 5, 'Aggressive', { ST: 25, CN: 15 }), // 75% WR
      createMockWarrior('3', 'Dead', 1000, 50, 0, 'Defensive', { ST: 30 }), // Ignored
    ];

    const stats = calculateStableStats(roster);

    expect(stats.activeCount).toBe(2);
    expect(stats.totalFame).toBe(400); // 100 + 300
    expect(stats.avgFame).toBe(200); // 400 / 2
    expect(stats.totalWins).toBe(20); // 5 + 15
    expect(stats.totalLosses).toBe(10); // 5 + 5
    expect(stats.winRate).toBe(67); // Math.round((20 / 30) * 100)

    expect(stats.styleCounts).toEqual({
      Balanced: 1,
      Aggressive: 1,
    });

    expect(stats.topWarrior?.id).toBe('2'); // Highest fame among active

    // Check attributes average (15+25)/2 = 20 for ST, (5+15)/2 = 10 for CN
    expect(stats.avgAttributes.ST).toBe(20);
    expect(stats.avgAttributes.CN).toBe(10);
    // Others should default to 10 from mock
    expect(stats.avgAttributes.SZ).toBe(10);
  });

  it('should handle missing career or attribute data gracefully', () => {
    // Create a warrior directly to omit optional fields
    const partialWarrior: any = {
      id: '1',
      status: 'Active',
      style: 'Tricky',
      attributes: { ST: 10 }, // Missing other attributes
      // No career object
      // No fame
    };

    const stats = calculateStableStats([partialWarrior as Warrior]);

    expect(stats.totalWins).toBe(0);
    expect(stats.totalLosses).toBe(0);
    expect(stats.totalFame).toBe(0);
    expect(stats.avgFame).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.avgAttributes.ST).toBe(10);
    expect(stats.avgAttributes.CN).toBe(0); // Coalesced to 0
  });
});
