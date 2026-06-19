import { FightingStyle } from '@/types/shared.types';
import { LU_MOMENTUM_DMG_COEFF, WS_ATTRITION_FLOOR } from '@/constants/combat/combat';

/**
 * Lunging Attack's first-strike damage pressure, scaled by momentum — UNLESS
 * the defender is Wall of Steel, which is immovable and negates the tempo
 * snowball. Pure; returns the damage to add to a landed hit.
 */
export function getMomentumDamageBonus(
  attackerStyle: FightingStyle,
  attackerMomentum: number,
  defenderStyle: FightingStyle
): number {
  if (defenderStyle === FightingStyle.WallOfSteel) return 0; // immovable
  if (attackerStyle === FightingStyle.LungingAttack && attackerMomentum > 0) {
    return attackerMomentum * LU_MOMENTUM_DMG_COEFF;
  }
  return 0;
}

/** Wall of Steel attrition floor: a flat damage bump on WS landed hits. */
export function getWsAttritionBonus(attackerStyle: FightingStyle): number {
  return attackerStyle === FightingStyle.WallOfSteel ? WS_ATTRITION_FLOOR : 0;
}
