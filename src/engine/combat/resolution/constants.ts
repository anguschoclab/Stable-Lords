/**
 * Resolution Constants - Decision hit margin and matchup bonus
 */
import { FightingStyle } from '@/types/shared.types';
import { getMatchupBonus as rawMatchupBonus } from '../mechanics/combatConstants';

/**
 * Decision_hit_margin.
 */
export const DECISION_HIT_MARGIN = 3;

/**
 * Get matchup bonus.
 */
export function getMatchupBonus(styleA: FightingStyle, styleD: FightingStyle): number {
  return rawMatchupBonus(styleA, styleD);
}
