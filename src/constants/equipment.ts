/**
 * Equipment Constants
 * Centralized constants for equipment weight thresholds, scoring, and encumbrance
 */

// ─── Weight Thresholds ──────────────────────────────────────────────────────

/**
 * Equipment weight classification thresholds
 */
export const WEIGHT_THRESHOLDS = {
  VERY_LIGHT: 1,
  LIGHT: 2,
  MEDIUM: 3,
  HEAVY: 4,
  VERY_HEAVY: 5,
} as const;

// ─── Equipment Scoring ───────────────────────────────────────────────────────

/**
 * Equipment optimization scoring values
 */
export const EQUIPMENT_SCORES = {
  BASE: 10,
  PREFERRED_WEAPON: 30,
  WEIGHT_MATCH: 15,
  SYNERGY_BASE: 40,
  SYNERGY_PREFERRED: 25,
  SYNERGY_CAPACITY: 20,
  SYNERGY_LIGHT: 15,
} as const;

// ─── Encumbrance ───────────────────────────────────────────────────────────

/**
 * Encumbrance mechanics constants
 */
export const ENCUMBRANCE_CONSTANTS = {
  LIGHT_THRESHOLD: 0.7,
  OVERWEIGHT_MULTIPLIER: 1.2,
} as const;
