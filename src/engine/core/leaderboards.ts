import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';
import type { RivalStableData } from '@/types/state.types';
import { getAllArenas, getArenaById } from '@/data/arenas';
import { getFightsForArena } from '@/engine/core/historyUtils';
import { filterActive } from '@/utils/roster';

// ─── Global Fame Leaderboard ────────────────────────────────────────────────

/** A single ranked warrior row in the global arena leaderboard. */
export interface ArenaLeaderboardEntry {
  warrior: Warrior;
  stableName: string;
  isPlayer: boolean;
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

  const allActive: ArenaLeaderboardEntry[] = [
    ...filterActive(roster).map((w) => ({
      warrior: w,
      stableName: playerStableName,
      isPlayer: true as const,
    })),
    ...(rivals ?? []).flatMap((r) =>
      filterActive(r.roster).map((w) => ({
        warrior: w,
        stableName: r.owner.stableName,
        isPlayer: false as const,
      }))
    ),
  ];

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
 * @param arenaHistory - Recent fight history (used only by sub-utilities)
 * @param limit - Number of entries per leaderboard (default 10)
 */
export function calculatePerArenaLeaderboards(
  playerRoster: Warrior[],
  playerStableName: string,
  rivals: RivalStableData[],
  _arenaHistory: FightSummary[],
  limit = 10
): ArenaLeaderboardData[] {
  const arenas = getAllArenas();

  // Collect all warriors with their stable context once
  const allEntries: { warrior: Warrior; stableName: string; isPlayer: boolean }[] = [
    ...filterActive(playerRoster)
      .filter((w) => !w.isDead)
      .map((w) => ({ warrior: w, stableName: playerStableName, isPlayer: true })),
    ...rivals.flatMap((rival) =>
      filterActive(rival.roster)
        .filter((w) => !w.isDead)
        .map((w) => ({ warrior: w, stableName: rival.owner.name, isPlayer: false }))
    ),
  ];

  return arenas.map((arena) => {
    const arenaId = arena.id;
    const entries = allEntries
      .map(({ warrior, stableName, isPlayer }) =>
        buildEntry(warrior, stableName, isPlayer, arenaId)
      )
      .filter((e) => e.wins + e.losses > 0); // Only warriors who have fought here

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
  arenaHistory: FightSummary[],
  limit = 10
): ArenaLeaderboardData {
  const arena = getArenaById(arenaId);
  const allEntries: { warrior: Warrior; stableName: string; isPlayer: boolean }[] = [
    ...filterActive(playerRoster)
      .filter((w) => !w.isDead)
      .map((w) => ({ warrior: w, stableName: playerStableName, isPlayer: true })),
    ...rivals.flatMap((rival) =>
      filterActive(rival.roster)
        .filter((w) => !w.isDead)
        .map((w) => ({ warrior: w, stableName: rival.owner.name, isPlayer: false }))
    ),
  ];

  const entries = allEntries
    .map(({ warrior, stableName, isPlayer }) => buildEntry(warrior, stableName, isPlayer, arenaId))
    .filter((e) => e.wins + e.losses > 0);

  const topWarriors = [...entries]
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.kills - a.kills)
    .slice(0, limit);

  const topKillers = [...entries]
    .filter((e) => e.kills > 0)
    .sort((a, b) => b.kills - a.kills || b.wins - a.wins)
    .slice(0, limit);

  // Recent kills from arenaHistory (rolling window detail)
  const recentFights = getFightsForArena(arenaHistory, arenaId);
  const recentKillers = new Map<string, number>();
  for (const f of recentFights) {
    if (f.by === 'Kill') {
      const killerId = f.winner === 'A' ? f.warriorIdA : f.winner === 'D' ? f.warriorIdD : null;
      if (killerId) recentKillers.set(killerId, (recentKillers.get(killerId) ?? 0) + 1);
    }
  }

  return {
    arenaId,
    arenaName: arena.name,
    topWarriors,
    topKillers,
  };
}
