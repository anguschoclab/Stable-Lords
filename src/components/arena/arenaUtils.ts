/**
 * Arena utility functions for calculations and data transformations.
 */

/**
 * Calculate percentage with bounds checking.
 * @param current - Current value
 * @param max - Maximum value
 * @returns Percentage from 0-100
 */
export function calculatePercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

/**
 * Shield information extracted from shield name.
 */
export interface ShieldInfo {
  /** Whether a valid shield is equipped */
  hasShield: boolean;
  /** Size category of the shield */
  size: 'small' | 'medium' | 'large';
}

/**
 * Parse shield name to determine if a shield is equipped and its size.
 * Handles edge cases like 'none', empty strings, and various shield types.
 *
 * @param shieldName - The name of the shield equipment
 * @returns ShieldInfo with hasShield flag and size category
 */
export function parseShieldInfo(shieldName?: string): ShieldInfo {
  if (!shieldName || shieldName.toLowerCase() === 'none') {
    return { hasShield: false, size: 'medium' };
  }

  const normalized = shieldName.toLowerCase();

  // Check if it's actually a shield (name contains 'shield')
  const hasShield = normalized.includes('shield');

  // Determine size from name
  let size: ShieldInfo['size'] = 'medium';
  if (normalized.includes('large')) {
    size = 'large';
  } else if (normalized.includes('small')) {
    size = 'small';
  }

  return { hasShield, size };
}
