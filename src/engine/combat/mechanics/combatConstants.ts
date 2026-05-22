import { FightingStyle } from '@/types/shared.types';

/**
 * Stable Lords — Combat Engine Constants & Tuning
 */

export const GLOBAL_ATT_BONUS = 2.5;/**
 * Global_par_penalty.
 */

/**
 * Global_par_penalty.
 */
export const GLOBAL_PAR_PENALTY = -2.5;/**
 * Max_exchanges.
 */

/**
 * Max_exchanges.
 */
export const MAX_EXCHANGES = 30;/**
 * Exchanges_per_minute.
 */
 // 10 minutes (Death Rattle calibration)
/**
 * Exchanges_per_minute.
 */
export const EXCHANGES_PER_MINUTE = 3;/**
 * Initiative_press_bonus.
 */

/**
 * Initiative_press_bonus.
 */
export const INITIATIVE_PRESS_BONUS = 1;/**
 * Win_xp.
 */

/**
 * Win_xp.
 */
export const WIN_XP = 2;/**
 * Loss_xp.
 */

/**
 * Loss_xp.
 */
export const LOSS_XP = 1;/**
 * Oe_att_scaling.
 */


/**
 * Oe_att_scaling.
 */
export const OE_ATT_SCALING = 0.85;/**
 * Oe_def_scaling.
 */

/**
 * Oe_def_scaling.
 */
export const OE_DEF_SCALING = 0.5;/**
 * Al_ini_scaling.
 */

/**
 * Al_ini_scaling.
 */
export const AL_INI_SCALING = 0.7;/**
 * Al_attr_scaling.
 */

/**
 * Al_attr_scaling.
 */
export const AL_ATTR_SCALING = 0.5;/**
 * Defender_endurance_discount.
 */


/**
 * Defender_endurance_discount.
 */
export const DEFENDER_ENDURANCE_DISCOUNT = 0.6;/**
 * Kill_window_endurance.
 */

/**
 * Kill_window_endurance.
 */
export const KILL_WINDOW_ENDURANCE = 0.4;/**
 * Tactic_overuse_cap.
 */
 // middle endurance threshold in calculateKillWindow

/**
 * Tactic_overuse_cap.
 */
export const TACTIC_OVERUSE_CAP = 3;/**
 * Crit_damage_mult.
 */

/**
 * Crit_damage_mult.
 */
export const CRIT_DAMAGE_MULT = 1.7;/**
 * Style_order.
 */


// ─── Style Matchup Matrix ──────────────────────────────────────────────────

/**
 * Style_order.
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
];/**
 * Get matchup bonus.
 * @param attStyle - Att style.
 * @param defStyle - Def style.
 * @returns The result.
 */


/**
 * Get matchup bonus.
 * @param attStyle - Att style.
 * @param defStyle - Def style.
 * @returns The result.
 */
export function getMatchupBonus(attStyle: FightingStyle, defStyle: FightingStyle): number {
  const ai = STYLE_ORDER.indexOf(attStyle);
  const di = STYLE_ORDER.indexOf(defStyle);
  if (ai < 0 || di < 0) return 0;
  return MATCHUP_MATRIX[ai][di];
}
