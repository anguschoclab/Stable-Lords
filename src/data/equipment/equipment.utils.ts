/**
 * Equipment utility functions for Stable Lords.
 * Provides functions to search, validate, and work with equipment.
 */

import { FightingStyle } from '@/types/game';
import { WEAPONS } from './weapons';
import { ARMORS } from './armor';
import { SHIELDS } from './shields';
import { HELMS } from './helms';
import type {
  EquipmentItem,
  EquipmentSlot,
  EquipmentLoadout,
  WeaponReqResult,
  WeaponReqCheck,
  LoadoutIssue,
} from './equipment.types'; /**
                             * All_equipment.
                             */

// Combined all equipment for convenience
/**
 * All_equipment.
 */
export const ALL_EQUIPMENT: EquipmentItem[] = [...WEAPONS, ...ARMORS, ...SHIELDS, ...HELMS]; /**
                                                                                              * Get item by id.
                                                                                              * @param id - Id.
                                                                                              * @returns The result.
                                                                                              */

/**
 * Get item by id.
 * @param id - Id.
 * @returns The result.
 */
export function getItemById(id: string): EquipmentItem | undefined {
  return ALL_EQUIPMENT.find((item) => item.id === id);
} /**
   * Get item by code.
   * @param code - Code.
   * @returns The result.
   */

/**
 * Get item by code.
 * @param code - Code.
 * @returns The result.
 */
export function getItemByCode(code: string): EquipmentItem | undefined {
  return ALL_EQUIPMENT.find((item) => item.code === code);
} /**
   * Get available items.
   * @param slot - Slot.
   * @param style - Style.
   * @returns The result.
   */

/**
 * Get available items.
 * @param slot - Slot.
 * @param style - Style.
 * @returns The result.
 */
export function getAvailableItems(slot: EquipmentSlot, style: FightingStyle): EquipmentItem[] {
  const pool =
    slot === 'weapon' ? WEAPONS : slot === 'armor' ? ARMORS : slot === 'shield' ? SHIELDS : HELMS;
  return pool.filter((item) => !item.restrictedStyles?.includes(style));
} /**
   * Is preferred weapon.
   * @param item - Item.
   * @param style - Style.
   * @returns The result.
   */

/**
 * Is preferred weapon.
 * @param item - Item.
 * @param style - Style.
 * @returns The result.
 */
export function isPreferredWeapon(item: EquipmentItem, style: FightingStyle): boolean {
  return item.preferredStyles?.includes(style) ?? false;
} /**
   * Default_loadout.
   */

/**
 * Default_loadout.
 */
export const DEFAULT_LOADOUT: EquipmentLoadout = {
  weapon: 'broadsword',
  armor: 'leather',
  shield: 'none_shield',
  helm: 'leather_cap',
};

/**
 * Style-aware default loadout. Every style gets its canonical (classic) weapon
 * so the +1 classic-weapon bonus and weapon stat-requirements line up with the
 * warrior's style. Without this, every default-loadout warrior was issued a
 * broadsword (Striking Attack's classic), giving ST a hidden +1 ATT advantage
 * that no other style had access to.
 *
 * Used by the warrior factory to seed `warrior.equipment` at creation, and by
 * combat fallback paths when a warrior has no equipment field set.
 */
export function getStyleDefaultLoadout(style: FightingStyle): EquipmentLoadout {
  const classic = STYLE_CLASSIC_WEAPONS[style] ?? 'broadsword';
  return {
    weapon: classic,
    armor: 'leather',
    shield: 'none_shield',
    helm: 'leather_cap',
  };
} /**
   * Get loadout weight.
   * @param loadout - Loadout.
   * @returns The result.
   */

/**
 * Get loadout weight.
 * @param loadout - Loadout.
 * @returns The result.
 */
export function getLoadoutWeight(loadout: EquipmentLoadout): number {
  return [loadout.weapon, loadout.armor, loadout.shield, loadout.helm].reduce(
    (sum, id) => sum + (getItemById(id)?.weight ?? 0),
    0
  );
}

/** How a weapon is being held — selects the canonical requirement special-cases. */
export type WieldMode = 'normal' | 'two_handed' | 'off_hand' | 'dual';

/** Options for {@link checkWeaponRequirements}. */
export interface WieldOptions {
  /** Defaults to 'two_handed' for two-handed weapons, otherwise 'normal'. */
  wield?: WieldMode;
  /** Ambidextrous warriors get eased dual-wield requirements. */
  ambidextrous?: boolean;
}

/**
 * Effective stat minimums for a weapon, applying the canonical wield-mode override
 * (two-handed / off-hand / dual-wield) on top of the base requirements.
 */
function effectiveWeaponReqs(
  item: EquipmentItem,
  mode: WieldMode,
  ambidextrous: boolean
): Partial<Record<'ST' | 'SZ' | 'WT' | 'DF', number>> {
  const base = { ST: item.reqST, SZ: item.reqSZ, WT: item.reqWT, DF: item.reqDF };
  const override =
    mode === 'two_handed'
      ? item.twoHandedReq
      : mode === 'off_hand'
        ? item.offHandReq
        : mode === 'dual'
          ? ambidextrous
            ? (item.dualWieldReqAmbi ?? item.dualWieldReq)
            : item.dualWieldReq
          : undefined;
  return { ...base, ...(override ?? {}) };
}

/**
 * Check weapon stat requirements against warrior attributes. Returns penalty details.
 * Applies canonical wield-mode special cases (e.g. Battle Axe SZ 3 two-handed, dual
 * Epées DF 22 / 17-ambidextrous). Two-handed weapons default to 'two_handed' mode.
 */
export function checkWeaponRequirements(
  weaponId: string,
  attrs: { ST: number; SZ: number; WT: number; DF: number },
  opts?: WieldOptions
): WeaponReqResult {
  const item = getItemById(weaponId);
  if (!item || item.slot !== 'weapon')
    return { met: true, failures: [], attPenalty: 0, endurancePenalty: 1 };

  const mode: WieldMode = opts?.wield ?? (item.twoHanded ? 'two_handed' : 'normal');
  const req = effectiveWeaponReqs(item, mode, opts?.ambidextrous ?? false);

  const checks: WeaponReqCheck[] = [];
  const consider = (
    stat: 'ST' | 'SZ' | 'WT' | 'DF',
    label: string,
    required: number | undefined,
    current: number
  ) => {
    if (required && current < required)
      checks.push({ stat, label, required, current, deficit: required - current });
  };
  consider('ST', 'Strength', req.ST, attrs.ST);
  consider('SZ', 'Size', req.SZ, attrs.SZ);
  consider('WT', 'Wit', req.WT, attrs.WT);
  consider('DF', 'Deftness', req.DF, attrs.DF);

  let totalDeficit = 0;
  for (const check of checks) {
    totalDeficit += check.deficit;
  }

  return {
    met: checks.length === 0,
    failures: checks,
    attPenalty: totalDeficit * -2,
    endurancePenalty: 1 + totalDeficit * 0.1,
  };
} /**
   * Is over encumbered.
   * @param loadout - Loadout.
   * @param carryCap - Carry cap.
   * @returns The result.
   */

/**
 * Is over encumbered.
 * @param loadout - Loadout.
 * @param carryCap - Carry cap.
 * @returns The result.
 */
export function isOverEncumbered(loadout: EquipmentLoadout, carryCap: number): boolean {
  return getLoadoutWeight(loadout) > carryCap;
}

/**
 * Hard-block validation for a loadout. Replaces the previous soft-warning fallthrough
 * for the two-handed + shield conflict — illegal combinations return a list of issues
 * so the UI/plan layer can block save instead of silently stripping gear.
 */
export function validateLoadout(loadout: EquipmentLoadout): LoadoutIssue[] {
  const issues: LoadoutIssue[] = [];
  const weapon = getItemById(loadout.weapon);
  if (!weapon) {
    issues.push({ code: 'MISSING_WEAPON', message: 'Loadout has no valid weapon.' });
    return issues;
  }
  const usingShield =
    !!loadout.shield && loadout.shield !== 'none_shield' && loadout.shield !== 'None';
  // Also catch the case where both hands hold a shield (weapon slot is a shield
  // and the offhand is also a shield) OR a two-handed weapon is paired with any shield.
  if (weapon.twoHanded && usingShield) {
    issues.push({
      code: 'TWO_HANDED_WITH_SHIELD',
      message: `${weapon.name} is two-handed and cannot be paired with a shield.`,
    });
  }
  return issues;
}

/**
 * Classic/canonical weapon per fighting style — from Terrablood Duel II tables.
 * Using the classic weapon grants a +1 ATT bonus in combat.
 * Total-Parry is special: ANY shield is the classic weapon.
 */
export const STYLE_CLASSIC_WEAPONS: Record<string, string> = {
  [FightingStyle.AimedBlow]: 'quarterstaff', // CW: Quarterstaff
  [FightingStyle.BashingAttack]: 'mace', // CW: Mace
  [FightingStyle.LungingAttack]: 'short_spear', // CW: Short Spear
  [FightingStyle.ParryLunge]: 'longsword', // CW: Longsword
  [FightingStyle.ParryRiposte]: 'epee', // CW: Epée
  [FightingStyle.ParryStrike]: 'short_sword', // CW: Shortsword (was broadsword — corrected from Terrablood)
  [FightingStyle.SlashingAttack]: 'scimitar', // CW: Scimitar
  [FightingStyle.StrikingAttack]: 'broadsword', // CW: Broadsword
  [FightingStyle.TotalParry]: 'medium_shield', // CW: Any Shield (medium as default display)
  [FightingStyle.WallOfSteel]: 'morning_star', // CW: Morning Star
};

const SHIELD_IDS = new Set(['small_shield', 'medium_shield', 'large_shield']);

/** Returns +1 if the warrior is using their style's classic weapon, 0 otherwise.
 *  Total-Parry: any shield qualifies. */
export function getClassicWeaponBonus(style: FightingStyle, weaponId: string): number {
  if (style === FightingStyle.TotalParry) {
    return SHIELD_IDS.has(weaponId) ? 1 : 0;
  }
  return STYLE_CLASSIC_WEAPONS[style] === weaponId ? 1 : 0;
}
