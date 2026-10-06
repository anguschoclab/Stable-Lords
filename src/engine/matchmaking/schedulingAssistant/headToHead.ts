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

/** Shared empty record — callers treat the returned record as read-only. */
const EMPTY_H2H: PairwiseHeadToHead = { wins: 0, losses: 0, total: 0, lastWinner: null };

// arenaHistory is append-only-by-replacement (every writer produces a new
// array), so keying the index on the array's identity is safe — a new
// history automatically starts a fresh index.
const h2hByHistory = new WeakMap<FightSummary[], Map<string, PairwiseHeadToHead>>();

/**
 * Builds every directional pair record in ONE O(F) pass over the history.
 *
 * Key `x|y` accumulates x's record vs y across ALL of their fights,
 * regardless of which side (A or D) each occupied per fight — matching the
 * original per-pair scan semantics exactly. Repeated cold-pair O(F) scans
 * made head-to-head lookup the dominant rival-strategy cost.
 */
function headToHeadIndex(arenaHistory: FightSummary[]): Map<string, PairwiseHeadToHead> {
  const cached = h2hByHistory.get(arenaHistory);
  if (cached) return cached;
  const index = new Map<string, PairwiseHeadToHead>();
  const touch = (xId: string, yId: string): PairwiseHeadToHead => {
    const key = `${xId}|${yId}`;
    let rec = index.get(key);
    if (!rec) {
      rec = { wins: 0, losses: 0, total: 0, lastWinner: null };
      index.set(key, rec);
    }
    return rec;
  };
  for (const fight of arenaHistory) {
    if (!fight) continue;
    const aId = fight.warriorIdA;
    const dId = fight.warriorIdD;
    if (!aId || !dId) continue;
    // recA: the fight's A-side warrior's record vs the D-side warrior.
    const recA = touch(aId, dId);
    recA.total++;
    recA.lastFightWeek = fight.week;
    if (fight.winner === null) {
      recA.lastWinner = 'draw';
    } else if (fight.winner === 'A') {
      recA.wins++;
      recA.lastWinner = 'a';
    } else {
      recA.losses++;
      recA.lastWinner = 'b';
    }
    // Degenerate self-fight: the old scan counted it once — do the same.
    if (dId === aId) continue;
    // recD: the same fight from the D-side warrior's perspective.
    const recD = touch(dId, aId);
    recD.total++;
    recD.lastFightWeek = fight.week;
    if (fight.winner === null) {
      recD.lastWinner = 'draw';
    } else if (fight.winner === 'D') {
      recD.wins++;
      recD.lastWinner = 'a';
    } else {
      recD.losses++;
      recD.lastWinner = 'b';
    }
  }
  h2hByHistory.set(arenaHistory, index);
  return index;
}

/**
 * Indexed head-to-head lookup: O(1) per ordered warrior pair after one
 * O(F) index build per arenaHistory identity.
 */
export function headToHeadFor(
  a: Warrior,
  b: Warrior,
  arenaHistory: FightSummary[] | undefined,
  explicit?: Map<string, PairwiseHeadToHead>
): PairwiseHeadToHead {
  if (!arenaHistory || arenaHistory.length === 0) return EMPTY_H2H;
  // Directional key — wins/losses are recorded from side A's perspective, so
  // `${a}|${b}` must stay distinct from `${b}|${a}` (do not use getPairKey).
  const key = `${a.id}|${b.id}`;
  if (explicit) {
    const hit = explicit.get(key);
    if (hit) return hit;
  }
  const hh = headToHeadIndex(arenaHistory).get(key) ?? EMPTY_H2H;
  explicit?.set(key, hh);
  return hh;
}
