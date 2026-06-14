import { describe, it, expect } from 'vitest';
import { calculateLeaderboardData, calculateBestByStyle, calculateRisingStars } from '@/engine/core/leaderboardCalculations';
import type { FightSummary } from '@/types/game';

describe('leaderboardCalculations', () => {
  const f = (wA: string, wD: string, win: 'A'|'D', by: string, styleA: string, styleD: string, week: number): FightSummary => ({
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
    logs: []
  } as unknown as FightSummary);

  const fights = [
    f('W1', 'W2', 'A', 'Kill', 'Power', 'Agility', 1),
    f('W1', 'W3', 'A', 'Decision', 'Power', 'Balanced', 2),
    f('W4', 'W1', 'D', 'Decision', 'Agility', 'Power', 3), // W1 wins again
    f('W2', 'W3', 'A', 'Kill', 'Agility', 'Balanced', 4),
  ];

  describe('calculateLeaderboardData', () => {
    it('calculates wins, losses, kills and rate correctly', () => {
      const data = calculateLeaderboardData(fights);
      const w1 = data.find(d => d.name === 'W1');
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
        f('W9', 'W10', 'A', 'Decision', 'S', 'S', 1)
      ];
      const data = calculateLeaderboardData(moreFights);
      expect(data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('calculateBestByStyle', () => {
    it('finds the best warrior for given styles', () => {
      const data = calculateBestByStyle(fights, ['Power', 'Agility']);
      const powerBest = data.find(d => d.style === 'Power');
      expect(powerBest?.name).toBe('W1');
      expect(powerBest?.wins).toBe(3);

      const agilityBest = data.find(d => d.style === 'Agility');
      expect(agilityBest?.name).toBe('W2');
      expect(agilityBest?.wins).toBe(1);
    });

    it('returns No Data for styles without wins', () => {
      const data = calculateBestByStyle(fights, ['UnknownStyle']);
      expect(data[0]?.name).toBe('No Data');
      expect(data[0]?.wins).toBe(0);
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
        f('W1', 'W2', 'A', 'Kill', 'Power', 'Agility', 7)
      ];
      const data = calculateRisingStars(manyFights);
      expect(data.find(d => d.name === 'W1')).toBeUndefined();
    });
  });
});
