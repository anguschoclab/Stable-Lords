/**
 * Mastery System - Mastery tier calculations and thresholds
 */
import type { MasteryTier, MasteryInfo } from './types';

const MASTERY_THRESHOLDS: { tier: MasteryTier; minFights: number; bonus: number; mult: number }[] =
  [
    { tier: 'Grandmaster', minFights: 50, bonus: 2, mult: 1.5 },
    { tier: 'Master', minFights: 30, bonus: 1, mult: 1.3 },
    { tier: 'Veteran', minFights: 20, bonus: 1, mult: 1.15 },
    { tier: 'Practiced', minFights: 10, bonus: 0, mult: 1.05 },
    { tier: 'Novice', minFights: 0, bonus: 0, mult: 1.0 },
  ];

/**
 * Calculates mastery level and bonuses based on total fights fought in a style.
 */
export function getMastery(totalFights: number): MasteryInfo {
  for (const t of MASTERY_THRESHOLDS) {
    if (totalFights >= t.minFights)
      return { tier: t.tier, fights: totalFights, bonus: t.bonus, mult: t.mult };
  }
  return { tier: 'Novice', fights: totalFights, bonus: 0, mult: 1.0 };
}
