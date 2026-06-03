/**
 * Weapon combat statistics.
 *
 * Gives weapon choice real in-combat consequences beyond range and stat
 * requirements: heavier weapons hit harder but swing slower, lighter weapons the
 * reverse, and the canonical per-style weapon suitability (W/M/U) shifts damage —
 * a Well-suited weapon lands an edge, an Unorthodox one a penalty. The heft curve
 * is centred on weight 3 so the population-wide mortality baseline is preserved
 * (mean contribution ~0 across the weapon table).
 */
import type { FightingStyle } from '@/types/shared.types';
import { WEAPONS } from '@/data/equipment/weapons';
import { getWeaponSuitability, weaponSuitabilityDamageMod } from '@/engine/weaponSuitability';

const WEAPON_BY_ID = new Map(WEAPONS.map((w) => [w.id, w]));

/**
 * Flat damage-class bonus from the weapon: heft (weight-driven) plus the canonical
 * weapon-style suitability modifier (CW +1 / W 0 / M −1 / U −2). Added to the
 * attacker's damage class before {@link computeHitDamage}.
 *
 * @param weaponId - Equipped weapon id (optional).
 * @param style - Wielder's fighting style, for the suitability modifier (optional).
 * @returns Damage-class delta (favorite weapon ≈ heft +1; unorthodox ≈ heft −2).
 */
export function weaponDamageBonus(weaponId?: string, style?: FightingStyle): number {
  if (!weaponId) return 0;
  const w = WEAPON_BY_ID.get(weaponId);
  if (!w) return 0;
  const heft = Math.round((w.weight - 3) * 0.8);
  const suitability = style ? weaponSuitabilityDamageMod(getWeaponSuitability(weaponId, style)) : 0;
  return heft + suitability;
}

/**
 * Initiative modifier from weapon heft: light weapons strike faster, heavy ones
 * slower. Centred on weight 3 (≈ +1 for a dagger, ≈ -2 for a maul).
 *
 * @param weaponId - Equipped weapon id (optional).
 * @returns Initiative delta.
 */
export function getWeaponInitiativeMod(weaponId?: string): number {
  if (!weaponId) return 0;
  const w = WEAPON_BY_ID.get(weaponId);
  if (!w) return 0;
  return -Math.round((w.weight - 3) * 0.5);
}
