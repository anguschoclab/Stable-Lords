/**
 * Stable Lords — Global Engine Constants
 * Central source of truth for mechanical tuning and temporal standards.
 */

// ─── Temporal ───────────────────────────────────────────────────────────
export const ERA_START_YEAR = 2026;

/**
 * Save state version — used as a tripwire in isPlausibleGameState and stamped into meta.version.
 */
export const SAVE_STATE_VERSION = '2.1.0-hardened';

/**
 * Weeks per season
 */
export const WEEKS_PER_SEASON = 13;

/**
 * Weeks per year
 */
export const WEEKS_PER_YEAR = 52;

// ─── Economic ────────────────────────────────────────────────────────────
/**
 * Default treasury
 */
export const DEFAULT_TREASURY = 2000;

/**
 * Weekly maintenance base
 */
export const WEEKLY_MAINTENANCE_BASE = 100;

// ─── Social & Fame ───────────────────────────────────────────────────────
/**
 * Fame decay rate (~52 week half-life)
 */
export const FAME_DECAY_RATE = 0.0133;

/**
 * Popularity decay rate (~52 week half-life)
 */
export const POPULARITY_DECAY_RATE = 0.0133;

/**
 * Fame tier elite threshold
 */
export const FAME_TIER_ELITE = 2000;

// ─── World Simulation ────────────────────────────────────────────────────
/**
 * World bout minimum fame gap
 */
export const WORLD_BOUT_MIN_FAME_GAP = 50;

/**
 * Vendetta fame threshold
 */
export const VENDETTA_FAME_THRESHOLD = 200;

// ─── Philosophy Evolution ────────────────────────────────────────────────
/**
 * Owner philosophy evolution thresholds
 */
export const PHILOSOPHY_EVOLUTION = {
  WIN_THRESHOLD: 0.7,
  LOSS_THRESHOLD: 0.3,
} as const;

// ─── Reputation Multipliers ─────────────────────────────────────────────
/**
 * Stable reputation calculation multipliers
 */
export const REPUTATION_MULTIPLIERS = {
  FAME_WEIGHT: 2.0,
  GAZETTE_WEIGHT: 1.0,
  STATE_FAME_WEIGHT: 0.85,
  CLEAN_BOUT_WEIGHT: 0.5,
  KILL_PENALTY: 5,
  BASE_HONOR: 50,
} as const;

// ─── Backstory Economy Impacts ───────────────────────────────────────────
/**
 * Backstory economic impact constants
 */
export const BACKSTORY_ECONOMY = {
  TREASURY_DELTAS: {
    MINOR_LOSS: -100,
    MODERATE_GAIN: 200,
    MAJOR_GAIN: 500,
    SMALL_GAIN: 100,
    MODERATE_LOSS: -50,
    LARGE_GAIN: 300,
    MEDIUM_GAIN: 250,
  },
  FAME_DELTAS: {
    SMALL: 3,
    MODERATE: 10,
    LOSS: -3,
  },
  RENOWN_DELTAS: {
    SMALL: 2,
    MODERATE: 3,
    LOSS: -2,
    LARGE: 4,
    VERY_LARGE: 5,
  },
  ROSTER_BONUS: 0.5,
} as const;

// ─── Backstory Personality Weights ───────────────────────────────────────
/**
 * Backstory personality bias weights
 */
export const BACKSTORY_PERSONALITY_WEIGHTS = {
  HIGH: 60,
  MODERATE: 50,
  STANDARD: 40,
  LOW: 30,
  MINIMAL: 20,
  VERY_MINIMAL: 10,
} as const;
