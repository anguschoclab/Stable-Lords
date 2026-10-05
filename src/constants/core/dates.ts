/**
 * Stable Lords — Date & Time Constants
 * Central source of truth for all temporal magic numbers used in timestamp generation.
 */
import { WEEKS_PER_YEAR } from './core';

/**
 * The real-world year that maps to game year 1 in the BoutSimulationPass.
 * Game year N starts at Date.UTC(GAME_EPOCH_YEAR + N - 1, 0, 1).
 */
const GAME_EPOCH_YEAR = 2024;

/**
 * The real-world year that maps to absolute week 1 in the reporting/factory layer.
 * Used by reportingHandler, fightSummaryFactory, and worldMatchmaking.
 */
const ERA_START_YEAR = 2026;

/** Days per game week */
const DAYS_PER_WEEK = 7;

// ─── Tournament Calendar ──────────────────────────────────────────────────
//
// Seasonal tournaments run on these display weeks (of WEEKS_PER_YEAR).
// The champions-only Grand Championship closes the year on week 52 —
// the last tournament of the year.

/** Display weeks that host the four seasonal tournaments. */
export const SEASONAL_TOURNAMENT_WEEKS: readonly number[] = [10, 20, 30, 42] as const;

/** Display week hosting the champions-only Grand Championship (final event of the year). */
export const CHAMPIONS_TOURNAMENT_WEEK = 52;

/**
 * Display-week window (inclusive) before a seasonal tournament during which
 * warriors prep — drives intentEngine narrative hints.
 */
export const TOURNAMENT_PREP_WEEKS = 4;

/**
 * Compute a UTC timestamp (ISO string) for a given absolute week, anchored to ERA_START_YEAR.
 * Absolute week 1 → Jan 1 of ERA_START_YEAR. Week N → Jan 1 + (N-1)*7 days.
 * Values > WEEKS_PER_YEAR roll over into the next calendar year.
 */
export function weekToTimestamp(absoluteWeek: number): string {
  const aw = Math.max(1, absoluteWeek);
  const yearOffset = Math.floor((aw - 1) / WEEKS_PER_YEAR);
  const inYearWeek = ((aw - 1) % WEEKS_PER_YEAR) + 1;
  return new Date(
    Date.UTC(ERA_START_YEAR + yearOffset, 0, 1 + (inYearWeek - 1) * DAYS_PER_WEEK)
  ).toISOString();
}

/**
 * Compute a UTC timestamp (ISO string) for a given game year + week, anchored to GAME_EPOCH_YEAR.
 * Game year 1, week 1 → Jan 1 of GAME_EPOCH_YEAR.
 */
export function gameYearWeekToTimestamp(year: number, week: number): string {
  return new Date(
    Date.UTC(GAME_EPOCH_YEAR + year - 1, 0, 1 + (week - 1) * DAYS_PER_WEEK)
  ).toISOString();
}
