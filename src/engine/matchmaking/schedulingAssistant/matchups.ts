import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { isTooInjuredToFight } from '../../injuries';
import { getMatchupBonus } from '@/constants/combat';
import { MATCHMAKING_SCORE_CONSTANTS } from '@/constants/economy';
import { isActive } from '@/engine/warrior/warriorStatus';
import { scorePairwiseMatchup } from './pairwise';
import { headToHeadFor, type HeadToHeadRecord } from './headToHead';

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
  rankDiff?: number;
  headToHead?: HeadToHeadRecord;
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

  let score = scorePairwiseMatchup(playerWarrior, rivalWarrior, {
    rankings: state.realmRankings,
    arenaHistory: state.arenaHistory,
    rivalries: state.rivalries,
    rivalryMap: state.rivalryMap,
    aStableId: playerWarrior.stableId || state.player?.id,
    bStableId: rivalWarrior.stableId,
    week: state.week,
  });

  // Player challenge/avoid modifiers
  if (state.playerChallenges?.includes(rivalWarrior.id)) {
    score += MATCHMAKING_SCORE_CONSTANTS.CHALLENGE_BONUS;
  }
  if (state.playerAvoids?.includes(rivalWarrior.id)) {
    score += MATCHMAKING_SCORE_CONSTANTS.AVOID_PENALTY;
  }

  return score;
}

/**
 * Eligible rivals.
 */
export function getEligibleRivals(
  state: GameState
): { warrior: Warrior; stable: RivalStableData }[] {
  const rivals: { warrior: Warrior; stable: RivalStableData }[] = [];
  for (const stable of state.rivals ?? []) {
    for (const warrior of stable.roster) {
      if (!isActive(warrior)) continue;
      if (!isTooInjuredToFight(warrior.injuries)) {
        rivals.push({ warrior, stable });
      }
    }
  }
  return rivals;
}

function getMatchupNotes(
  styleAdvantage: number,
  fameDiff: number,
  rankDiff?: number,
  headToHead?: HeadToHeadRecord,
  currentWeek?: number
): string[] {
  const notes: string[] = [];
  if (styleAdvantage >= 2) notes.push('Hard counter! Excellent style advantage.');
  else if (styleAdvantage === 1) notes.push('Favorable style matchup.');
  else if (styleAdvantage === -1) notes.push('Unfavorable style matchup.');
  else if (styleAdvantage <= -2) notes.push('Severe style disadvantage! Hard counter against you.');

  if (fameDiff > 15) notes.push('Safe fight, but low fame reward.');
  else if (fameDiff < -15) notes.push('Dangerous fight, but high fame reward!');

  if (rankDiff !== undefined) {
    const absRankDiff = Math.abs(rankDiff);
    if (absRankDiff <= 3) notes.push('Close rank matchup — competitive bout!');
    else if (absRankDiff > 10) notes.push('Rank mismatch — uneven competition.');
  }

  if (headToHead) {
    if (headToHead.total === 0) {
      notes.push('Fresh matchup — no prior encounters.');
    } else {
      if (headToHead.lastWinner === 'rival')
        notes.push('Revenge opportunity — they beat you last time!');
      if (headToHead.lastWinner === 'player')
        notes.push("Favorable history — you've beaten them before.");
      if (headToHead.wins >= 3)
        notes.push(`Dominant streak — you've beaten them ${headToHead.wins} times.`);
      if (headToHead.losses >= 3)
        notes.push(`Curb stomp risk — they've beaten you ${headToHead.losses} times.`);
      if (
        currentWeek !== undefined &&
        headToHead.lastFightWeek !== undefined &&
        currentWeek - headToHead.lastFightWeek >= 0 &&
        currentWeek - headToHead.lastFightWeek <= 2
      ) {
        notes.push('Recent rematch — fought within last 2 weeks.');
      }
    }
  }

  return notes;
}

/**
 * Build matchup score.
 */
export function buildMatchupScore(
  playerWarrior: Warrior,
  r: { warrior: Warrior; stable: RivalStableData },
  state: GameState
): MatchupScore {
  const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
  const fameDiff = playerWarrior.fame - r.warrior.fame;
  const playerRank = state.realmRankings?.[playerWarrior.id]?.overallRank;
  const rivalRank = state.realmRankings?.[r.warrior.id]?.overallRank;
  const rankDiff =
    playerRank !== undefined && rivalRank !== undefined ? playerRank - rivalRank : undefined;
  const hh = headToHeadFor(playerWarrior, r.warrior, state.arenaHistory);
  const headToHead: HeadToHeadRecord = {
    wins: hh.wins,
    losses: hh.losses,
    total: hh.total,
    lastWinner: hh.lastWinner === 'a' ? 'player' : hh.lastWinner === 'b' ? 'rival' : hh.lastWinner,
    lastFightWeek: hh.lastFightWeek,
  };
  return {
    playerWarriorId: playerWarrior.id,
    rivalWarrior: r.warrior,
    rivalStableName: r.stable.owner.stableName,
    score: scoreMatchup(playerWarrior, r.warrior, state),
    styleAdvantage,
    fameDiff,
    notes: getMatchupNotes(styleAdvantage, fameDiff, rankDiff, headToHead, state.week),
    rankDiff,
    headToHead,
  };
}
