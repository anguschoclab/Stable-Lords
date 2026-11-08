import type { MasteryInfo, StylePassiveResult } from '../types';

/**
 * Zeroed passive result — per-style getPassive bodies spread this and
 * override the fields their mechanic touches.
 */
export const EMPTY_PASSIVE: StylePassiveResult = {
  attBonus: 0,
  parBonus: 0,
  defBonus: 0,
  ripBonus: 0,
  dmgBonus: 0,
  critChance: 0,
  iniBonus: 0,
  mastery: 'Novice',
};

/**
 * Round a passive magnitude through the mastery multiplier.
 * @param val - Unscaled bonus value
 * @param m - Mastery info (mult scales the bonus by tier)
 */
export function scale(val: number, m: MasteryInfo): number {
  return Math.round(val * m.mult);
}
