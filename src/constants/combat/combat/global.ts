// ─── Global Combat Modifiers ────────────────────────────────────────────────
/**
 * Global attack bonus
 */
export const GLOBAL_ATT_BONUS = 2.5;

/**
 * Global parry penalty
 */
export const GLOBAL_PAR_PENALTY = -2.5;

/**
 * Maximum exchanges per bout (10 minutes at 3 exchanges/minute)
 */
export const MAX_EXCHANGES = 30;

/**
 * Exchanges per minute
 */
export const EXCHANGES_PER_MINUTE = 3;

/**
 * Canonical bout duration in minutes, derived from MAX_EXCHANGES / EXCHANGES_PER_MINUTE.
 * Use this for UI horizons, stamina curves, and any minute-based projections.
 */
export const BOUT_DURATION_MINUTES = MAX_EXCHANGES / EXCHANGES_PER_MINUTE;

/**
 * Initiative press bonus
 */
export const INITIATIVE_PRESS_BONUS = 1;

/**
 * XP gained for winning
 */
export const WIN_XP = 2;

/**
 * XP gained for losing
 */
export const LOSS_XP = 1;

// ─── Effort Scaling ───────────────────────────────────────────────────────
/**
 * Offensive effort attack scaling
 */
export const OE_ATT_SCALING = 0.85;

/**
 * Offensive effort defense scaling
 */
export const OE_DEF_SCALING = 0.5;

/**
 * Alacrity initiative scaling
 */
export const AL_INI_SCALING = 0.7;

/**
 * Alacrity attribute scaling
 */
export const AL_ATTR_SCALING = 0.5;

/**
 * Defender endurance discount
 */
export const DEFENDER_ENDURANCE_DISCOUNT = 0.6;

/**
 * Exhaustion-stoppage HP gate: a fighter who hits 0 endurance is only stopped
 * when they can no longer defend themselves (hp below this ratio of maxHp).
 * A merely-winded fighter keeps fighting under heavy fatigue penalties instead
 * of auto-losing — prevents the attrition axis from deciding ~all low-pool
 * bouts regardless of damage taken.
 */
export const EXHAUSTION_STOP_HP_RATIO = 0.45;

/**
 * Kill window endurance threshold
 */
export const KILL_WINDOW_ENDURANCE = 0.4;

/**
 * Tactic overuse cap
 */
export const TACTIC_OVERUSE_CAP = 3;

// ─── AI Tactic Valuation ───────────────────────────────────────────────────
/**
 * Weight applied to parry-bypass in the offensive tactic tiebreaker
 * (offensiveTacticValue). Parry bypass is valuable but secondary to raw
 * attack/damage, so it is discounted relative to attBonus/dmgBonus.
 */
export const OFFENSIVE_PARRY_BYPASS_WEIGHT = 0.5;

/**
 * Weight applied to endurance cost in the offensive tactic tiebreaker
 * (offensiveTacticValue). Endurance cost is a real but secondary
 * disincentive, so it is discounted relative to the defPenalty
 * self-exposure term.
 */
export const OFFENSIVE_END_COST_WEIGHT = 0.5;

/**
 * Critical damage multiplier
 */
export const CRIT_DAMAGE_MULT = 1.7;

// ─── Decision Logic ───────────────────────────────────────────────────────
/**
 * Decision hit margin
 */
export const DECISION_HIT_MARGIN = 3;

/**
 * Decision scoring thresholds
 */
export const DECISION_THRESHOLDS = {
  DOMINATION_MARGIN: 5,
  CLOSE_MARGIN: 2,
  WIN_MARGIN: 0.5,
} as const;

// ─── Effort Thresholds ───────────────────────────────────────────────────
/**
 * Offensive/Alacrity effort thresholds
 */
export const EFFORT_THRESHOLDS = {
  HIGH: 7,
  MEDIUM: 4,
  LOW: 3,
} as const;

// ─── Attribute Thresholds ────────────────────────────────────────────────
/**
 * Attribute quality thresholds
 */
export const ATTRIBUTE_THRESHOLDS = {
  POOR: 10,
  GOOD: 15,
  EXCELLENT: 18,
} as const;

// ─── Total Effort Thresholds ───────────────────────────────────────────────
/**
 * Total effort (OE + AL) thresholds
 */
export const TOTAL_EFFORT_THRESHOLDS = {
  MAX_SAFE: 16,
  MIN_VIABLE: 6,
} as const;

// ─── Strategy Score Constants ─────────────────────────────────────────────
/**
 * Strategy scoring modifiers
 */
export const STRATEGY_SCORE_CONSTANTS = {
  BASE_SCORE: 60,
  SUITABILITY_WS: 15,
  SUITABILITY_S: 5,
  SUITABILITY_U: -25,
  SKILL_PENALTY: -30,
  ATTRIBUTE_BONUS: 10,
  ATTRIBUTE_PENALTY: -15,
  OVER_EXERTION_PENALTY: 8,
  UNDER_EXERTION_PENALTY: 5,
  TEMPO_BONUS: 10,
} as const;

/**
 * Strategy score UI thresholds
 */
export const STRATEGY_SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  ADEQUATE: 50,
} as const;

// ─── Default Max HP ───────────────────────────────────────────────────────

export const DEFAULT_MAX_HP = 50;
