import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/state.types';
import { getAllArenas, getArenaById } from '@/data/arenas';

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Inserts an item into a sorted array, keeping its size bounded by `limit`.
 * O(limit) per insertion, which is O(1) for small limits (e.g. 10).
 * Prevents O(N log N) sorting of the entire dataset.
 */
function insertBounded<T>(
  arr: T[],
  limit: number,
  item: T,
  cmp: (a: T, b: T) => number
) {
  if (arr.length === limit && cmp(item, arr[limit - 1] as T) >= 0) {
    return;
  }
  let i = arr.length - 1;
  while (i >= 0 && cmp(item, arr[i] as T) < 0) {
    i--;
  }
  arr.splice(i + 1, 0, item);
  if (arr.length > limit) {
    arr.pop();
  }
}

// ─── Global Fame Leaderboard ────────────────────────────────────────────────

/** A single ranked warrior row in the global arena leaderboard. */
export interface ArenaLeaderboardEntry {
  warrior: Warrior;
  stableName: string;
  isPlayer: boolean;
}

function collectActiveWarriorEntries(
  playerRoster: Warrior[],
  playerStableName: string,
  rivals: RivalStableData[] | undefined
): ArenaLeaderboardEntry[] {
  const entries: ArenaLeaderboardEntry[] = [];
  for (const w of playerRoster) {
    if (w.status === 'Active' && !w.isDead) {
      entries.push({ warrior: w, stableName: playerStableName, isPlayer: true });
    }
  }
  for (const r of rivals ?? []) {
    for (const w of r.roster) {
      if (w.status === 'Active' && !w.isDead) {
        entries.push({ warrior: w, stableName: r.owner.stableName, isPlayer: false });
      }
    }
  }
  return entries;
}

/**
 * Computes the top N active warriors by fame across the player roster and all
 * rival stables. Uses a bounded insertion sort (O(N·limit)) to avoid sorting
 * the full population.
 */
export function calculateGlobalFameLeaderboard(
  roster: Warrior[],
  rivals: RivalStableData[] | undefined,
  playerStableName: string,
  limit = 10
): ArenaLeaderboardEntry[] {
  if (limit <= 0) return [];

  const top: ArenaLeaderboardEntry[] = [];
  const allActive = collectActiveWarriorEntries(roster, playerStableName, rivals);

  for (const entry of allActive) {
    insertBounded(top, limit, entry, (a, b) => b.warrior.fame - a.warrior.fame);
  }

  return top;
}

// ─── Per-Arena Leaderboards ─────────────────────────────────────────────────

/** A warrior's performance record for a specific arena. */
export interface ArenaWarriorEntry {
  warriorId: string;
  name: string;
  stableName: string;
  isPlayer: boolean;
  wins: number;
  losses: number;
  kills: number;
  winRate: number;
}

/** Full leaderboard data for one arena. */
export interface ArenaLeaderboardData {
  arenaId: string;
  arenaName: string;
  topWarriors: ArenaWarriorEntry[];
  topKillers: ArenaWarriorEntry[];
}

const cmpWarriors = (a: ArenaWarriorEntry, b: ArenaWarriorEntry) =>
  b.wins - a.wins || b.winRate - a.winRate || b.kills - a.kills;

const cmpKillers = (a: ArenaWarriorEntry, b: ArenaWarriorEntry) =>
  b.kills - a.kills || b.wins - a.wins;

function buildEntry(
  warrior: Warrior,
  stableName: string,
  isPlayer: boolean,
  arenaId: string
): ArenaWarriorEntry {
  const rec = warrior.career.byArena?.[arenaId] ?? { wins: 0, losses: 0, kills: 0 };
  const total = rec.wins + rec.losses;
  return {
    warriorId: warrior.id,
    name: warrior.name,
    stableName,
    isPlayer,
    wins: rec.wins,
    losses: rec.losses,
    kills: rec.kills,
    winRate: total > 0 ? rec.wins / total : 0,
  };
}

/**
 * Builds per-arena top-warrior and top-killer leaderboards from cumulative
 * career.byArena counters (all-time accurate) across the full world roster.
 *
 * Also accepts the rolling arenaHistory for future enhancements (e.g. recent form)
 * but the ranking itself uses career.byArena which is not bounded by history truncation.
 *
 * @param playerRoster  - Player's active warriors
 * @param playerStableName - Display name of the player's stable
 * @param rivals - All rival stables (with their rosters)
 * @param limit - Number of entries per leaderboard (default 10)
 */
export function calculatePerArenaLeaderboards(
  playerRoster: Warrior[],
  playerStableName: string,
  rivals: RivalStableData[],
  limit = 10
): ArenaLeaderboardData[] {
  const arenas = getAllArenas();

  const allEntries = collectActiveWarriorEntries(playerRoster, playerStableName, rivals);

  return arenas.map((arena) => {
    const arenaId = arena.id;
    const topWarriors: ArenaWarriorEntry[] = [];
    const topKillers: ArenaWarriorEntry[] = [];

    for (const { warrior, stableName, isPlayer } of allEntries) {
      const entry = buildEntry(warrior, stableName, isPlayer, arenaId);
      if (entry.wins + entry.losses > 0) {
        insertBounded(topWarriors, limit, entry, cmpWarriors);
        if (entry.kills > 0) {
          insertBounded(topKillers, limit, entry, cmpKillers);
        }
      }
    }

    return { arenaId, arenaName: arena.name, topWarriors, topKillers };
  });
}

/**
 * Leaderboard for a single arena (cheaper than computing all).
 */
export function calculateArenaLeaderboard(
  arenaId: string,
  playerRoster: Warrior[],
  playerStableName: string,
  rivals: RivalStableData[],
  limit = 10
): ArenaLeaderboardData {
  const arena = getArenaById(arenaId);
  const allEntries = collectActiveWarriorEntries(playerRoster, playerStableName, rivals);

  const topWarriors: ArenaWarriorEntry[] = [];
  const topKillers: ArenaWarriorEntry[] = [];

  for (const { warrior, stableName, isPlayer } of allEntries) {
    const entry = buildEntry(warrior, stableName, isPlayer, arenaId);
    if (entry.wins + entry.losses > 0) {
      insertBounded(topWarriors, limit, entry, cmpWarriors);
      if (entry.kills > 0) {
        insertBounded(topKillers, limit, entry, cmpKillers);
      }
    }
  }

  return {
    arenaId,
    arenaName: arena.name,
    topWarriors,
    topKillers,
  };
}
