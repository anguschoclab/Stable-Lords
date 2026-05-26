/**
 * Recruitment Constants
 * Centralized constants for recruitment pool management and tier generation
 */

import narrativeContent from '@/data/narrativeContent.json';
import type { NarrativeContent } from '@/types/narrative.types';

// ─── Tier Probabilities ─────────────────────────────────────────────────────

/**
 * Recruitment tier probabilities
 * 5% chance for Prodigy, 15% for Exceptional, 30% for Promising, 50% for Common
 */
export const RECRUITMENT_PROBABILITIES = {
  PRODIGY: 0.05,
  EXCEPTIONAL: 0.2,
  PROMISING: 0.5,
  COMMON: 1.0, // fallback
} as const;

// ─── Pool Management ───────────────────────────────────────────────────────

/**
 * Recruitment pool size and management constants
 */
export const POOL_CONSTANTS = {
  DEFAULT_SIZE: 12,
  HARD_CAP: 36,
  REFRESH_RATIO: 0.3,
  REMOVE_MIN: 2,
  REMOVE_MAX: 4,
} as const;

/**
 * Refresh cost for manual pool refresh
 */
export const REFRESH_COST = 50;

/**
 * Default pool size (re-exported for convenience)
 */
export const DEFAULT_POOL_SIZE = POOL_CONSTANTS.DEFAULT_SIZE;

// ─── Lineage System ────────────────────────────────────────────────────────

/**
 * Genetic bloodline system constants
 */
export const LINEAGE_CONSTANTS = {
  LEGACY_CHANCE: 0.05,
  NOBLE_BLOOD_THRESHOLD: 2000,
} as const;

// ─── Age Range ────────────────────────────────────────────────────────────

/**
 * Recruit age range
 */
export const RECRUIT_AGE = {
  MIN: 16,
  MAX: 22,
} as const;

// ─── Tier Costs (from narrativeContent) ────────────────────────────────────

/**
 * Tier cost mapping
 */
export const TIER_COST: Record<string, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment?.tiers?.Common?.cost ?? 0,
  Promising: (narrativeContent as NarrativeContent).recruitment?.tiers?.Promising?.cost ?? 0,
  Exceptional: (narrativeContent as NarrativeContent).recruitment?.tiers?.Exceptional?.cost ?? 0,
  Prodigy: (narrativeContent as NarrativeContent).recruitment?.tiers?.Prodigy?.cost ?? 0,
};

/**
 * Tier stars mapping
 */
export const TIER_STARS: Record<string, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment?.tiers?.Common?.stars ?? 0,
  Promising: (narrativeContent as NarrativeContent).recruitment?.tiers?.Promising?.stars ?? 0,
  Exceptional: (narrativeContent as NarrativeContent).recruitment?.tiers?.Exceptional?.stars ?? 0,
  Prodigy: (narrativeContent as NarrativeContent).recruitment?.tiers?.Prodigy?.stars ?? 0,
};
