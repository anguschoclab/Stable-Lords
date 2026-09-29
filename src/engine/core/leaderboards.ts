import type { Warrior } from '@/types/warrior.types';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { FightingStyle } from '@/types/shared.types';
import { getAllArenas, getArenaById } from '@/data/arenas';
import { isActive } from '@/engine/warrior/warriorStatus';
import { championsHeldByStable } from '@/engine/championship/arenaChampionship';

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Inserts an item into a sorted array, keeping its size bounded by `limit`.
 * O(limit) per insertion, which is O(1) for small limits (e.g. 10).
 * Prevents O(N log N) sorting of the entire dataset.
 */
function insertBounded<T>(arr: T[], limit: number, item: T, cmp: (a: T, b: T) => number) {
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
    if (isActive(w) && !w.isDead) {
      entries.push({ warrior: w, stableName: playerStableName, isPlayer: true });
    }
  }
  for (const r of rivals ?? []) {
    for (const w of r.roster) {
      if (isActive(w) && !w.isDead) {
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
  epithet?: string;
  stableName: string;
  isPlayer: boolean;
  style: FightingStyle;
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
    epithet: warrior.epithet,
    stableName,
    isPlayer,
    style: warrior.style,
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

  return arenas.map((arena) =>
    buildArenaLeaderboard(arena.id, arena.name, allEntries, limit)
  );
}

function buildArenaLeaderboard(
  arenaId: string,
  arenaName: string,
  allEntries: ReturnType<typeof collectActiveWarriorEntries>,
  limit: number
): ArenaLeaderboardData {
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

  return { arenaId, arenaName, topWarriors, topKillers };
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
  return buildArenaLeaderboard(arenaId, arena.name, allEntries, limit);
}

// ─── Arena "Best in Class" (per-style leaders) ──────────────────────────────

/**
 * The leading warrior of each fighting style at one arena — the venue's
 * "best in class" board. Requires at least one bout at the venue.
 */
export function calculateArenaStyleLeaders(
  arenaId: string,
  playerRoster: Warrior[],
  playerStableName: string,
  rivals: RivalStableData[]
): Partial<Record<FightingStyle, ArenaWarriorEntry>> {
  const allEntries = collectActiveWarriorEntries(playerRoster, playerStableName, rivals);
  const leaders: Partial<Record<FightingStyle, ArenaWarriorEntry>> = {};

  for (const { warrior, stableName, isPlayer } of allEntries) {
    const entry = buildEntry(warrior, stableName, isPlayer, arenaId);
    if (entry.wins + entry.losses === 0) continue;
    const current = leaders[entry.style];
    if (!current || cmpWarriors(entry, current) < 0) {
      leaders[entry.style] = entry;
    }
  }
  return leaders;
}

// ─── Arena Stable Standings ─────────────────────────────────────────────────

/** A stable's aggregate record and crown count at one arena. */
export interface ArenaStableEntry {
  stableId: string;
  stableName: string;
  isPlayer: boolean;
  wins: number;
  losses: number;
  kills: number;
  /** Live crowns held by this stable at the arena (0 or 1 — one crown per arena). */
  champions: number;
}

/**
 * Ranks stables by their warriors' combined wins at a venue, tie-broken by
 * kills then stable id for determinism. Crowns are reported alongside.
 */
export function calculateArenaStableStandings(
  state: GameState,
  arenaId: string,
  limit = 10
): ArenaStableEntry[] {
  const rows: ArenaStableEntry[] = [];
  const addStable = (
    stableId: string,
    stableName: string,
    isPlayer: boolean,
    roster: Warrior[]
  ) => {
    let wins = 0;
    let losses = 0;
    let kills = 0;
    for (const w of roster) {
      const rec = w.career?.byArena?.[arenaId];
      if (!rec) continue;
      wins += rec.wins;
      losses += rec.losses;
      kills += rec.kills;
    }
    const champions = championsHeldByStable(state, stableId).includes(arenaId) ? 1 : 0;
    if (wins + losses === 0 && champions === 0) return;
    rows.push({ stableId, stableName, isPlayer, wins, losses, kills, champions });
  };

  addStable(state.player.id, state.player.stableName, true, state.roster ?? []);
  for (const r of state.rivals ?? []) {
    addStable(r.id, r.owner.stableName, false, r.roster ?? []);
  }

  rows.sort((a, b) => b.wins - a.wins || b.kills - a.kills || a.stableId.localeCompare(b.stableId));
  return rows.slice(0, limit);
}
