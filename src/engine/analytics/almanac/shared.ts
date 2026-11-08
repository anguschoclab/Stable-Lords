/**
 * The Almanac — all-time record boards computed from live state + archival
 * data (reign histories, grand champions, hall-of-fame entries, awards,
 * kill events, lifetime counters). Pure derivations: no RNG, no mutation.
 *
 * Row ordering contract: every board's comparator chain ends in a unique id
 * so results are a deterministic total order, never input-order dependent.
 *
 * This module holds the shared types and row/board helpers; each record
 * section lives in its own file under this directory.
 */
import type {
  AnnualAward,
  ArenaTitle,
  GrandChampionEntry,
  HallEntry,
  KillEvent,
  LifetimeStats,
  Rivalry,
  TournamentEntry,
} from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcomeBy, FightSummary } from '@/types/combat.types';

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
  fightBy?: FightOutcomeBy;
  fightWeek?: number;
  tags?: string[];
  /** True when a hall-of-fame entry's fight summary has truncated out. */
  archived?: boolean;
  /** Optional structured extras (medal counts, W/L/K, defenses…). */
  extra?: Record<string, number | string>;
}

/** Board rendering kind — drives row layout (warrior card, fight line, stable line, prose scroll). */
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

/* ── shared helpers ──────────────────────────────────────────────────── */

/** Comparator chaining — each returns 0/nonzero, first nonzero wins. */
type Cmp<T> = (a: T, b: T) => number;
/** Compose comparators into one total-order comparator. */
export const by = <T>(cmp: Cmp<T>, ...chain: Cmp<T>[]): Cmp<T> => {
  const all = [cmp, ...chain];
  return (a, b) => {
    for (const c of all) {
      const d = c(a, b);
      if (d !== 0) return d;
    }
    return 0;
  };
};
/** Numeric descending comparator from a projection. */
export const numDesc = <T>(f: (t: T) => number): Cmp<T> => (a, b) => f(b) - f(a);
/** Numeric ascending comparator from a projection. */
export const numAsc = <T>(f: (t: T) => number): Cmp<T> => (a, b) => f(a) - f(b);
/** String ascending comparator from a projection. */
export const strAsc = <T>(f: (t: T) => string): Cmp<T> => (a, b) =>
  f(a) < f(b) ? -1 : f(a) > f(b) ? 1 : 0;

/** Career record with a zeroed fallback for career-less warriors. */
export const career = (w: Warrior) => w.career ?? { wins: 0, losses: 0, kills: 0 };
/** Total recorded bouts. */
export const boutsOf = (w: Warrior) => career(w).wins + career(w).losses;
/** Medal cabinet with a zeroed fallback. */
export const medalsOf = (w: Warrior) => w.career?.medals ?? { gold: 0, silver: 0, bronze: 0 };

/** Display status — dead wins over stored status. */
export function warriorStatus(w: Warrior): string {
  if (w.isDead || w.status === 'Dead') return 'Dead';
  return w.status ?? 'Active';
}

/** Stable display name for a warrior — entity index first, live-stable list fallback. */
export function stableNameOf(w: Warrior, input: AlmanacInput): string | undefined {
  const sid = w.stableId as string | undefined;
  if (!sid) return undefined;
  return (
    input.stableNameById?.get(sid) ?? input.stables?.find((s) => s.id === sid)?.name ?? undefined
  );
}

/** Inputs for {@link warriorRow} — bundled to stay under the param budget. */
interface WarriorRowOpts {
  w: Warrior;
  input: AlmanacInput;
  value: number;
  valueLabel: string;
  detail?: string;
  extra?: AlmanacRow['extra'];
}

/** Build a warrior-flavored board row (name, stable sub, W·L·K detail). */
export function warriorRow(opts: WarriorRowOpts): AlmanacRow {
  const { w, input, value, valueLabel, detail, extra } = opts;
  return {
    key: w.id as string,
    name: w.name,
    warriorId: w.id as string,
    sub: stableNameOf(w, input),
    style: w.style,
    status: warriorStatus(w),
    isPlayer: w.stableId === input.playerStableId,
    value,
    valueLabel,
    detail: detail ?? `${career(w).wins}W · ${career(w).losses}L · ${career(w).kills}K`,
    extra,
  };
}

/** Assemble a board. */
export const mkBoard = (
  id: string,
  title: string,
  kind: AlmanacBoardKind,
  rows: AlmanacRow[],
  caveat?: string
): AlmanacBoard => ({ id, title, kind, caveat, rows });

/** Slice to board depth. */
export const cap = <T>(rows: T[], n: number): T[] => rows.slice(0, Math.max(0, n));

/** Award-type → display title for §2 scrolls. */
export const AWARD_TITLE: Record<string, string> = {
  WARRIOR_OF_YEAR: 'Warrior of the Year',
  KILLER_OF_YEAR: 'Killer of the Year',
  STABLE_OF_YEAR: 'Stable of the Year',
  CLASS_MVP: 'Class MVP',
  TOURNAMENT_RANK: 'Tournament Rank',
};

/** stableName → live-stable lookup for boards that key on names. */
export const stableByName = (input: AlmanacInput): Map<string, AlmanacStableInput> =>
  new Map((input.stables ?? []).map((s) => [s.name, s]));
