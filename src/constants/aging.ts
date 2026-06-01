/**
 * Aging and Retirement Constants
 * Centralized constants for warrior and trainer aging, retirement, and lifecycle
 */

// ─── Warrior Aging ──────────────────────────────────────────────────────────

/**
 * Warrior aging parameters
 */
export const WARRIOR_AGING = {
  BASE_AGE: 18,
  PENALTY_START: 30,
  FORCED_RETIREMENT_MIN: 40,
  FORCED_RETIREMENT_MAX: 45,
} as const;

// ─── Trainer Aging ─────────────────────────────────────────────────────────

/**
 * Trainer aging parameters
 */
export const TRAINER_AGING = {
  BASE_AGE: 45,
  RETIREMENT_START: 65,
  DEATH_THRESHOLD: 80,
  WEEKS_PER_YEAR: 52,
} as const;

// ─── Retirement Chances ─────────────────────────────────────────────────────

/**
 * Retirement probability parameters
 */
export const RETIREMENT_CHANCES = {
  BASE: 0.05,
  AGE_INCREMENT: 0.02,
  FAME_DISCOUNT_MAX: 0.1,
  LEGACY_DISCOUNT: 0.05,
  MIN_CHANCE: 0.01,
  WARRIOR_AGE_INCREMENT: 0.05,
} as const;
