/**
 * Stable Lords — Canonical Equipment Database
 * Weapons, armor, shields, helms with codes, weights, style restrictions.
 * Based on canonical Duelmasters equipment tables.
 */

// Re-export types
export type {
  EquipmentItem,
  EquipmentSlot,
  EquipmentLoadout,
  WeaponReqResult,
  WeaponReqCheck,
  LoadoutIssue,
} from './equipment.types';

// Re-export specific equipment arrays
export { WEAPONS } from './weapons';
export { ARMORS } from './armor';
export { HELMS } from './helms';
export { SHIELDS } from './shields';

// Re-export utility functions
export {
  getAvailableItems,
  getItemById,
  getItemByCode,
  isPreferredWeapon,
  getStyleDefaultLoadout,
  checkWeaponRequirements,
  validateLoadout,
  getLoadoutWeight,
  isOverEncumbered,
  ALL_EQUIPMENT,
  DEFAULT_LOADOUT,
  getClassicWeaponBonus,
} from './equipment.utils';

// Re-export shield constants from weapons module
export { SHIELD_ITEM_IDS, SHIELD_COVERAGE } from './weapons';
