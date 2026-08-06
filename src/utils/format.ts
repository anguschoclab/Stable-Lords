/**
 * Shared formatting utilities for game time display.
 */

/**
 * Format a game week and season into a display string.
 * Usage: `formatWeek(3, 'Spring')` → `"Week 3, Spring"`
 */
export function formatWeek(week: number, season: string): string {
  return `Week ${week}, ${season}`;
}

/**
 * Format a game week and season into a death-record string.
 * Usage: `formatDateOfDeath(3, 'Spring')` → `"Week 3, Season Spring"`
 */
export function formatDateOfDeath(week: number, season: string): string {
  return `Week ${week}, Season ${season}`;
}
