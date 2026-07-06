import { describe, it, expect } from 'vitest';
import { MatchScoringService } from '@/engine/matchmakingServices';

describe('matchmakingServices', () => {
  describe('MatchScoringService', () => {
    it('calculates a base pairing score with fame proximity bonus', () => {
      const score = MatchScoringService.calculatePairingScore({
        p_fame: 10,
        r_fame: 12,
        rivalStableId: 'rival-1',
        playerStableId: 'player-1',
        week: 5,
        isRecentStyleMatch: false,
        isChallenged: false,
        isAvoided: false,
        rng: () => 0,
      });
      // base 100 + fame proximity (30 - 2*3=24) + style diversity 20 + jitter 0 = 144
      expect(score).toBe(144);
    });

    it('applies challenge modifier (+500)', () => {
      const score = MatchScoringService.calculatePairingScore({
        p_fame: 10,
        r_fame: 10,
        rivalStableId: 'rival-1',
        playerStableId: 'player-1',
        week: 5,
        isRecentStyleMatch: false,
        isChallenged: true,
        isAvoided: false,
        rng: () => 0,
      });
      // base 100 + fame proximity 30 + style diversity 20 + challenge 500 = 650
      expect(score).toBe(650);
    });

    it('applies avoid modifier (-500)', () => {
      const score = MatchScoringService.calculatePairingScore({
        p_fame: 10,
        r_fame: 10,
        rivalStableId: 'rival-1',
        playerStableId: 'player-1',
        week: 5,
        isRecentStyleMatch: false,
        isChallenged: false,
        isAvoided: true,
        rng: () => 0,
      });
      // base 100 + fame proximity 30 + style diversity 20 - avoid 500 = -350
      expect(score).toBe(-350);
    });
  });

  describe('AIBoutService removal', () => {
    it('does not export AIBoutService', async () => {
      const mod = await import('@/engine/matchmakingServices');
      expect((mod as any).AIBoutService).toBeUndefined();
    });
  });
});
