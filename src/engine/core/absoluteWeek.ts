import { WEEKS_PER_YEAR } from '@/constants/core/core';
import {
  SEASONAL_TOURNAMENT_WEEKS,
  CHAMPIONS_TOURNAMENT_WEEK,
  TOURNAMENT_PREP_WEEKS,
} from '@/constants/core/dates';
import type { BoutOffer } from '@/types/state.types';

/**
 * The monotonic week counter. `state.week` resets 52→1 every year, which breaks
 * any cross-week arithmetic at the boundary (offers booked in week 52 for "week
 * 53" never match week 1 of the next year). All scheduling math must use
 * absoluteWeek; `week`/`year` remain for display and season logic.
 */
export function deriveAbsoluteWeek(year?: number, week?: number): number {
  const y = Math.max(1, year ?? 1);
  const w = Math.max(1, week ?? 1);
  return (y - 1) * WEEKS_PER_YEAR + w;
}

/** Convert an absolute week back to the in-year display week (1–52). */
export function displayWeek(absoluteWeek: number): number {
  return ((Math.max(1, absoluteWeek) - 1) % WEEKS_PER_YEAR) + 1;
}

/** Resolve a display week to absolute, given the absolute week it was created in. */
export function resolveAbsoluteWeek(displayWk: number, createdAbsWeek: number): number {
  const createdDisplay = displayWeek(createdAbsWeek);
  if (displayWk >= createdDisplay) {
    return createdAbsWeek - createdDisplay + displayWk;
  }
  return createdAbsWeek - createdDisplay + WEEKS_PER_YEAR + displayWk;
}

/** Resolve offer.boutWeek to absolute. Legacy offers (no createdAbsoluteWeek) return boutWeek as-is. */
export function boutOfferAbsoluteWeek(offer: BoutOffer): number {
  return offer.createdAbsoluteWeek != null
    ? resolveAbsoluteWeek(offer.boutWeek, offer.createdAbsoluteWeek)
    : offer.boutWeek;
}

/** Resolve offer.expirationWeek to absolute. Legacy offers return expirationWeek as-is. */
export function boutOfferExpirationAbsoluteWeek(offer: BoutOffer): number {
  return offer.createdAbsoluteWeek != null
    ? resolveAbsoluteWeek(offer.expirationWeek, offer.createdAbsoluteWeek)
    : offer.expirationWeek;
}

// ─── Tournament Calendar ──────────────────────────────────────────────────
// All helpers take a display week (1–WEEKS_PER_YEAR). Absolute-week callers
// must convert with displayWeek() first — "is this a tournament week" is an
// in-year question, not a monotonic one.

/** True if this display week hosts one of the four seasonal tournaments. */
export function isSeasonalTournamentWeek(week: number): boolean {
  return SEASONAL_TOURNAMENT_WEEKS.includes(displayWeek(week));
}

/** True if this display week hosts the champions-only Grand Championship. */
export function isChampionsTournamentWeek(week: number): boolean {
  return displayWeek(week) === CHAMPIONS_TOURNAMENT_WEEK;
}

/** True if this display week hosts any tournament (seasonal or champions). */
export function isTournamentWeekOfYear(week: number): boolean {
  return isSeasonalTournamentWeek(week) || isChampionsTournamentWeek(week);
}

/**
 * Display weeks until the next seasonal tournament (1-based count: returns 0
 * when the current week IS a seasonal week). Wraps the year boundary. Excludes
 * the Grand Championship — most warriors can't enter week 52.
 */
export function weeksUntilNextSeasonalTournament(week: number): number {
  const dw = displayWeek(week);
  for (let ahead = 0; ahead < WEEKS_PER_YEAR; ahead++) {
    if (SEASONAL_TOURNAMENT_WEEKS.includes(displayWeek(dw + ahead))) return ahead;
  }
  return WEEKS_PER_YEAR;
}

/**
 * True during the run-up window before the next seasonal tournament —
 * the window is relative to the next seasonal week, not a fixed range.
 * Returns false on a seasonal week itself and inside week-52's season.
 */
export function isSeasonalTournamentPrepWeek(week: number): boolean {
  const until = weeksUntilNextSeasonalTournament(week);
  return until > 0 && until <= TOURNAMENT_PREP_WEEKS;
}
