/**
 * Weapon/Armor type interactions — damage type mapping and armor resistance.
 */

import { getItemById } from '@/data/equipment/equipment.utils';
import { WEAPON_ARMOR_MATRIX } from '@/constants/combat';

type DamageType = 'slash' | 'bash' | 'pierce' | 'none';

export const WEAPON_DAMAGE_TYPE: Record<string, DamageType> = {
  dagger: 'pierce',
  epee: 'pierce',
  short_spear: 'pierce',
  long_spear: 'pierce',
  hatchet: 'slash',
  short_sword: 'slash',
  scimitar: 'slash',
  longsword: 'slash',
  battle_axe: 'slash',
  broadsword: 'slash',
  greatsword: 'slash',
  great_axe: 'slash',
  fist: 'bash',
  mace: 'bash',
  war_hammer: 'bash',
  morning_star: 'bash',
  war_flail: 'bash',
  maul: 'bash',
  halberd: 'bash',
  quarterstaff: 'bash',
  small_shield: 'none',
  medium_shield: 'none',
  large_shield: 'none',
};

/**
 * Canon weapon-damage-type baseline per armor id — see
 * src/constants/combat/combat/weaponArmorMatrix.ts for the adjudication
 * rationale. ARM pre-F2 was canon-inverted (bash bonus + pierce resist vs
 * the documented crushing-absorb / thin-blade-weak profile).
 */
const ARMOR_TYPE_MULT: Record<string, Partial<Record<DamageType, number>>> = {
  none_armor: {},
  ALE: { slash: 0.9, pierce: 1.05 },
  APL: { bash: 0.9, slash: 1.05, pierce: 1.05 },
  ARM: { bash: 0.85, pierce: 1.1 },
  ASM: { slash: 0.8, bash: 1.1, pierce: 1.15 },
  ACM: { bash: 0.8, pierce: 1.15 },
  APM: { slash: 0.85, bash: 0.85, pierce: 0.85 },
  APA: { slash: 0.8, bash: 0.85, pierce: 0.8 },
};

/**
 * Damage scaled by the weapon × armor interaction. Weapon-specific matrix
 * cells compose on top of the armor's damage-type baseline; everything
 * else falls through to ARMOR_TYPE_MULT (then 1.0).
 */
export function applyArmorTypeMod(damage: number, weaponId?: string, armorId?: string): number {
  if (!weaponId || !armorId) return damage;
  const dtype = WEAPON_DAMAGE_TYPE[weaponId];
  if (!dtype || dtype === 'none') return damage;
  const cell = WEAPON_ARMOR_MATRIX[weaponId]?.[armorId];
  const weaponFactor = typeof cell === 'number' ? cell : 1.0;
  const dtypeMult = ARMOR_TYPE_MULT[armorId]?.[dtype] ?? 1.0;
  return Math.round(damage * weaponFactor * dtypeMult);
}

/**
 * Applies flat damage mitigation from armor and helm.
 * Stacks armor.mitigation + helm.mitigation additively, then subtracts from damage.
 * Floors at 1 for positive damage, 0 stays 0.
 */
export function applyFlatMitigation(damage: number, armorId?: string, helmId?: string): number {
  if (damage <= 0) return 0;
  const armorItem = armorId ? getItemById(armorId) : undefined;
  const helmItem = helmId ? getItemById(helmId) : undefined;
  const totalMitigation = (armorItem?.mitigation ?? 0) + (helmItem?.mitigation ?? 0);
  return Math.max(1, damage - totalMitigation);
}
