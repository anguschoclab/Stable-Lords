/**
 * Weapon/Armor type interactions — damage type mapping and armor resistance.
 */

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

const ARMOR_TYPE_MULT: Record<string, Partial<Record<DamageType, number>>> = {
  none_armor: {},
  padded: { bash: 0.9, pierce: 1.05 },
  leather: { slash: 0.9, pierce: 1.05 },
  studded_leather: { slash: 0.88, pierce: 1.05 },
  ring_mail: { slash: 0.9, pierce: 0.9, bash: 1.1 },
  scale_mail: { slash: 0.8, pierce: 1.15 },
  chain_mail: { pierce: 0.8, slash: 1.1 },
  plate_mail: { slash: 0.85, bash: 0.85, pierce: 0.85 },
  plate_armor: { slash: 0.8, bash: 0.8, pierce: 0.8 },
};

/**
 *
 */
export function applyArmorTypeMod(damage: number, weaponId?: string, armorId?: string): number {
  if (!weaponId || !armorId) return damage;
  const dtype = WEAPON_DAMAGE_TYPE[weaponId];
  if (!dtype || dtype === 'none') return damage;
  const mult = ARMOR_TYPE_MULT[armorId]?.[dtype] ?? 1.0;
  return Math.round(damage * mult);
}
