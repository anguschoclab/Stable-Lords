/**
 * Wall of Steel harmony — the She-Puppy rumor (Arena 93): "a wall of steel
 * gets a bonus if his OE equals his KD." Implemented as a small flat parry
 * bonus while the phase-resolved offensive effort equals kill desire: the
 * wall hums behind a steadier guard when effort matches intent.
 *
 * Pure helper — no RNG, no state. OE/KD are read from the *active* plan for
 * the current phase (post conditions/decoys/desperate swaps), so a desperate
 * 2-6-2 sheet can harmonize itself.
 */
import { FightingStyle } from '@/types/shared.types';
import { WS_HARMONY_PAR } from '@/constants/combat';

/**
 * Parry bonus for a Wall of Steel whose resolved OE equals its kill desire.
 * Zero for every other style and for a disharmonized wall.
 */
export function getWallHarmonyBonus(
  style: FightingStyle,
  OE: number,
  killDesire: number
): number {
  return style === FightingStyle.WallOfSteel && OE === killDesire ? WS_HARMONY_PAR : 0;
}
