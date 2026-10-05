import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { getMatchupBonus } from '@/constants/combat';
import { getPairKey } from '@/utils/keyUtils';
import { headToHeadFor, type PairwiseHeadToHead } from './headToHead';

/**
 * Player-agnostic context for pairwise matchup scoring (G18).
 * Everything `scoreMatchup` reads except the player-specific
 * challenge/avoid marks — those stay in the `scoreMatchup` wrapper so
 * AI-vs-AI scoring can never see player intent.
 */
interface PairwiseMatchupContext {
  rankings?: GameState['realmRankings'];
  arenaHistory?: GameState['arenaHistory'];
  rivalries?: GameState['rivalries'];
  rivalryMap?: GameState['rivalryMap'];
  /** Stable id for side A (defaults to a.stableId). */
  aStableId?: string;
  /** Stable id for side B (defaults to b.stableId). */
  bStableId?: string;
  week?: number;
  /**
   * Optional per-call head-to-head memo (keyed directionally `aId|bId`).
   * When omitted, lookups fall back to a WeakMap keyed on the arenaHistory
   * array — safe because arenaHistory is always replaced, never mutated.
   */
  h2hCache?: Map<string, PairwiseHeadToHead>;
}

/** Head-to-head history modifier: novelty, streak, and recency terms. */
function headToHeadDelta(a: Warrior, b: Warrior, ctx: PairwiseMatchupContext): number {
  if (!ctx.arenaHistory || ctx.arenaHistory.length === 0) return 0;
  const hh = headToHeadFor(a, b, ctx.arenaHistory, ctx.h2hCache);
  let delta = 0;
  if (hh.total === 0) {
    delta += 3; // Novelty bonus
  } else {
    if (hh.lastWinner === 'a') delta += 5;
    if (hh.lastWinner === 'b') delta += 10;
    if (hh.total >= 3 && hh.wins === hh.total) delta -= 5; // Repetitive farm
    if (hh.total >= 3 && hh.losses === hh.total) delta -= 15; // Curb stomp
  }
  // Recency penalty — rematches within last 2 weeks
  if (
    hh.lastFightWeek !== undefined &&
    ctx.week !== undefined &&
    ctx.week - hh.lastFightWeek >= 0 &&
    ctx.week - hh.lastFightWeek <= 2
  ) {
    delta -= 15;
  }
  return delta;
}

/**
 * Symmetric matchup scorer — identical math to `scoreMatchup` minus the
 * player challenge/avoid modifiers. Used for AI-vs-AI scoring.
 */
export function scorePairwiseMatchup(a: Warrior, b: Warrior, ctx: PairwiseMatchupContext): number {
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
    (a.career?.wins ?? 0) / Math.max(1, (a.career?.wins ?? 0) + (a.career?.losses ?? 0));
  const bWinRate =
    (b.career?.wins ?? 0) / Math.max(1, (b.career?.wins ?? 0) + (b.career?.losses ?? 0));
  score += (aWinRate - bWinRate) * 20;

  // Rivalry multiplier for grudge matches
  const aStableId = ctx.aStableId ?? a.stableId;
  const bStableId = ctx.bStableId ?? b.stableId;

  if (aStableId && bStableId) {
    const rivalry =
      ctx.rivalryMap?.get(getPairKey(aStableId, bStableId)) ??
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

  score += headToHeadDelta(a, b, ctx);

  return score;
}
