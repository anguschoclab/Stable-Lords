import {
  SL_BLEED_STACKS_PER_HIT,
  SL_BLEED_CAP,
  SL_BLEED_TICK_DMG,
  SL_BLEED_DECAY,
} from '@/constants/combat/combat';

/**
 * Slashing Attack win condition (flurry of cuts): add bleed stacks to a target
 * on a landed SL hit, clamped to the cap. Pure — the caller owns the mutation.
 */
export function accumulateBleed(current: number): number {
  return Math.min(SL_BLEED_CAP, current + SL_BLEED_STACKS_PER_HIT);
}

/**
 * One exchange's bleed tick: damage dealt this exchange and the decayed stack
 * count for next exchange. Pure.
 */
export function tickBleed(stacks: number): { damage: number; next: number } {
  return {
    damage: stacks * SL_BLEED_TICK_DMG,
    next: Math.max(0, stacks - SL_BLEED_DECAY),
  };
}
