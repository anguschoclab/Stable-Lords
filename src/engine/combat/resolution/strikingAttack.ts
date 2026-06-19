import { FightingStyle } from '@/types/shared.types';
import {
  ST_FRONTLOAD_START,
  ST_FRONTLOAD_WINDOW,
  ST_CRIT_CHANCE_BONUS,
  ST_CRIT_DAMAGE_BONUS,
  ST_EXECUTE_HP_THRESHOLD,
  ST_EXECUTE_BONUS,
} from '@/constants/combat/combat';

const isST = (style: FightingStyle) => style === FightingStyle.StrikingAttack;

/** Front-load damage multiplier: peaks at ST_FRONTLOAD_START, decays linearly to 1.0 over the window. */
export function getFrontloadMult(style: FightingStyle, exchange: number): number {
  if (!isST(style)) return 1.0;
  const t = Math.max(0, 1 - exchange / ST_FRONTLOAD_WINDOW);
  return 1 + (ST_FRONTLOAD_START - 1) * t;
}

/** Added crit chance for ST (folded into the base style-passive crit chance). */
export function getStCritChanceBonus(style: FightingStyle): number {
  return isST(style) ? ST_CRIT_CHANCE_BONUS : 0;
}

/** Added crit-damage multiplier for ST (added on top of CRIT_DAMAGE_MULT). */
export function getStCritDamageBonus(style: FightingStyle): number {
  return isST(style) ? ST_CRIT_DAMAGE_BONUS : 0;
}

/** Execute: flat bonus damage when the target is below the HP threshold. */
export function getExecuteBonus(style: FightingStyle, hp: number, maxHp: number): number {
  if (!isST(style)) return 0;
  return hp / Math.max(1, maxHp) < ST_EXECUTE_HP_THRESHOLD ? ST_EXECUTE_BONUS : 0;
}
