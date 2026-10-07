import type { FightSummary } from '@/types/combat.types';
import { getPairKey } from '@/utils/keyUtils';

/**
 * Extracts fights from a specific week using an optimized backward loop.
 * Assumes arenaHistory is chronologically sorted by week.
 * O(K) time complexity where K is number of fights in that week, compared to O(N) for .filter()
 */
export function getFightsForWeek(arenaHistory: FightSummary[], week: number): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (!f) continue;
    const fWeek = f.absoluteWeek ?? f.week;
    if (fWeek === week) {
      result.push(f);
    } else if (fWeek < week) {
      break; // History is chronological, no earlier items will match
    }
  }
  return result.reverse();
}

/**
 * Extracts fights since a minimum week using an optimized backward loop.
 * Assumes arenaHistory is chronologically sorted by week.
 * O(K) time complexity where K is number of recent fights, compared to O(N) for .filter()
 */
export function getRecentFights(arenaHistory: FightSummary[], minWeek: number): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (!f) continue;
    const fWeek = f.absoluteWeek ?? f.week;
    if (fWeek >= minWeek) {
      result.push(f);
    } else {
      break; // History is chronological, no earlier items will match
    }
  }
  return result.reverse();
}

// arenaHistory is append-only-by-replacement (impact merges concat,
// truncateState slices — every writer produces a new array), so keying a
// per-warrior index on the array's identity is safe; a new history starts
// a fresh index. Same invariant as matchmaking/schedulingAssistant/headToHead.
const fightsByWarrior = new WeakMap<FightSummary[], Map<string, FightSummary[]>>();

function warriorFightIndex(arenaHistory: FightSummary[]): Map<string, FightSummary[]> {
  const cached = fightsByWarrior.get(arenaHistory);
  if (cached) return cached;
  const index = new Map<string, FightSummary[]>();
  for (const f of arenaHistory) {
    if (!f) continue;
    // Degenerate self-fight (warriorIdA === warriorIdD): the old scan counted
    // it once for that warrior — the `!==` guard preserves that.
    if (f.warriorIdA) {
      const list = index.get(f.warriorIdA);
      if (list) list.push(f);
      else index.set(f.warriorIdA, [f]);
    }
    if (f.warriorIdD && f.warriorIdD !== f.warriorIdA) {
      const list = index.get(f.warriorIdD);
      if (list) list.push(f);
      else index.set(f.warriorIdD, [f]);
    }
  }
  fightsByWarrior.set(arenaHistory, index);
  return index;
}

/**
 * Extracts the most recent fights for a specific warrior.
 * Indexed by the warriorFightIndex WeakMap — one O(N) build per unique
 * history array, then O(1) per lookup. (The old per-call backward scan
 * only early-exited for warriors WITH enough recent fights; inactive
 * warriors paid a full-tail scan every call — ~107ms/week self-time.)
 */
export function getRecentFightsForWarrior(
  arenaHistory: FightSummary[],
  warriorId: string,
  limit: number = 10
): FightSummary[] {
  const fights = warriorFightIndex(arenaHistory).get(warriorId);
  if (!fights) return [];
  // slice(-n) yields the last n fights in chronological order — identical to
  // the old backward-scan + reverse. Math.max mirrors the old limit<=0 edge
  // (it pushed one match before checking, so 0 behaved as 1).
  return fights.slice(-Math.max(limit, 1));
}

/**
 * Extracts all fights for a specific warrior.
 * Useful when the full timeline or head-to-head records are needed,
 * but extracts via standard for-loop to avoid O(N) functional allocation overhead.
 */
export function getAllFightsForWarrior(
  arenaHistory: FightSummary[],
  warriorId: string
): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = 0; i < arenaHistory.length; i++) {
    const f = arenaHistory[i];
    if (!f) continue;
    if (f.warriorIdA === warriorId || f.warriorIdD === warriorId) {
      result.push(f);
    }
  }
  return result;
}

/**
 * Extracts all fights that took place in a specific arena.
 * Full scan — arenaHistory is not sorted by arenaId.
 */
export function getFightsForArena(arenaHistory: FightSummary[], arenaId: string): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = 0; i < arenaHistory.length; i++) {
    const f = arenaHistory[i];
    if (!f) continue;
    if (f.arenaId === arenaId) result.push(f);
  }
  return result;
}

/**
 * Extracts all fights that took place in a specific arena.
 * Uses a backward loop because tournaments typically happen in the recent past,
 * stopping if we reach a point where no tournament fights could exist (e.g. before the tournament week, if known).
 * To be safe without knowing the exact tournament week, we just do a standard backward scan.
 */
export function getFightsForTournament(
  arenaHistory: FightSummary[],
  tournamentId: string
): FightSummary[] {
  const result: FightSummary[] = [];
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (!f) continue;
    if (f.tournamentId === tournamentId) {
      result.push(f);
    }
  }
  return result.reverse(); // Reverse to maintain chronological order
}

/**
 *
 */
export function buildRecentFightPairs(
  arenaHistory: FightSummary[],
  currentWeek: number,
  windowWeeks: number
): Set<string> {
  const pairs = new Set<string>();
  const minWeek = currentWeek - windowWeeks;
  for (let i = arenaHistory.length - 1; i >= 0; i--) {
    const f = arenaHistory[i];
    if (!f) continue;
    const fWeek = f.absoluteWeek ?? f.week;
    if (fWeek < minWeek) break;
    if (f.warriorIdA && f.warriorIdD) {
      pairs.add(getPairKey(f.warriorIdA, f.warriorIdD));
    }
  }
  return pairs;
}
