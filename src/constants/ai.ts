/**
 * AI roster caps — single source of truth for rival stable sizes (G9).
 * The deliberate personality asymmetry (Aggressive fields larger stables) is
 * preserved, but every consumer now reads the same config.
 */
import type { OwnerPersonality } from '@/types/state.types';

/** Soft cap on active roster size — recruitment stops at this. */
export function aiRosterMax(personality?: OwnerPersonality): number {
  return personality === 'Aggressive' ? 10 : 8;
}

/** Floor below which the stable flags `needsRecruit`. */
export function aiRosterMin(personality?: OwnerPersonality): number {
  return personality === 'Aggressive' ? 8 : personality === 'Showman' ? 7 : 6;
}

/** Signing fee for a generated (non-pool) recruit. */
export const AI_GENERATED_RECRUIT_COST = 100;

// ─── AI economy sinks ───────────────────────────────────────────────────────
// Rival stables previously earned purses with almost nothing to spend them on
// (trait development was free, training capped at 3 slots above treasury 500,
// gear gated at 800–1000). These knobs give wealth something real to buy so
// rival treasuries equilibrate instead of growing linearly forever.

/** Gold paid per trait-development attempt (coaching hours, win or lose). */
export const AI_TRAIT_DEV_COST = 75;

/** Treasury floor — trait development never spends the stable below this. */
export const AI_TRAIT_DEV_RESERVE = 300;

/** Above this treasury the stable runs a premium development program. */
export const AI_TRAIT_DEV_WEALTH_TREASURY = 10_000;

/** Development-appetite multiplier for wealthy stables. */
export const AI_TRAIT_DEV_WEALTH_APPETITE_MULT = 1.5;

/** Treasury below which rivals pay no prestige/facilities upkeep. */
export const AI_PRESTIGE_FREE_TREASURY = 10_000;

/** Weekly prestige upkeep rate on treasury above the free threshold. */
export const AI_PRESTIGE_RATE = 0.04;

/** Hard cap: prestige upkeep never exceeds this fraction of treasury per week. */
export const AI_PRESTIGE_CAP_RATE = 0.05;
