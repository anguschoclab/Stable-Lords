import { getItemById, getItemByCode } from '@/data/equipment';
import { type WeaponType } from '@/types/combat.types';
import { FightingStyle } from '@/types/shared.types';
import { randomPick } from '@/utils/random';
import type { RNG } from './types';

/**
 * Stable Lords — Narrative Helpers
 */

/**
 * Pick a random element from an array using the provided RNG.
 * @deprecated Use randomPick from @/utils/random instead
 */
export function pick<T>(arr: T[], rng: RNG): T {
  return randomPick(arr, rng);
}

/** Approximate DM-style heights from SZ attribute */
export function szToHeight(sz: number): string {
  const inches = 58 + Math.max(0, sz - 3) * 1.2;
  const ft = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return inch > 0 ? `${ft}' ${inch}"` : `${ft}'`;
}

/** Map equipment IDs to canonical display names (e.g. "BS" → "BROADSWORD") */
export function getWeaponDisplayName(equipId?: string): string {
  if (!equipId || equipId === 'fists' || equipId === 'none') return 'OPEN HAND';
  const item = getItemById(equipId) ?? getItemByCode(equipId);
  return item?.name?.toUpperCase() ?? 'WEAPON';
}

/** Hybrid weapons that can be slashing or piercing depending on fighting style */
const HYBRID_WEAPONS: Record<string, WeaponType[]> = {
  halberd: ['slashing', 'piercing'],
  short_sword: ['slashing', 'piercing'],
  longsword: ['slashing', 'piercing'],
};

/** Map fighting style → preferred weapon type for hybrid weapons */
const STYLE_TO_WEAPON_TYPE: Partial<Record<FightingStyle, WeaponType>> = {
  [FightingStyle.SlashingAttack]: 'slashing',
  [FightingStyle.LungingAttack]: 'piercing',
  [FightingStyle.ParryLunge]: 'piercing',
  [FightingStyle.AimedBlow]: 'piercing',
  [FightingStyle.StrikingAttack]: 'slashing',
  [FightingStyle.ParryStrike]: 'slashing',
  [FightingStyle.ParryRiposte]: 'slashing',
  [FightingStyle.BashingAttack]: 'slashing',
  [FightingStyle.WallOfSteel]: 'slashing',
  [FightingStyle.TotalParry]: 'slashing',
};

/** Determine weapon category for PBP verb mapping */
export function getWeaponType(weaponId?: string, style?: FightingStyle): WeaponType {
  if (!weaponId || weaponId === 'fists' || weaponId === 'none') return 'fist';

  // Hybrid weapons: resolve via fighting style if available
  if (HYBRID_WEAPONS[weaponId]) {
    if (style && STYLE_TO_WEAPON_TYPE[style]) {
      return STYLE_TO_WEAPON_TYPE[style]!;
    }
    return HYBRID_WEAPONS[weaponId][0]!; // default to first type
  }

  const slashing = [
    'scimitar',
    'broadsword',
    'greatsword',
    'hatchet',
    'battle_axe',
    'great_axe',
  ];
  const bashing = [
    'mace',
    'morning_star',
    'maul',
    'war_flail',
    'war_hammer',
    'quarterstaff',
    'large_shield',
    'medium_shield',
    'small_shield',
  ];
  const piercing = ['epee', 'dagger', 'short_spear', 'long_spear'];

  if (slashing.includes(weaponId)) return 'slashing';
  if (bashing.includes(weaponId)) return 'bashing';
  if (piercing.includes(weaponId)) return 'piercing';

  return 'fist';
}
