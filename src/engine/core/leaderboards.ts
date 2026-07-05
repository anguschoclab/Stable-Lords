import type { Warrior } from '@/types/warrior.types';
import type { RivalStableData } from '@/types/state.types';
import { getAllArenas, getArenaById } from '@/data/arenas';
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

  const insert = (entry: ArenaLeaderboardEntry) => {
    const fame = entry.warrior.fame;
    const last = top[limit - 1];
    if (top.length === limit && last && fame <= last.warrior.fame) {
      return;
    }

    let i = top.length - 1;
    while (i >= 0) {
      const entry = top[i];
      if (!entry || entry.warrior.fame >= fame) break;
      i--;
    }

    top.splice(i + 1, 0, entry);
    if (top.length > limit) {
      top.pop();
    }
  };

  const allActive = collectActiveWarriorEntries(roster, playerStableName, rivals);

  for (const entry of allActive) {
    insert(entry);
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
    const entries: ArenaWarriorEntry[] = [];
    for (const { warrior, stableName, isPlayer } of allEntries) {
      const entry = buildEntry(warrior, stableName, isPlayer, arenaId);
      if (entry.wins + entry.losses > 0) entries.push(entry);
    }

    // Top warriors: by wins then win-rate then kills
    const topWarriors = [...entries]
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.kills - a.kills)
      .slice(0, limit);

    // Top killers: by kills then wins
    const topKillers = [...entries]
      .filter((e) => e.kills > 0)
      .sort((a, b) => b.kills - a.kills || b.wins - a.wins)
      .slice(0, limit);

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

  const entries: ArenaWarriorEntry[] = [];
  for (const { warrior, stableName, isPlayer } of allEntries) {
    const entry = buildEntry(warrior, stableName, isPlayer, arenaId);
    if (entry.wins + entry.losses > 0) entries.push(entry);
  }

  const topWarriors = [...entries]
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.kills - a.kills)
    .slice(0, limit);

  const topKillers = [...entries]
    .filter((e) => e.kills > 0)
    .sort((a, b) => b.kills - a.kills || b.wins - a.wins)
    .slice(0, limit);

  return {
    arenaId,
    arenaName: arena.name,
    topWarriors,
    topKillers,
  };
}
