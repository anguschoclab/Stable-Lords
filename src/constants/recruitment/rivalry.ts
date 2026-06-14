/**
 * Rivalry and Grudge Constants
 * Centralized constants for rivalry intensity, grudge decay, and alert thresholds
 */

// ─── Rivalry Intensity ─────────────────────────────────────────────────────

/**
 * Rivalry intensity scale (1-5)
 */
export const RIVALRY_INTENSITY = {
  MIN: 1,
  MEDIUM: 3,
  HIGH: 4,
  MAX: 5,
} as const;

// ─── Grudge Decay ─────────────────────────────────────────────────────────

/**
 * Grudge cooling mechanics
 */
export const GRUDGE_DECAY = {
  WEEKS_BEFORE_DECAY: 4,
  INTENSITY_DECREMENT: 1,
} as const;

// ─── Rivalry Alert Thresholds ───────────────────────────────────────────────

/**
 * UI alert thresholds for rivalry
 */
export const RIVALRY_ALERT_THRESHOLDS = {
  CRITICAL: 5,
  HIGH: 4,
} as const;
