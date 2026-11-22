export { WEAPONS } from './weapons/items';

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
