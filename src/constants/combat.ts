/**
 * Stable Lords — Combat Engine Constants & Tuning
 * Centralized combat mechanics, style matchups, and thresholds
 */

import { FightingStyle } from '@/types/shared.types';

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
 * Kill window endurance threshold
 */
export const KILL_WINDOW_ENDURANCE = 0.4;

/**
 * Tactic overuse cap
 */
export const TACTIC_OVERUSE_CAP = 3;

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

// ─── Fatigue System ───────────────────────────────────────────────────────
/**
 * Fatigue mechanics constants
 */
export const FATIGUE_CONSTANTS = {
  CEILING: 50,
  BOUT_GAIN: 25,
  WEEKLY_DECAY: 25,
  MAX: 100,
} as const;

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
 * Trait synergy multipliers
 */
export const TRAIT_SYNERGY_MULTIPLIERS = {
  SYNERGY: 2.0,
  ANTI_SYNERGY: 0.3,
} as const;

/**
 * Trait selection roll thresholds
 */
export const TRAIT_SELECTION_THRESHOLDS = {
  MIN_ROLL: 0.25,
  MAX_ROLL: 0.8,
} as const;

// ─── Style Matchup Matrix ──────────────────────────────────────────────────

/**
 * Style order for matrix indexing
 */
export const STYLE_ORDER = [
  FightingStyle.AimedBlow,
  FightingStyle.BashingAttack,
  FightingStyle.LungingAttack,
  FightingStyle.ParryLunge,
  FightingStyle.ParryRiposte,
  FightingStyle.ParryStrike,
  FightingStyle.SlashingAttack,
  FightingStyle.StrikingAttack,
  FightingStyle.TotalParry,
  FightingStyle.WallOfSteel,
];

/**
 * Canonical Style Advantage Matrix.
 * Values are flat skill bonuses (positive = advantage).
 *
 * Tuned 2026-04 across two passes:
 *
 * Pass 1 (style W%): nerfed WS (+5→+1), buffed AB (+2→+4), softened PR (-4→-1).
 * Pass 2 (per-matchup W%, 4400-bout sample): BA emerged as new outlier at
 * 70.3%, AB still bottom at 26.5%. Per-matchup data showed:
 *  - BA dominated nearly all matchups (79-80% vs ST/TP/PS/PR)
 *  - AB lost 75-85% of fights vs BA/PS/PR despite matrix advantages, implying
 *    style-passive headwind (matrix can't fully compensate)
 *  - Symmetric mirror diagonal stays balanced; major asymmetry concentrated
 *    in BA's aggressive defaults
 *
 * Pass 2 changes:
 *  - BA: row sum +4 → +1 (dropped +1 vs PR/SL/ST). Matches the broad
 *    overperformance pattern across BA's most-played matchups.
 *  - AB: added +1 vs BA, +1 vs PR, +1 vs PS to counter the passive headwind.
 *    Row sum +4 → +7 (most aggressive in the matrix; accepted because passives
 *    drag AB down ~20pp from its raw matrix expectation).
 *  - PS: added +1 vs AB tempered to 0 (was already 0); kept other entries.
 *  - ST: added +1 vs WS to address ST's persistent low W% from passives.
 *  - TP: removed -1 vs AB to dampen the AB-eats-TP swing without flipping.
 *  - PL/PR/PS: minor symmetric softening to lift the bottom of the spread.
 *
 * Target: aggregate W% spread ≤ 20pp; per-matchup spread ≤ 30pp on samples ≥50.
 */
export const MATCHUP_MATRIX: number[][] = [
  //AB  BA  LU  PL  PR  PS  SL  ST  TP  WS
  [0, +1, +2, +1, +1, +1, +2, +2, +1, +2], // AB
  [-1, 0, 0, -1, -1, 0, -1, -1, 0, -1], // BA (Nerfed vs PR)
  [-2, 0, 0, 0, 0, -1, -1, -1, 0, -1], // LU
  [-1, +1, 0, 0, +1, +1, 0, 0, +1, 0], // PL
  [-1, +1, 0, 0, 0, 0, 0, +1, +1, 0], // PR (Buffed vs BA and ST)
  [-1, 0, +1, -1, 0, 0, 0, +2, 0, 0], // PS (Buffed vs ST)
  [-2, +1, +1, 0, 0, 0, 0, -1, +1, 0], // SL
  [-2, +1, +1, 0, -1, -2, +1, 0, +1, +1], // ST (Nerfed vs PR and PS)
  [-1, 0, 0, -1, 0, 0, +1, -1, 0, -1], // TP
  [-4, 0, -1, -2, -1, -3, -2, -2, 0, 0], // WS (Nerfed matrix entries globally)
];

/**
 * Get matchup bonus from the matrix
 * @param attStyle - Attacker style
 * @param defStyle - Defender style
 * @returns The matchup bonus value
 */
export function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai]?.[di] ?? 0;
}
