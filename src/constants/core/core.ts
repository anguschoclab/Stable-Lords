/**
 * Stable Lords — Global Engine Constants
 * Central source of truth for mechanical tuning and temporal standards.
 */

// ─── Temporal ───────────────────────────────────────────────────────────
// Date/time constants moved to ./dates.ts

/**
 * Save state version — used as a tripwire in isPlausibleGameState and stamped into meta.version.
 */
export const SAVE_STATE_VERSION = '3.0.0';

/**
 * Weeks per season
 */
export const WEEKS_PER_SEASON = 13;

/**
 * Weeks per year
 */
export const WEEKS_PER_YEAR = 52;

// ─── Social & Fame ───────────────────────────────────────────────────────
/**
 * Season points awarded per bout outcome. Accumulates on the warrior
 * throughout the season, resets at season change, and feeds the
 * seasonal points race surfaced in season summaries.
 */
export const SEASON_POINTS = {
  WIN: 2,
  KILL_BONUS: 3,
} as const;
