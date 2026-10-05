import type { FightSummary } from '@/types/combat.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * Directional head-to-head record between two warriors, with wins and
 * losses counted from side A's perspective (G18).
 */
export interface PairwiseHeadToHead {
  /** Wins from side A's perspective. */
  wins: number;
  /** Losses from side A's perspective. */
  losses: number;
  total: number;
  lastWinner: 'a' | 'b' | 'draw' | null;
  lastFightWeek?: number;
}

/**
 * Defines the shape of head-to-head record.
 */
export interface HeadToHeadRecord {
  wins: number;
  losses: number;
  total: number;
  lastWinner: 'player' | 'rival' | 'draw' | null;
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

// arenaHistory is append-only-by-replacement (every writer produces a new
// array), so keying the memo on the array's identity is safe — a new history
// automatically starts a fresh cache.
const h2hByHistory = new WeakMap<FightSummary[], Map<string, PairwiseHeadToHead>>();

/**
 * Memoized head-to-head lookup: O(F) history scan at most once per ordered
 * warrior pair per arenaHistory identity.
 */
export function headToHeadFor(
  a: Warrior,
  b: Warrior,
  arenaHistory: FightSummary[] | undefined,
  explicit?: Map<string, PairwiseHeadToHead>
): PairwiseHeadToHead {
  if (!arenaHistory || arenaHistory.length === 0) {
    return getHeadToHeadRecord(a, b, arenaHistory);
  }
  // Directional key — wins/losses are recorded from side A's perspective, so
  // `${a}|${b}` must stay distinct from `${b}|${a}` (do not use getPairKey).
  const key = `${a.id}|${b.id}`;
  let map = explicit ?? h2hByHistory.get(arenaHistory);
  if (!map) {
    map = new Map();
    h2hByHistory.set(arenaHistory, map);
  }
  let hh = map.get(key);
  if (!hh) {
    hh = getHeadToHeadRecord(a, b, arenaHistory);
    map.set(key, hh);
  }
  return hh;
}
