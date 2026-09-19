import type { GameState, RivalStableData } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';
import { isTooInjuredToFight } from './injuries';
import { getMatchupBonus } from '@/constants/combat';
import { getStablePairKey } from '@/utils/keyUtils';
import { MATCHMAKING_SCORE_CONSTANTS } from '@/constants/economy';

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
 * Player-agnostic context for pairwise matchup scoring (G18).
 * Everything `scoreMatchup` reads except the player-specific
 * challenge/avoid marks — those stay in the `scoreMatchup` wrapper so
 * AI-vs-AI scoring can never see player intent.
 */
export interface PairwiseMatchupContext {
  rankings?: GameState['realmRankings'];
  arenaHistory?: GameState['arenaHistory'];
  rivalries?: GameState['rivalries'];
  rivalryMap?: GameState['rivalryMap'];
  /** Stable id for side A (defaults to a.stableId). */
  aStableId?: string;
  /** Stable id for side B (defaults to b.stableId). */
  bStableId?: string;
  week?: number;
}

/**
 * Symmetric matchup scorer — identical math to `scoreMatchup` minus the
 * player challenge/avoid modifiers. Used for AI-vs-AI scoring.
 */
export function scorePairwiseMatchup(
  a: Warrior,
  b: Warrior,
  ctx: PairwiseMatchupContext
): number {
  const styleAdvantage = getMatchupBonus(a.style, b.style);
  const fameDiff = a.fame - b.fame;

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

  const aWinRate =
    (a.career?.wins ?? 0) /
    Math.max(1, (a.career?.wins ?? 0) + (a.career?.losses ?? 0));
  const bWinRate =
    (b.career?.wins ?? 0) /
    Math.max(1, (b.career?.wins ?? 0) + (b.career?.losses ?? 0));
  score += (aWinRate - bWinRate) * 20;

  // Rivalry multiplier for grudge matches
  const aStableId = ctx.aStableId ?? a.stableId;
  const bStableId = ctx.bStableId ?? b.stableId;

  if (aStableId && bStableId) {
    const rivalry =
      ctx.rivalryMap?.get(getStablePairKey(aStableId, bStableId)) ??
      (ctx.rivalries || []).find(
        (r) =>
          (r.stableIdA === aStableId && r.stableIdB === bStableId) ||
          (r.stableIdB === aStableId && r.stableIdA === bStableId)
      );
    if (rivalry) {
      score += rivalry.intensity * 50; // Grudge match!
    }
  }

  // Rank modifier
  const aRank = ctx.rankings?.[a.id]?.overallRank;
  const bRank = ctx.rankings?.[b.id]?.overallRank;
  if (aRank !== undefined && bRank !== undefined) {
    const rankDiff = Math.abs(aRank - bRank);
    if (rankDiff <= 3) {
      score += 15;
    } else if (rankDiff <= 10) {
      score += 5;
    } else {
      score -= 10;
    }
  }

  // Head-to-head history modifier
  if (ctx.arenaHistory && ctx.arenaHistory.length > 0) {
    const hh = getHeadToHeadRecord(a, b, ctx.arenaHistory);
    if (hh.total === 0) {
      score += 3; // Novelty bonus
    } else {
      if (hh.lastWinner === 'a') score += 5;
      if (hh.lastWinner === 'b') score += 10;
      if (hh.total >= 3 && hh.wins === hh.total) score -= 5; // Repetitive farm
      if (hh.total >= 3 && hh.losses === hh.total) score -= 15; // Curb stomp
    }
    // Recency penalty — rematches within last 2 weeks
    if (
      hh.lastFightWeek !== undefined &&
      ctx.week !== undefined &&
      ctx.week - hh.lastFightWeek >= 0 &&
      ctx.week - hh.lastFightWeek <= 2
    ) {
      score -= 15;
    }
  }

  return score;
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

function getEligibleRivals(state: GameState): { warrior: Warrior; stable: RivalStableData }[] {
  const rivals: { warrior: Warrior; stable: RivalStableData }[] = [];
  for (const stable of state.rivals ?? []) {
    for (const warrior of stable.roster) {
      if (warrior.status !== 'Active') continue;
      if (!isTooInjuredToFight(warrior.injuries)) {
        rivals.push({ warrior, stable });
      }
    }
  }
  return rivals;
}

interface PairwiseHeadToHead {
  /** Wins from side A's perspective. */
  wins: number;
  /** Losses from side A's perspective. */
  losses: number;
  total: number;
  lastWinner: 'a' | 'b' | 'draw' | null;
  lastFightWeek?: number;
}

function getHeadToHeadRecord(
  a: Warrior,
  b: Warrior,
  arenaHistory: FightSummary[] | undefined
): PairwiseHeadToHead {
  let wins = 0;
  let losses = 0;
  let total = 0;
  let lastWinner: 'a' | 'b' | 'draw' | null = null;
  let lastFightWeek: number | undefined;

  if (!arenaHistory) {
    return { wins: 0, losses: 0, total: 0, lastWinner: null };
  }

  for (let i = 0; i < arenaHistory.length; i++) {
    const fight = arenaHistory[i];
    if (!fight) continue;
    const aIsA = fight.warriorIdA === a.id;
    const aIsD = fight.warriorIdD === a.id;
    const bIsA = fight.warriorIdA === b.id;
    const bIsD = fight.warriorIdD === b.id;

    if ((aIsA && bIsD) || (aIsD && bIsA)) {
      total++;
      lastFightWeek = fight.week;
      if (fight.winner === null) {
        lastWinner = 'draw';
      } else if ((aIsA && fight.winner === 'A') || (aIsD && fight.winner === 'D')) {
        wins++;
        lastWinner = 'a';
      } else {
        losses++;
        lastWinner = 'b';
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

function buildMatchupScore(
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
  const hh = getHeadToHeadRecord(playerWarrior, r.warrior, state.arenaHistory);
  const headToHead: HeadToHeadRecord = {
    wins: hh.wins,
    losses: hh.losses,
    total: hh.total,
    lastWinner:
      hh.lastWinner === 'a' ? 'player' : hh.lastWinner === 'b' ? 'rival' : hh.lastWinner,
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
