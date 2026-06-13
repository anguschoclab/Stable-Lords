/**
 * Protection and shield zone mitigation — damage reduction from protect targets and shields.
 */

import { protectCovers, type HitLocation } from './hitLocation';

const PROTECT_DAMAGE_REDUCTION = 0.75;
const PROTECT_DAMAGE_PENALTY = 1.1;

export function applyProtectMod(damage: number, location: HitLocation, protect?: string): number {
  const covered = protectCovers(protect);
  if (covered.includes(location)) {
    return Math.floor(damage * PROTECT_DAMAGE_REDUCTION);
  }
  return Math.floor(damage * PROTECT_DAMAGE_PENALTY);
}

const SHIELD_ZONE_LOCATIONS: Record<'LOW' | 'MEDIUM' | 'HIGH', HitLocation[]> = {
  LOW: ['right leg', 'left leg'],
  MEDIUM: ['chest', 'abdomen', 'right arm', 'left arm'],
  HIGH: ['head', 'chest', 'right arm', 'left arm'],
};

const SHIELD_ZONE_MITIGATION: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = {
  LOW: 0.92,
  MEDIUM: 0.88,
  HIGH: 0.85,
};

export function applyShieldZoneMod(
  damage: number,
  location: HitLocation,
  coverage?: 'LOW' | 'MEDIUM' | 'HIGH'
): number {
  if (!coverage) return damage;
  const zones = SHIELD_ZONE_LOCATIONS[coverage];
  if (!zones.includes(location)) return damage;
  return Math.floor(damage * SHIELD_ZONE_MITIGATION[coverage]);
}
