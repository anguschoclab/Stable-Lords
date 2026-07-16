import { WEEKS_PER_YEAR } from '@/constants/core/core';

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
