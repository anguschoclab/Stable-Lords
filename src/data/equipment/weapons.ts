export { WEAPONS } from './weapons/items';
export {
  FENCING_PREFERRED_STYLES,
  BASHING_STRIKE_STYLES,
  CRUSHING_PREFERRED_STYLES,
  FENCING_RESTRICTED_STYLES,
  SPEAR_RESTRICTED_STYLES,
  HEAVY_RESTRICTED_STYLES,
  CRUSHING_RESTRICTED_STYLES,
  BASHING_RESTRICTED_STYLES,
} from './weaponStyles';

/**
 * Shield_item_ids.
 */
export const SHIELD_ITEM_IDS = ['small_shield', 'medium_shield', 'large_shield'] as const;

/**
 * Shield_coverage.
 */
export const SHIELD_COVERAGE: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  small_shield: 'MEDIUM',
  medium_shield: 'MEDIUM',
  large_shield: 'HIGH',
};
