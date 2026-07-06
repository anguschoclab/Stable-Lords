/**
 * Matchmaking Scoring Service - handles the weights and logic for pairing warriors.
 */
export const MatchScoringService = {
  /**
   * Calculates a booking score for a potential matchup.
   * Higher score = more likely to be booked.
   */
  calculatePairingScore(params: {
    p_fame: number;
    r_fame: number;
    rivalStableId: string;
    playerStableId: string;
    week: number;
    rivalryIntensity?: number;
    lastMatchWeek?: number;
    isRecentStyleMatch: boolean;
    isChallenged: boolean;
    isAvoided: boolean;
    rng: () => number;
    rivalIntent?: string;
  }): number {
    const {
      p_fame,
      r_fame,
      rivalryIntensity,
      lastMatchWeek,
      isRecentStyleMatch,
      isChallenged,
      isAvoided,
      week,
      rng,
      rivalIntent,
    } = params;

    let score = 100;

    // 1. Fame proximity bonus (0-30)
    score += Math.max(0, 30 - Math.abs(p_fame - r_fame) * 3);

    // 2. Rivalry & Strategic Intent
    if (rivalryIntensity !== undefined) {
      score += rivalryIntensity >= 4 ? 200 : 50;
    }

    // VENDETTA: If intentional targeting of the player
    if (rivalIntent === 'VENDETTA') {
      score += 300;
    }

    // RECOVERY: Avoid high-risk bouts
    if (rivalIntent === 'RECOVERY' && p_fame > r_fame + 20) {
      score -= 200;
    }

    // 3. Style diversity bonus
    if (!isRecentStyleMatch) score += 20;

    // 4. Repeat penalty
    if (lastMatchWeek !== undefined && lastMatchWeek >= week - 2) {
      score -= 100;
    }

    // 5. Challenge / Avoid modifiers
    if (isChallenged) score += 500;
    if (isAvoided) score -= 500;

    // 6. Random jitter
    score += Math.floor(rng() * 16);

    return score;
  },
};
