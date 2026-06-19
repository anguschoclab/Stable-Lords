import { FightingStyle } from '@/types/shared.types';
import { PS_COUNTERSTRIKE_ATT } from '@/constants/combat/combat';
import type { FighterState } from './types';

/**
 * Parry-Strike win condition: a successful parry primes `counterstrikePrimed`
 * (set in resolveContestedDefense). On the fighter's next attack we grant a
 * flat ATT bonus so PS — which has a low base ATT — can actually land its
 * counter. Returns 0 for any non-PS fighter or when not primed.
 */
export function getCounterstrikeAttBonus(
  fighter: Pick<FighterState, 'style' | 'counterstrikePrimed'>
): number {
  if (fighter.style !== FightingStyle.ParryStrike) return 0;
  return fighter.counterstrikePrimed ? PS_COUNTERSTRIKE_ATT : 0;
}
