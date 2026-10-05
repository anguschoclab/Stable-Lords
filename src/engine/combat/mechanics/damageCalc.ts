/**
 * Damage calculation and kill window computation.
 */

import { KILL_WINDOW, KILL_WINDOW_ENDURANCE } from '@/constants/combat';
import { LOCATION_DAMAGE_MULT, LOCATION_KILL_MULT, type HitLocation } from './hitLocation';
import { clamp } from '@/utils/math';

const DAMAGE_BASE_MIN = 4;
const DAMAGE_VARIANCE_MIN = 0.7;
const DAMAGE_VARIANCE_MAX = 1.3;

/**
 *
 */
export function computeHitDamage(
  rng: () => number,
  damageClass: number,
  location: HitLocation
): number {
  const base = damageClass + DAMAGE_BASE_MIN;
  const locMult = LOCATION_DAMAGE_MULT[location] ?? 1.0;
  const variance = DAMAGE_VARIANCE_MIN + rng() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  return Math.max(1, Math.round(base * locMult * variance));
}

/**
 *
 */
interface CalculateKillWindowArgs {
  hpRatio: number;
  enduranceRatio: number;
  location: HitLocation;
  killDesire: number;
  phaseLevel: number;
  attOE?: number;
  attAL?: number;
  matchupBonus?: number;
  decSkill?: number;
  momentum?: number;
  specialtyBonus?: number;
  crowdKillBonus?: number;
}

/**
 *
 */
export function calculateKillWindow(args: CalculateKillWindowArgs): number {
  const { hpRatio, enduranceRatio, location, killDesire, phaseLevel } = args;
  const { attOE = 5, attAL = 5, matchupBonus = 0, decSkill = 10, momentum = 0 } = args;
  const { specialtyBonus = 0, crowdKillBonus = 0 } = args;
  if (momentum < 0) return 0;
  const K = KILL_WINDOW;

  let threshold = K.BASE;

  if (hpRatio < K.HP_CRITICAL_RATIO) threshold += K.HP_CRITICAL_ADD;
  else if (hpRatio < K.HP_HURT_RATIO) threshold += K.HP_HURT_ADD;

  if (enduranceRatio < K.END_SPENT_RATIO) threshold += K.END_SPENT_ADD;
  else if (enduranceRatio < KILL_WINDOW_ENDURANCE) threshold += K.END_TIRED_ADD;
  else if (enduranceRatio < K.END_WINDED_RATIO) threshold += K.END_WINDED_ADD;

  const locMult = LOCATION_KILL_MULT[location] ?? 1.0;
  threshold *= locMult;

  threshold += (attOE + attAL - 10) * K.EFFORT_COEFF;
  threshold += matchupBonus * K.MATCHUP_COEFF;
  threshold += (killDesire - 5) * K.KILL_DESIRE_COEFF;
  threshold += (decSkill - 10) * K.DEC_COEFF;
  threshold += phaseLevel * K.PHASE_COEFF;

  if (momentum >= 3) threshold += K.MOMENTUM_FULL_ADD;
  else if (momentum >= 2) threshold += K.MOMENTUM_HIGH_ADD;

  threshold += specialtyBonus;
  threshold += crowdKillBonus;

  return clamp(threshold, 0, K.CAP);
}
