/**
 * Centralized Economy Constants for Stable Lords
 * Ensures parity between Player and AI economic calculations
 */

// ─── Base Economy ─────────────────────────────────────────────────────────
/**
 * Starting treasury for new stables
 */
export const STARTING_TREASURY = 500;

/**
 * Fight purse (base payment for a bout)
 */
export const FIGHT_PURSE = 90;

/**
 * Win bonus (additional payment for winning)
 */
export const WIN_BONUS = 35;

/**
 * Fame dividend (fame-to-gold conversion rate)
 */
export const FAME_DIVIDEND = 0.5;

/**
 * Warrior upkeep base cost
 */
export const WARRIOR_UPKEEP_BASE = 60;

/**
 * Training cost per session
 */
export const TRAINING_COST = 20;

/**
 * Scout cost per action
 */
export const SCOUT_COST = 25;

// ─── Bankruptcy ───────────────────────────────────────────────────────────
/**
 * Bankruptcy threshold (treasury below this triggers bankruptcy)
 */
export const BANKRUPTCY_THRESHOLD = -500;

// ─── AI Treasury Thresholds ───────────────────────────────────────────────
/**
 * AI economic behavior thresholds
 */
export const AI_TREASURY_THRESHOLDS = {
  POVERTY: 100,
  LOW: 200,
  MODERATE: 300,
  HEALTHY: 500,
  WEALTHY: 800,
  RICH: 1000,
  VERY_RICH: 1200,
  ELITE: 1500,
} as const;

// ─── Weather Economics ─────────────────────────────────────────────────────
/**
 * Weather-related economic modifiers
 */
export const WEATHER_ECONOMICS = {
  MANA_SURGE_GIFT: 250,
  PATRONAGE_THRESHOLD: 40,
  PATRONAGE_DIVISOR: 10,
  PATRONAGE_MULTIPLIER: 25,
  FAME_PREMIUM_DIVISOR: 10,
  FAME_PREMIUM_MULTIPLIER: 15,
  SWELTERING_PREMIUM: 5,
  BLIZZARD_PREMIUM: 10,
} as const;

// ─── Matchmaking Scores ───────────────────────────────────────────────────
/**
 * Matchmaking scoring constants
 */
export const MATCHMAKING_SCORE_CONSTANTS = {
  BASE_SCORE: 100,
  RIVALRY_HIGH_BONUS: 200,
  RIVALRY_LOW_BONUS: 50,
  VENDETTA_BONUS: 300,
  STYLE_MATCH_BONUS: 20,
  CHALLENGE_BONUS: 500,
  AVOID_PENALTY: -500,
  RECOVERY_PENALTY: -200,
} as const;

// ─── Promoter Capacity ─────────────────────────────────────────────────────
/**
 * Promoter booking capacity by tier
 */
export const PROMOTER_CAPACITY = {
  LEGENDARY: 2,
  NATIONAL: 4,
  REGIONAL: 6,
  LOCAL: 10,
} as const;

// ─── Capacity UI Thresholds ───────────────────────────────────────────────
/**
 * UI feedback thresholds for capacity
 */
export const CAPACITY_UI_THRESHOLDS = {
  CRITICAL: 80,
  WARNING: 50,
} as const;

// ─── Trainer Economics ───────────────────────────────────────────────────
/**
 * Trainer weekly salary by tier
 */
export const TRAINER_WEEKLY_SALARY: Record<string, number> = {
  Novice: 10,
  Seasoned: 25,
  Master: 75,
};
