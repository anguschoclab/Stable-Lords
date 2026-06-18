import { describe, it, expect } from 'vitest';
import {
  isBronzeMatch,
  isChampionshipFinal,
  getRoundName,
  isByeMatch,
  getEstimatedWeek,
} from '@/engine/matchmaking/tournamentHelpers';
import type { TournamentBout } from '@/types/game';

describe('tournamentHelpers', () => {
  const t = (round: number, matchIndex: number, warriorIdD: string = 'w2'): TournamentBout =>
    ({
      round,
      matchIndex,
      warriorIdD,
    }) as unknown as TournamentBout;

  describe('isBronzeMatch', () => {
    it('returns true when round is 6 and matchIndex is 1', () => {
      expect(isBronzeMatch(t(6, 1))).toBe(true);
    });

    it('returns false for other rounds and match indices', () => {
      expect(isBronzeMatch(t(6, 0))).toBe(false);
      expect(isBronzeMatch(t(5, 1))).toBe(false);
    });
  });

  describe('isChampionshipFinal', () => {
    it('returns true when round equals totalRounds and is >= 6', () => {
      expect(isChampionshipFinal(t(7, 0), 7)).toBe(true);
      expect(isChampionshipFinal(t(6, 0), 6)).toBe(true);
    });

    it('returns false when round does not equal totalRounds or is < 6', () => {
      expect(isChampionshipFinal(t(5, 0), 5)).toBe(false);
      expect(isChampionshipFinal(t(6, 0), 7)).toBe(false);
    });
  });

  describe('getRoundName', () => {
    it('returns Championship for round 7 total 7', () => {
      expect(getRoundName(7, 7)).toBe('Championship');
    });

    it('returns Finals for round 6 total 6', () => {
      expect(getRoundName(6, 6)).toBe('Finals');
    });

    it('returns predefined names for early rounds', () => {
      expect(getRoundName(1, 6)).toBe('Round of 64');
      expect(getRoundName(4, 6)).toBe('Quarter-finals');
      expect(getRoundName(6, 7)).toBe('Finals & Bronze');
    });

    it('returns fallback string for unknown rounds', () => {
      expect(getRoundName(10, 10)).toBe('Round 10');
    });
  });

  describe('isByeMatch', () => {
    it('returns true when warriorIdD is bye', () => {
      expect(isByeMatch(t(1, 1, 'bye'))).toBe(true);
    });

    it('returns false for actual warriors', () => {
      expect(isByeMatch(t(1, 1, 'w2'))).toBe(false);
    });
  });

  describe('getEstimatedWeek', () => {
    it('calculates correct estimated week', () => {
      expect(getEstimatedWeek(10, 1)).toBe(10);
      expect(getEstimatedWeek(10, 2)).toBe(11);
      expect(getEstimatedWeek(10, 5)).toBe(14);
    });
  });
});
