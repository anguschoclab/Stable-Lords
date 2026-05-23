/**
 * Centralized Economy Constants for Stable Lords.
 * Ensures parity between Player and AI economic calculations.
 */
// 2026-04: lethality halving + matchmaker fix made bouts much more frequent
// than the "low-frequency" assumption these constants were quadrupled for.
// Restored to a base purse so rival treasuries don't balloon into millions.
export const FIGHT_PURSE = 90;/**
                               * Win_bonus.
                               */

/**
 * Win_bonus.
 */
export const WIN_BONUS = 35;/**
                             * Fame_dividend.
                             */

/**
 * Fame_dividend.
 */
export const FAME_DIVIDEND = 0.5;/**
                                  * Warrior_upkeep_base.
                                  */
 // Stable 0.5x fame dividend

/**
 * Warrior_upkeep_base.
 */
export const WARRIOR_UPKEEP_BASE = 60;/**
                                       * Training_cost.
                                       */
 // 1.0 Gold Unified Baseline
/**
 * Training_cost.
 */
export const TRAINING_COST = 20;/**
                                 * Scout_cost.
                                 */
 // Reduced to encourage progression
/**
 * Scout_cost.
 */
export const SCOUT_COST = 25;/**
                              * Refresh_cost.
                              */

/**
 * Refresh_cost.
 */
export const REFRESH_COST = 50;/**
                                * Trainer_weekly_salary.
                                */


// Trainer Economics
/**
 * Trainer_weekly_salary.
 */
export const TRAINER_WEEKLY_SALARY: Record<string, number> = {
  Novice: 10,
  Seasoned: 25,
  Master: 75,
};
