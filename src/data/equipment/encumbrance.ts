/**
 * 5-Tier Encumbrance System
 * Replaces the binary over-encumbrance check with graduated tiers.
 *
 * Tiers and boundaries:
 *   ratio < 0.60       → NONE   (no penalties)
 *   0.60 ≤ ratio < 0.80 → LIGHT  (small INI penalty)
 *   0.80 ≤ ratio < 1.00 → MEDIUM (INI + DEF penalty)
 *   1.00 ≤ ratio < 1.20 → HEAVY  (INI + DEF + PAR penalty)
 *   ratio ≥ 1.20        → OVER   (largest penalties)
 */

import type { EquipmentLoadout } from './equipment.types';
import { getLoadoutWeight } from './equipment.utils';

/**
 *
 */
export type EncumbranceTier = 'NONE' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'OVER';

/**
 *
 */
export interface EncumbrancePenalties {
  iniPenalty: number;
  defPenalty: number;
  parPenalty: number;
  enduranceMult: number;
}

const TIER_THRESHOLDS: { tier: EncumbranceTier; min: number }[] = [
  { tier: 'OVER', min: 1.2 },
  { tier: 'HEAVY', min: 1.0 },
  { tier: 'MEDIUM', min: 0.8 },
  { tier: 'LIGHT', min: 0.6 },
  { tier: 'NONE', min: 0.0 },
];

const TIER_PENALTIES: Record<EncumbranceTier, EncumbrancePenalties> = {
  NONE: { iniPenalty: 0, defPenalty: 0, parPenalty: 0, enduranceMult: 1.0 },
  LIGHT: { iniPenalty: -1, defPenalty: 0, parPenalty: 0, enduranceMult: 1.05 },
  MEDIUM: { iniPenalty: -2, defPenalty: -1, parPenalty: 0, enduranceMult: 1.15 },
  HEAVY: { iniPenalty: -3, defPenalty: -1, parPenalty: -1, enduranceMult: 1.3 },
  OVER: { iniPenalty: -4, defPenalty: -2, parPenalty: -2, enduranceMult: 1.5 },
};

/**
 *
 */
export function getEncumbranceRatio(loadout: EquipmentLoadout, carryCap: number): number {
  if (carryCap <= 0) return Infinity;
  return getLoadoutWeight(loadout) / carryCap;
}

/**
 *
 */
export function getEncumbranceTier(ratio: number): EncumbranceTier {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (ratio >= min) return tier;
  }
  return 'NONE';
}

/**
 *
 */
export function getEncumbrancePenalties(tier: EncumbranceTier): EncumbrancePenalties {
  return TIER_PENALTIES[tier];
}
