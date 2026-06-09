import type { GameState, RivalStableData } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import { isTooInjuredToFight } from './injuries';
import { getMatchupBonus } from '@/constants/combat';

/**
 * Defines the shape of head-to-head record.
 */
interface HeadToHeadRecord {
  wins: number;
  losses: number;
  total: number;
  lastWinner: 'player' | 'rival' | 'draw' | null;
  lastFightWeek?: number;
}

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

  // Rank modifier
  const playerRank = state.realmRankings?.[playerWarrior.id]?.overallRank;
  const rivalRank = state.realmRankings?.[rivalWarrior.id]?.overallRank;
  if (playerRank !== undefined && rivalRank !== undefined) {
    const rankDiff = Math.abs(playerRank - rivalRank);
    if (rankDiff <= 3) {
      score += 15;
    } else if (rankDiff <= 10) {
      score += 5;
    } else {
      score -= 10;
    }
  }

  // Head-to-head history modifier
  if (state.arenaHistory && state.arenaHistory.length > 0) {
    const hh = getHeadToHeadRecord(playerWarrior, rivalWarrior, state.arenaHistory);
    if (hh.total === 0) {
      score += 3; // Novelty bonus
    } else {
      if (hh.lastWinner === 'player') score += 5;
      if (hh.lastWinner === 'rival') score += 10;
      if (hh.total >= 3 && hh.wins === hh.total) score -= 5; // Repetitive farm
      if (hh.total >= 3 && hh.losses === hh.total) score -= 15; // Curb stomp
    }
    // Recency penalty — rematches within last 2 weeks
    if (
      hh.lastFightWeek !== undefined &&
      state.week - hh.lastFightWeek >= 0 &&
      state.week - hh.lastFightWeek <= 2
    ) {
      score -= 15;
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

function getHeadToHeadRecord(
  playerWarrior: Warrior,
  rivalWarrior: Warrior,
  arenaHistory: FightSummary[] | undefined
): HeadToHeadRecord {
  let wins = 0;
  let losses = 0;
  let total = 0;
  let lastWinner: 'player' | 'rival' | 'draw' | null = null;
  let lastFightWeek: number | undefined;

  if (!arenaHistory) {
    return { wins: 0, losses: 0, total: 0, lastWinner: null };
  }

  for (let i = 0; i < arenaHistory.length; i++) {
    const fight = arenaHistory[i];
    if (!fight) continue;
    const playerIsA = fight.warriorIdA === playerWarrior.id;
    const playerIsD = fight.warriorIdD === playerWarrior.id;
    const rivalIsA = fight.warriorIdA === rivalWarrior.id;
    const rivalIsD = fight.warriorIdD === rivalWarrior.id;

    if ((playerIsA && rivalIsD) || (playerIsD && rivalIsA)) {
      total++;
      lastFightWeek = fight.week;
      if (fight.winner === null) {
        lastWinner = 'draw';
      } else if ((playerIsA && fight.winner === 'A') || (playerIsD && fight.winner === 'D')) {
        wins++;
        lastWinner = 'player';
      } else {
        losses++;
        lastWinner = 'rival';
      }
    }
  }

  return { wins, losses, total, lastWinner, lastFightWeek };
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
  for (const r of eligibleRivals) {
    const score = scoreMatchup(playerWarrior, r.warrior, state);

    if (topScores.length < limit) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      const playerRank = state.realmRankings?.[playerWarrior.id]?.overallRank;
      const rivalRank = state.realmRankings?.[r.warrior.id]?.overallRank;
      const rankDiff =
        playerRank !== undefined && rivalRank !== undefined ? playerRank - rivalRank : undefined;
      const headToHead = getHeadToHeadRecord(playerWarrior, r.warrior, state.arenaHistory);
      topScores.push({
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(styleAdvantage, fameDiff, rankDiff, headToHead, state.week),
        rankDiff,
        headToHead,
      });
      topScores.sort((a, b) => b.score - a.score);
    } else if (score > (topScores[limit - 1]?.score ?? -Infinity)) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      const playerRank = state.realmRankings?.[playerWarrior.id]?.overallRank;
      const rivalRank = state.realmRankings?.[r.warrior.id]?.overallRank;
      const rankDiff =
        playerRank !== undefined && rivalRank !== undefined ? playerRank - rivalRank : undefined;
      const headToHead = getHeadToHeadRecord(playerWarrior, r.warrior, state.arenaHistory);
      topScores[limit - 1] = {
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(styleAdvantage, fameDiff, rankDiff, headToHead, state.week),
        rankDiff,
        headToHead,
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
  for (const r of eligibleRivals) {
    const score = scoreMatchup(playerWarrior, r.warrior, state);

    if (bottomScores.length < limit) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      const playerRank = state.realmRankings?.[playerWarrior.id]?.overallRank;
      const rivalRank = state.realmRankings?.[r.warrior.id]?.overallRank;
      const rankDiff =
        playerRank !== undefined && rivalRank !== undefined ? playerRank - rivalRank : undefined;
      const headToHead = getHeadToHeadRecord(playerWarrior, r.warrior, state.arenaHistory);
      bottomScores.push({
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(styleAdvantage, fameDiff, rankDiff, headToHead, state.week),
        rankDiff,
        headToHead,
      });
      bottomScores.sort((a, b) => a.score - b.score);
    } else if (score < (bottomScores[limit - 1]?.score ?? Infinity)) {
      const styleAdvantage = getMatchupBonus(playerWarrior.style, r.warrior.style);
      const fameDiff = playerWarrior.fame - r.warrior.fame;
      const playerRank = state.realmRankings?.[playerWarrior.id]?.overallRank;
      const rivalRank = state.realmRankings?.[r.warrior.id]?.overallRank;
      const rankDiff =
        playerRank !== undefined && rivalRank !== undefined ? playerRank - rivalRank : undefined;
      const headToHead = getHeadToHeadRecord(playerWarrior, r.warrior, state.arenaHistory);
      bottomScores[limit - 1] = {
        playerWarriorId: playerWarrior.id,
        rivalWarrior: r.warrior,
        rivalStableName: r.stable.owner.stableName,
        score,
        styleAdvantage,
        fameDiff,
        notes: getMatchupNotes(styleAdvantage, fameDiff, rankDiff, headToHead, state.week),
        rankDiff,
        headToHead,
      };
      bottomScores.sort((a, b) => a.score - b.score);
    }
  }

  return bottomScores;
}
