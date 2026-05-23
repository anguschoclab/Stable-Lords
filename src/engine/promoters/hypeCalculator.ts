/**
 * Hype Calculation
 * Calculates bout hype based on style clash, personality bias, and special conditions.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { Promoter } from '@/types/state.types';
import { PERSONALITY_HYPE_BIAS } from './personalityScoring';

/**
 * Calculate bout hype between two warriors for a given promoter.
 * Considers style clash, personality bias, and special conditions.
 *
 * @param a - First warrior
 * @param b - Second warrior
 * @param promoter - The promoter hosting the bout
 * @returns Calculated hype value
 */
export function calculateHype(a: Warrior, b: Warrior, promoter: Promoter): number {
  let hype = 100;

  // 1. Style Clash
  const isBrute = (s: FightingStyle) =>
    s === FightingStyle.BashingAttack || s === FightingStyle.StrikingAttack;
  const isEvasive = (s: FightingStyle) =>
    s === FightingStyle.TotalParry || s === FightingStyle.WallOfSteel;

  if (isBrute(a.style) && isEvasive(b.style)) hype += 20;
  if (isBrute(b.style) && isEvasive(a.style)) hype += 20;
  if (isEvasive(a.style) && isEvasive(b.style)) hype -= 30;

  // 2. Personality Bias - Extended for all personalities
  hype = (PERSONALITY_HYPE_BIAS[promoter.personality] ?? ((_a, _b, h) => h))(a, b, hype);

  // 3. "Zero has to Go"
  if (a.career.losses === 0 && b.career.losses === 0 && a.career.wins > 3 && b.career.wins > 3) {
    hype *= 1.5;
  }

  return Math.floor(hype);
}
