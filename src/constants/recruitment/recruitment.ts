/**
 * Recruitment Constants
 * Centralized constants for recruitment pool management and tier generation
 */

import { narrativeContent } from '@/data/narrative';
import type { NarrativeContent } from '@/types/narrative.types';

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
