/**
 * Damage calculation and kill window computation.
 */

import { KILL_WINDOW_ENDURANCE } from '@/constants/combat';
import { LOCATION_DAMAGE_MULT, LOCATION_KILL_MULT, type HitLocation } from './hitLocation';

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
export function calculateKillWindow(
  hpRatio: number,
  enduranceRatio: number,
  location: HitLocation,
  killDesire: number,
  phaseLevel: number,
  attOE: number = 5,
  attAL: number = 5,
  matchupBonus: number = 0,
  decSkill: number = 10,
  momentum: number = 0,
  specialtyBonus: number = 0,
  crowdKillBonus: number = 0
): number {
  if (momentum < 0) return 0;

  let threshold = 0.012;

  if (hpRatio < 0.3) threshold += 0.004;
  else if (hpRatio < 0.5) threshold += 0.001;

  if (enduranceRatio < 0.2) threshold += 0.006;
  else if (enduranceRatio < KILL_WINDOW_ENDURANCE) threshold += 0.003;
  else if (enduranceRatio < 0.6) threshold += 0.001;

  const locMult = LOCATION_KILL_MULT[location] ?? 1.0;
  threshold *= locMult;

  threshold += (attOE + attAL - 10) * 0.00025;
  threshold += matchupBonus * 0.001;
  threshold += (killDesire - 5) * 0.002;
  threshold += (decSkill - 10) * 0.0003;
  threshold += phaseLevel * 0.0015;

  if (momentum >= 3) threshold += 0.0075;
  else if (momentum >= 2) threshold += 0.004;

  threshold += specialtyBonus;
  threshold += crowdKillBonus;

  return Math.max(0, Math.min(0.04, threshold));
}
