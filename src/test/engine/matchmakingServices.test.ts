import { describe, it, expect } from 'vitest';
import { MatchScoringService } from '@/engine/matchmakingServices';
import { MATCHMAKING_SCORE_CONSTANTS } from '@/constants/economy';

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

  describe('Constants usage', () => {
    const baseParams = {
      p_fame: 10,
      r_fame: 10,
      rivalStableId: 'rival-1',
      playerStableId: 'player-1',
      week: 5,
      isRecentStyleMatch: false,
      isChallenged: false,
      isAvoided: false,
      rng: () => 0,
    };

    it('uses BASE_SCORE as the starting score', () => {
      const score = MatchScoringService.calculatePairingScore(baseParams);
      // BASE_SCORE + fame proximity 30 + style diversity 20 + jitter 0
      expect(score).toBe(MATCHMAKING_SCORE_CONSTANTS.BASE_SCORE + 30 + 20);
    });

    it('uses RIVALRY_HIGH_BONUS when rivalryIntensity >= 4', () => {
      const score = MatchScoringService.calculatePairingScore({
        ...baseParams,
        rivalryIntensity: 4,
      });
      const baseScore = MatchScoringService.calculatePairingScore(baseParams);
      expect(score - baseScore).toBe(MATCHMAKING_SCORE_CONSTANTS.RIVALRY_HIGH_BONUS);
    });

    it('uses RIVALRY_LOW_BONUS when rivalryIntensity < 4', () => {
      const score = MatchScoringService.calculatePairingScore({
        ...baseParams,
        rivalryIntensity: 2,
      });
      const baseScore = MatchScoringService.calculatePairingScore(baseParams);
      expect(score - baseScore).toBe(MATCHMAKING_SCORE_CONSTANTS.RIVALRY_LOW_BONUS);
    });

    it('uses VENDETTA_BONUS for vendetta intent', () => {
      const score = MatchScoringService.calculatePairingScore({
        ...baseParams,
        rivalIntent: 'VENDETTA',
      });
      const baseScore = MatchScoringService.calculatePairingScore(baseParams);
      expect(score - baseScore).toBe(MATCHMAKING_SCORE_CONSTANTS.VENDETTA_BONUS);
    });

    it('uses RECOVERY_PENALTY for recovery intent', () => {
      const score = MatchScoringService.calculatePairingScore({
        ...baseParams,
        p_fame: 50,
        r_fame: 10,
        rivalIntent: 'RECOVERY',
      });
      const baseScore = MatchScoringService.calculatePairingScore({
        ...baseParams,
        p_fame: 50,
        r_fame: 10,
      });
      expect(score - baseScore).toBe(MATCHMAKING_SCORE_CONSTANTS.RECOVERY_PENALTY);
    });

    it('uses STYLE_MATCH_BONUS when !isRecentStyleMatch', () => {
      const score = MatchScoringService.calculatePairingScore({
        ...baseParams,
        isRecentStyleMatch: false,
      });
      const scoreWithRecent = MatchScoringService.calculatePairingScore({
        ...baseParams,
        isRecentStyleMatch: true,
      });
      expect(score - scoreWithRecent).toBe(MATCHMAKING_SCORE_CONSTANTS.STYLE_MATCH_BONUS);
    });

    it('uses CHALLENGE_BONUS when isChallenged is true', () => {
      const score = MatchScoringService.calculatePairingScore({
        ...baseParams,
        isChallenged: true,
      });
      const baseScore = MatchScoringService.calculatePairingScore(baseParams);
      expect(score - baseScore).toBe(MATCHMAKING_SCORE_CONSTANTS.CHALLENGE_BONUS);
    });

    it('uses AVOID_PENALTY when isAvoided is true', () => {
      const score = MatchScoringService.calculatePairingScore({
        ...baseParams,
        isAvoided: true,
      });
      const baseScore = MatchScoringService.calculatePairingScore(baseParams);
      expect(score - baseScore).toBe(MATCHMAKING_SCORE_CONSTANTS.AVOID_PENALTY);
    });
  });

  describe('AIBoutService removal', () => {
    it('does not export AIBoutService', async () => {
      const mod = await import('@/engine/matchmakingServices');
      expect((mod as any).AIBoutService).toBeUndefined();
    });
  });
});
