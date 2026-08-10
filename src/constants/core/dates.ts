/**
 * Stable Lords — Date & Time Constants
 * Central source of truth for all temporal magic numbers used in timestamp generation.
 */
import { WEEKS_PER_YEAR } from './core';

/**
 * The real-world year that maps to game year 1 in the BoutSimulationPass.
 * Game year N starts at Date.UTC(GAME_EPOCH_YEAR + N - 1, 0, 1).
 */
export const GAME_EPOCH_YEAR = 2024;

/**
 * The real-world year that maps to absolute week 1 in the reporting/factory layer.
 * Used by reportingHandler, fightSummaryFactory, and worldMatchmaking.
 */
export const ERA_START_YEAR = 2026;

/** Days per game week */
export const DAYS_PER_WEEK = 7;

/** Hours per day */
export const HOURS_PER_DAY = 24;

/** Minutes per hour */
export const MINUTES_PER_HOUR = 60;

/** Seconds per minute */
export const SECONDS_PER_MINUTE = 60;

/** Milliseconds per second */
export const MS_PER_SECOND = 1000;

/** Milliseconds per day: 24 * 60 * 60 * 1000 */
export const MS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

/** Milliseconds per game week: 7 * MS_PER_DAY */
export const MS_PER_WEEK = DAYS_PER_WEEK * MS_PER_DAY;

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
