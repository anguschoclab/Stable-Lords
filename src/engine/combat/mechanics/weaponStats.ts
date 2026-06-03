/**
 * Weapon combat statistics.
 *
 * Gives weapon choice real in-combat consequences beyond range and stat
 * requirements: heavier weapons hit harder but swing slower, lighter weapons the
 * reverse, and a weapon tuned for the wielder's style (preferredStyles) lands a
 * small edge. Both heft curves are centred on weight 3 so the population-wide
 * mortality baseline is preserved (mean contribution ~0 across the weapon table).
 */
import type { FightingStyle } from '@/types/shared.types';
import { WEAPONS } from '@/data/equipment/weapons';

const WEAPON_BY_ID = new Map(WEAPONS.map((w) => [w.id, w]));

/**
 * Flat damage-class bonus from the weapon: heft (weight-driven) plus a matched-style
 * edge. Added to the attacker's damage class before {@link computeHitDamage}.
 *
 * @param weaponId - Equipped weapon id (optional).
 * @param style - Wielder's fighting style, for the matched-weapon bonus (optional).
 * @returns Damage-class delta (roughly -2 for a dagger to +3 for a matched maul).
 */
export function weaponDamageBonus(weaponId?: string, style?: FightingStyle): number {
  if (!weaponId) return 0;
  const w = WEAPON_BY_ID.get(weaponId);
  if (!w) return 0;
  const heft = Math.round((w.weight - 3) * 0.8);
  const matched = style && w.preferredStyles?.includes(style) ? 1 : 0;
  return heft + matched;
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
