import { BA_PARDEGRADE_PER_HIT, BA_PARDEGRADE_CAP } from '@/constants/combat/combat';

/**
 * Bashing Attack win condition: each landed BA hit erodes the defender's guard.
 * Returns the defender's next accumulated parry/dodge penalty, clamped to the
 * cap. Pure — the caller (executeHit) owns the FighterState mutation.
 */
export function accumulateGuardBreak(current: number): number {
  return Math.min(BA_PARDEGRADE_CAP, current + BA_PARDEGRADE_PER_HIT);
}
