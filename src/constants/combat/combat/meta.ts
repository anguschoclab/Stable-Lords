import { WARRIOR_AGING } from '@/constants/aging';
// ─── Meta Drift ───────────────────────────────────────────────────────────
/**
 * Meta drift calculation parameters
 */
export const META_DRIFT_CONSTANTS = {
  DEFAULT_WINDOW: 20,
  NORMALIZATION_MULTIPLIER: 20,
  MIN_DRIFT: -10,
  MAX_DRIFT: 10,
} as const;

// ─── Tournament Awards ────────────────────────────────────────────────────
/**
 * Tournament fame prizes
 */
export const TOURNAMENT_FAME_PRIZES = {
  FIRST: 100,
  SECOND: 50,
  THIRD: 25,
} as const;

// ─── Trainer Specialty Thresholds ───────────────────────────────────────

export const TRAINER_IRONGUARD_ENDURANCE = 0.6;
export const TRAINER_ROPEADOPE_CAP = 0.5;
export const DAMAGE_RECEIVED_MULT_FLOOR = 0.5;

// ─── Trait Constants ─────────────────────────────────────────────────────
/**
 * Trait HP ratio thresholds
 */
export const TRAIT_HP_THRESHOLDS = {
  LOW: 0.5,
  HIGH: 0.75,
  FRESH: 0.7,
} as const;

/**
 * Trait selection weights
 */
export const TRAIT_WEIGHTS = {
  DEFAULT: 1.0,
  SLIGHT_BONUS: 0.8,
  MODERATE_BONUS: 0.7,
  SLIGHT_PENALTY: 0.6,
  MODERATE_PENALTY: 0.5,
  SEVERE_PENALTY: 0.4,
  HIGH_BONUS: 0.9,
} as const;

/**
 * Trait selection roll thresholds
 */
export const TRAIT_SELECTION_THRESHOLDS = {
  MIN_ROLL: 0.25,
  MAX_ROLL: 0.8,
} as const;

// ─── Aging & Veteran Compensation ─────────────────────────────────────────────
/**
 * Age at which aging penalties begin (SP/DF loss)
 * Sourced from WARRIOR_AGING.PENALTY_START to ensure a single source of truth.
 */
export const AGING_PENALTY_START = WARRIOR_AGING.PENALTY_START;

/**
 * DEF gained per attribute-point-lost × WL/15 for veteran compensation
 * Tune via balance harness to keep aged INI styles viable without over-buffing
 */
export const VETERAN_WISDOM_FACTOR = 0.25;
