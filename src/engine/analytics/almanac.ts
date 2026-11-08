/**
 * The Almanac — all-time record boards computed from live state + archival
 * data (reign histories, grand champions, hall-of-fame entries, awards,
 * kill events, lifetime counters). Pure derivations: no RNG, no mutation.
 *
 * Row ordering contract: every board's comparator chain ends in a unique id
 * so results are a deterministic total order, never input-order dependent.
 */
import type {
  AnnualAward,
  ArenaTitle,
  GrandChampionEntry,
  KillEvent,
  LifetimeStats,
  Rivalry,
  TournamentEntry,
} from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';
import type { HallEntry, RivalStableData } from '@/types/state/game';

/** One ranked (or scrolled) row inside an Almanac board. */
export interface AlmanacRow {
  key: string;
  name: string;
  /** Secondary label — stable name, style name, "Year N", etc. */
  sub?: string;
  /** Free-form secondary line, e.g. "82W · 34L · 7K" or "12 defenses". */
  detail?: string;
  /** Primary ranked value — what the board is sorted by. */
  value: number;
  /** Unit label for the value, e.g. "wins", "weeks", "G/S/B". */
  valueLabel?: string;
  warriorId?: string;
  style?: string;
  /** Warrior status for row dimming, e.g. 'Active' | 'Dead' | 'Retired'. */
  status?: string;
  isPlayer?: boolean;
  /** Fight-board fields. */
  fightId?: string;
  fightTitle?: string;
  fightBy?: string;
  fightWeek?: number;
  tags?: string[];
  /** True when a hall-of-fame entry's fight summary has truncated out. */
  archived?: boolean;
  /** Optional structured extras (medal counts, W/L/K, defenses…). */
  extra?: Record<string, number | string>;
}

export type AlmanacBoardKind = 'warrior' | 'fight' | 'stable' | 'scroll';

/** A titled record board — a metric, an ordered row set, and an optional honesty caveat. */
export interface AlmanacBoard {
  id: string;
  title: string;
  kind: AlmanacBoardKind;
  /** Scope honesty label, e.g. "recorded window", "current season". */
  caveat?: string;
  rows: AlmanacRow[];
}

/** One world-stat strip entry (§8 — counters, not a board). */
export interface AlmanacStat {
  label: string;
  value: number | string;
}

/** A live stable for the stable-board aggregates. */
export interface AlmanacStableInput {
  id: string;
  name: string;
  fame: number;
  isPlayer: boolean;
}

/** Everything the almanac needs — a read-only slice of GameState. */
export interface AlmanacInput {
  /** All known warriors — collectAllKnownWarriors output. */
  warriors: Warrior[];
  /** Player stable id — powers isPlayer flagging + stable attribution. */
  playerStableId?: string;
  /** stableId → stableName for live stables (entity index). */
  stableNameById?: Map<string, string>;
  /** Live stables (player + rivals) for §7 aggregates. */
  stables?: AlmanacStableInput[];
  /** Rival stables — rosters counted in world-stat counters. */
  rivals?: RivalStableData[];
  arenaHistory?: FightSummary[];
  hallOfFame?: HallEntry[];
  awards?: AnnualAward[];
  arenaChampions?: Record<string, ArenaTitle>;
  grandChampions?: GrandChampionEntry[];
  tournaments?: TournamentEntry[];
  lifetimeStats?: LifetimeStats;
  deadWarriorIds?: string[];
  killEvents?: KillEvent[];
  rivalries?: Rivalry[];
  absoluteWeek?: number;
  year?: number;
  week?: number;
  /** §1 career-board depth (default 100). */
  topN?: number;
  /** Other boards' depth (default 25). */
  boardN?: number;
}

/** Sectioned almanac output for the UI. */
export interface AlmanacData {
  career: AlmanacBoard[];
  accolades: AlmanacBoard[];
  championships: AlmanacBoard[];
  streaks: AlmanacBoard[];
  styleArena: AlmanacBoard[];
  fights: AlmanacBoard[];
  stables: AlmanacBoard[];
  world: AlmanacStat[];
}

/** §1 — career record boards (top-100 by default). */
export function computeCareerBoards(_input: AlmanacInput): AlmanacBoard[] {
  return [];
}

/** §2 — annual award rolls, one board per award type present. */
export function computeAccoladeBoards(_input: AlmanacInput): AlmanacBoard[] {
  return [];
}

/** §3 — championship lineage boards (reigns, defenses, crowns, tournament victors). */
export function computeChampionshipBoards(_input: AlmanacInput): AlmanacBoard[] {
  return [];
}

/** §4 — streak boards over the retained fight window. */
export function computeStreakBoards(_input: AlmanacInput): AlmanacBoard[] {
  return [];
}

/** §5 — per-style and per-arena boards. */
export function computeStyleArenaBoards(_input: AlmanacInput): AlmanacBoard[] {
  return [];
}

/** §6 — fight records + hall-of-fame archive boards. */
export function computeFightBoards(_input: AlmanacInput): AlmanacBoard[] {
  return [];
}

/** §7 — stable record boards. */
export function computeStableBoards(_input: AlmanacInput): AlmanacBoard[] {
  return [];
}

/** §8 — world aggregate counters (stat strip, not a board). */
export function computeWorldStats(_input: AlmanacInput): AlmanacStat[] {
  return [];
}

/** Full almanac — every section computed in one pass-friendly call. */
export function computeAlmanac(input: AlmanacInput): AlmanacData {
  return {
    career: computeCareerBoards(input),
    accolades: computeAccoladeBoards(input),
    championships: computeChampionshipBoards(input),
    streaks: computeStreakBoards(input),
    styleArena: computeStyleArenaBoards(input),
    fights: computeFightBoards(input),
    stables: computeStableBoards(input),
    world: computeWorldStats(input),
  };
}
