import { describe, it, expect } from 'vitest';
import {
  calculateLeaderboardData,
  calculateBestByStyle,
  calculateRisingStars,
} from '@/engine/core/leaderboardCalculations';
import type { FightSummary } from '@/types/game';

describe('leaderboardCalculations', () => {
  const f = (
    wA: string,
    wD: string,
    win: 'A' | 'D',
    by: string,
    styleA: string,
    styleD: string,
    week: number
  ): FightSummary =>
    ({
      id: 'f1',
      week,
      warriorIdA: wA,
      warriorIdD: wD,
      title: `${wA} vs ${wD}`,
      styleA,
      styleD,
      winner: win,
      by,
      fameA: win === 'A' ? 10 : 5,
      fameD: win === 'D' ? 10 : 5,
      logs: [],
    }) as unknown as FightSummary;

  const fights = [
    f('W1', 'W2', 'A', 'Kill', 'Power', 'Agility', 1),
    f('W1', 'W3', 'A', 'Decision', 'Power', 'Balanced', 2),
    f('W4', 'W1', 'D', 'Decision', 'Agility', 'Power', 3), // W1 wins again
    f('W2', 'W3', 'A', 'Kill', 'Agility', 'Balanced', 4),
  ];

  describe('calculateLeaderboardData', () => {
    it('calculates wins, losses, kills and rate correctly', () => {
      const data = calculateLeaderboardData(fights);
      const w1 = data.find((d) => d.name === 'W1');
      expect(w1).toBeDefined();
      expect(w1?.w).toBe(3);
      expect(w1?.l).toBe(0);
      expect(w1?.k).toBe(1);
      expect(w1?.rate).toBe(1);
    });

    it('limits to top 5 results', () => {
      const moreFights = [
        ...fights,
        f('W5', 'W6', 'A', 'Decision', 'S', 'S', 1),
        f('W7', 'W8', 'A', 'Decision', 'S', 'S', 1),
        f('W9', 'W10', 'A', 'Decision', 'S', 'S', 1),
      ];
      const data = calculateLeaderboardData(moreFights);
      expect(data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('calculateBestByStyle', () => {
    it('finds the best warrior for given styles', () => {
      const data = calculateBestByStyle(fights, ['Power', 'Agility']);
      const powerBest = data.find((d) => d.style === 'Power');
      expect(powerBest?.name).toBe('W1');
      expect(powerBest?.wins).toBe(3);

      const agilityBest = data.find((d) => d.style === 'Agility');
      expect(agilityBest?.name).toBe('W2');
      expect(agilityBest?.wins).toBe(1);
    });

    it('returns No Data for styles without wins', () => {
      const data = calculateBestByStyle(fights, ['UnknownStyle']);
      expect(data[0]?.name).toBe('No Data');
      expect(data[0]?.wins).toBe(0);
    });

    it('breaks ties by selecting the first warrior to reach max wins', () => {
      const tieFights = [
        f('T1', 'X1', 'A', 'Decision', 'Power', 'Other', 1), // T1 gets 1 win
        f('T2', 'X2', 'A', 'Decision', 'Power', 'Other', 2), // T2 gets 1 win
        f('T1', 'X3', 'A', 'Decision', 'Power', 'Other', 3), // T1 gets 2 wins
        f('T2', 'X4', 'A', 'Decision', 'Power', 'Other', 4), // T2 gets 2 wins
      ];
      const data = calculateBestByStyle(tieFights, ['Power']);
      expect(data[0]?.wins).toBe(2);
      expect(data[0]?.name).toBe('T1');
    });

    it('skips fights where winner is null', () => {
      const nullWinnerFights = [
        f('W1', 'W2', 'A', 'Kill', 'Power', 'Agility', 1),
        { ...f('W1', 'W2', 'A', 'Decision', 'Power', 'Agility', 2), winner: null } as FightSummary,
      ];
      const data = calculateBestByStyle(nullWinnerFights, ['Power']);
      expect(data[0]?.name).toBe('W1');
      expect(data[0]?.wins).toBe(1);
    });

    it('returns empty array for empty styles', () => {
      const data = calculateBestByStyle(fights, []);
      expect(data).toEqual([]);
    });

    it('returns No Data for all styles when allFights is empty', () => {
      const data = calculateBestByStyle([], ['Power', 'Agility']);
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({ style: 'Power', name: 'No Data', wins: 0 });
      expect(data[1]).toEqual({ style: 'Agility', name: 'No Data', wins: 0 });
    });

    it('ignores styles not in the input set', () => {
      const data = calculateBestByStyle(fights, ['Power']);
      expect(data).toHaveLength(1);
      expect(data[0]?.style).toBe('Power');
      // Agility wins exist in fights but are not tracked
    });

    it('tracks 3+ styles correctly in a single pass', () => {
      const multiStyleFights = [
        f('P1', 'X1', 'A', 'Decision', 'Power', 'Other', 1),
        f('P1', 'X2', 'A', 'Decision', 'Power', 'Other', 2),
        f('A1', 'X3', 'A', 'Decision', 'Agility', 'Other', 3),
        f('A1', 'X4', 'A', 'Decision', 'Agility', 'Other', 4),
        f('A1', 'X5', 'A', 'Decision', 'Agility', 'Other', 5),
        f('B1', 'X6', 'A', 'Decision', 'Balanced', 'Other', 6),
      ];
      const data = calculateBestByStyle(multiStyleFights, ['Power', 'Agility', 'Balanced']);
      const power = data.find((d) => d.style === 'Power')!;
      const agility = data.find((d) => d.style === 'Agility')!;
      const balanced = data.find((d) => d.style === 'Balanced')!;
      expect(power.name).toBe('P1');
      expect(power.wins).toBe(2);
      expect(agility.name).toBe('A1');
      expect(agility.wins).toBe(3);
      expect(balanced.name).toBe('B1');
      expect(balanced.wins).toBe(1);
    });
  });

  describe('calculateRisingStars', () => {
    it('identifies rising stars (<=5 matches, >=3 wins)', () => {
      const data = calculateRisingStars(fights);
      expect(data.length).toBe(1);
      expect(data[0]?.name).toBe('W1');
      expect(data[0]?.wins).toBe(3);
      expect(data[0]?.matches).toBe(3);
    });

    it('excludes warriors with more than 5 matches or less than 3 wins', () => {
      const manyFights = [
        ...fights,
        f('W1', 'W2', 'A', 'Kill', 'Power', 'Agility', 5),
        f('W1', 'W2', 'A', 'Kill', 'Power', 'Agility', 6),
        f('W1', 'W2', 'A', 'Kill', 'Power', 'Agility', 7),
      ];
      const data = calculateRisingStars(manyFights);
      expect(data.find((d) => d.name === 'W1')).toBeUndefined();
    });
  });
});
