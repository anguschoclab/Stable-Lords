/**
 * Training Constants
 * Centralized constants for training progression, seasonal gains, and attribute limits
 */

// ─── Seasonal Gains ─────────────────────────────────────────────────────────

/**
 * Seasonal training limits
 */
export const SEASONAL_GAINS = {
  CAP: 3,
} as const;

// ─── Attribute Training ─────────────────────────────────────────────────────

/**
 * Attribute training progression parameters
 */
export const ATTRIBUTE_TRAINING = {
  MAX_VALUE: 25,
  HIGH_THRESHOLD: 16,
  MEDIUM_THRESHOLD: 12,
  AGE_PENALTY_START: 30,
  LOW_CHANCE_THRESHOLD: 0.2,
  RECOMMENDED_CHANCE: 0.4,
  UI_HIGH_PERCENT: 50,
  UI_MEDIUM_PERCENT: 30,
} as const;

// ─── Attribute UI Quality Thresholds ──────────────────────────────────────

export const ATTRIBUTE_UI_THRESHOLDS = {
  EXCELLENT: 20,
  GOOD: 15,
} as const;

// ─── Attribute Total Cap ──────────────────────────────────────────────────

export const ATTRIBUTE_TOTAL_CAP = 80;

// ─── Near-Ceiling Buffer ──────────────────────────────────────────────────

export const ATTRIBUTE_NEAR_CEILING_BUFFER = 1;

// ─── Skill Maximum Default ──────────────────────────────────────────────────

export const SKILL_MAX_DEFAULT = 20;

// ─── Fame Star Threshold ────────────────────────────────────────────────────

export const FAME_STAR_THRESHOLD = 1000;
