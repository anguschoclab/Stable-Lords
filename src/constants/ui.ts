/**
 * UI Threshold Constants
 * Centralized breakpoints for color coding, truncation, and visual feedback.
 */

// ─── Generic Battery Breakpoints ──────────────────────────────────────────

export const BATTERY_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 30,
} as const;

// ─── Odds / Win-Rate Color Thresholds ──────────────────────────────────────

export const ODDS_THRESHOLDS = {
  FAVORITE: 60,
  UNDERDOG: 40,
} as const;

export const WIN_RATE_THRESHOLDS = {
  HIGH: 60,
  MID: 45,
} as const;

// ─── Combat Log Truncation ────────────────────────────────────────────────

export const COMBAT_LOG_TRUNCATION = 60;
