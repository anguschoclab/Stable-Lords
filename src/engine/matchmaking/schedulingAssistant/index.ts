import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import {
  buildMatchupScore,
  getEligibleRivals,
  scoreMatchup,
  type MatchupScore,
} from './matchups';

export { type PairwiseHeadToHead } from './headToHead';
export { scorePairwiseMatchup } from './pairwise';
export { scoreMatchup, type MatchupScore } from './matchups';

/**
 * Recommends the best potential challenges for a player warrior.
 * Uses bounded insertion sort for O(N) performance on large rival lists.
 *
 * @param state - The current game state
 * @param playerWarrior - The warrior looking for a challenge
 * @param limit - Maximum number of recommendations to return
 * @returns Array of MatchupScore objects sorted by desirability
 */
export function getRecommendedChallenges(
  state: GameState,
  playerWarrior: Warrior,
  limit = 3
): MatchupScore[] {
  const eligibleRivals = getEligibleRivals(state);
  const topScores: MatchupScore[] = [];

  // Bolt Optimization: Bounded Insertion Sort (O(N) instead of O(N log N))
  // Prevents allocating and sorting a massive array when we only need the top K items
  for (const r of eligibleRivals) {
    const score = scoreMatchup(playerWarrior, r.warrior, state);

    if (topScores.length < limit) {
      topScores.push(buildMatchupScore(playerWarrior, r, state));
      topScores.sort((a, b) => b.score - a.score);
    } else if (score > (topScores[limit - 1]?.score ?? -Infinity)) {
      topScores[limit - 1] = buildMatchupScore(playerWarrior, r, state);
      topScores.sort((a, b) => b.score - a.score);
    }
  }

  return topScores;
}

/**
 * Identifies the most dangerous or unattractive matchups to avoid.
 *
 * @param state - The current game state
 * @param playerWarrior - The warrior checking for risks
 * @param limit - Maximum number of warnings to return
 * @returns Array of MatchupScore objects sorted by danger/undesirability
 */
export function getMatchupsToAvoid(
  state: GameState,
  playerWarrior: Warrior,
  limit = 3
): MatchupScore[] {
  const eligibleRivals = getEligibleRivals(state);
  const bottomScores: MatchupScore[] = [];

  // Bolt Optimization: Bounded Insertion Sort (O(N) instead of O(N log N))
  // Prevents allocating and sorting a massive array when we only need the top K items
  for (const r of eligibleRivals) {
    const score = scoreMatchup(playerWarrior, r.warrior, state);

    if (bottomScores.length < limit) {
      bottomScores.push(buildMatchupScore(playerWarrior, r, state));
      bottomScores.sort((a, b) => a.score - b.score);
    } else if (score < (bottomScores[limit - 1]?.score ?? Infinity)) {
      bottomScores[limit - 1] = buildMatchupScore(playerWarrior, r, state);
      bottomScores.sort((a, b) => a.score - b.score);
    }
  }

  return bottomScores;
}
