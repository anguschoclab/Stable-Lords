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
 * Kill-window threshold model (per qualifying hit, see calculateKillWindow).
 *
 *   threshold = (BASE + hp add + endurance add) × location multiplier
 *             + plan / skill / phase / momentum adds
 *             + specialty + crowd, clamped to [0, CAP]
 *
 * Every magnitude lives here so the kill rate is tuned in one place. The
 * world-facing dial is SCALE: the kill roll multiplies the finished threshold
 * by it (alongside the player's deathRateMult house rule), so it moves the
 * kill rate without reshaping which conditions produce kills.
 *
 * 2026-09 pass: CAP 0.04 → 0.12. At 0.04 every head/chest/abdomen hit was
 * already pinned to the cap (head alone is BASE × 6 = 0.072), so exhaustion,
 * critical HP and kill desire could not register. The cap now sits above a
 * clean head shot, the exhaustion and critical-HP adds are doubled so
 * late-bout fatigue carries the most fatality pressure, and SCALE lands the
 * weekly world rate at the ~8% floor of the design band (measured 1000-week,
 * 3-seed world runs; the all-15s balance fixture reads ~14%).
 */
export const KILL_WINDOW = {
  BASE: 0.012,
  CAP: 0.12,
  SCALE: 1.1,
  HP_CRITICAL_RATIO: 0.3,
  HP_CRITICAL_ADD: 0.008,
  HP_HURT_RATIO: 0.5,
  HP_HURT_ADD: 0.001,
  END_SPENT_RATIO: 0.2,
  END_SPENT_ADD: 0.012,
  END_TIRED_ADD: 0.006,
  END_WINDED_RATIO: 0.6,
  END_WINDED_ADD: 0.001,
  EFFORT_COEFF: 0.00025,
  MATCHUP_COEFF: 0.001,
  KILL_DESIRE_COEFF: 0.003,
  DEC_COEFF: 0.0003,
  PHASE_COEFF: 0.0015,
  MOMENTUM_FULL_ADD: 0.0075,
  MOMENTUM_HIGH_ADD: 0.004,
};

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


// ─── Default Max HP ───────────────────────────────────────────────────────

export const DEFAULT_MAX_HP = 50;
