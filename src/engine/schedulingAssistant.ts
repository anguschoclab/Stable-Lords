import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { isTooInjuredToFight } from './injuries';
import { getMatchupBonus } from '@/constants/combat';

/**
 * Defines the shape of matchup score.
 */
export interface MatchupScore {
  playerWarriorId: string;
  rivalWarrior: Warrior;
  rivalStableName: string;
  score: number;
  styleAdvantage: number;
  fameDiff: number;
  notes: string[];
}

/**
 * Calculates a numerical score for a matchup between a player warrior and a rival.
 * Considers style advantage, fame difference, win rates, and active rivalries.
 *
 * @param playerWarrior - The player's warrior
 * @param rivalWarrior - The rival warrior to challenge
 * @param state - The current game state
 * @returns A score where higher means a better/more attractive challenge
 */
export function scoreMatchup(
  playerWarrior: Warrior,
  rivalWarrior: Warrior,
  state: GameState
): number {
  if (!state) {
    return 100;
  }

  const styleAdvantage = getMatchupBonus(playerWarrior.style, rivalWarrior.style);
  const fameDiff = playerWarrior.fame - rivalWarrior.fame;

  let score = 100;
  score += styleAdvantage * 25;

  const absFameDiff = Math.abs(fameDiff);
  if (absFameDiff > 20) {
    score -= absFameDiff - 20;
  } else if (fameDiff > 10) {
    score -= 5;
  } else if (fameDiff < -10) {
    score += 10;
  }

  const pWinRate =
    (playerWarrior.career?.wins ?? 0) /
    Math.max(1, (playerWarrior.career?.wins ?? 0) + (playerWarrior.career?.losses ?? 0));
  const rWinRate =
    (rivalWarrior.career?.wins ?? 0) /
    Math.max(1, (rivalWarrior.career?.wins ?? 0) + (rivalWarrior.career?.losses ?? 0));
  score += (pWinRate - rWinRate) * 20;

  // Rivalry multiplier for grudge matches
  const rivalries = state.rivalries || [];
  const playerStableId = playerWarrior.stableId || state.player?.id;
  const rivalStableId = rivalWarrior.stableId;

  if (playerStableId && rivalStableId) {
    const rivalry = rivalries.find(
      (r) =>
        (r.stableIdA === playerStableId && r.stableIdB === rivalStableId) ||
        (r.stableIdB === playerStableId && r.stableIdA === rivalStableId)
    );
    if (rivalry) {
      score += rivalry.intensity * 50; // Grudge match!
    }
  }

  return score;
}

function getEligibleRivals(state: GameState): { warrior: Warrior; stable: RivalStableData }[] {
  const rivals: { warrior: Warrior; stable: RivalStableData }[] = [];
  for (const stable of state.rivals ?? []) {
    for (const warrior of stable.roster) {
      if (warrior.status === 'Active' && !isTooInjuredToFight(warrior.injuries)) {
        rivals.push({ warrior, stable });
      }
    }
  }
  return rivals;
}

function getMatchupNotes(
  playerWarrior: Warrior,
  rivalWarrior: Warrior,
  styleAdvantage: number,
  fameDiff: number
): string[] {
  const notes: string[] = [];
  if (styleAdvantage >= 2) notes.push('Hard counter! Excellent style advantage.');
  else if (styleAdvantage === 1) notes.push('Favorable style matchup.');
  else if (styleAdvantage === -1) notes.push('Unfavorable style matchup.');
  else if (styleAdvantage <= -2) notes.push('Severe style disadvantage! Hard counter against you.');

  if (fameDiff > 15) notes.push('Safe fight, but low fame reward.');
  else if (fameDiff < -15) notes.push('Dangerous fight, but high fame reward!');

  return notes;
}

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
  // Additionally saves execution time by lazy-evaluating getMatchupNotes
  for (let i = 0; i < eligibleRivals.length; i++) {
    const r = eligibleRivals[i];
    const score = scoreMatchup(playerWarrior, r.warrior, state);

    if (topScores.length < limit) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      topScores.push({
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(playerWarrior, r.warrior, styleAdvantage, fameDiff),
      });
      topScores.sort((a, b) => b.score - a.score);
    } else if (score > topScores[limit - 1].score) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      topScores[limit - 1] = {
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(playerWarrior, r.warrior, styleAdvantage, fameDiff),
      };
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
  // Additionally saves execution time by lazy-evaluating getMatchupNotes
  for (let i = 0; i < eligibleRivals.length; i++) {
    const r = eligibleRivals[i];
    const score = scoreMatchup(playerWarrior, r.warrior, state);

    if (bottomScores.length < limit) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      bottomScores.push({
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(playerWarrior, r.warrior, styleAdvantage, fameDiff),
      });
      bottomScores.sort((a, b) => a.score - b.score);
    } else if (score < bottomScores[limit - 1].score) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      bottomScores[limit - 1] = {
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(playerWarrior, r.warrior, styleAdvantage, fameDiff),
      };
      bottomScores.sort((a, b) => a.score - b.score);
    }
  }

  return bottomScores;
}
