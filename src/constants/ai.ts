/**
 * AI roster caps — single source of truth for rival stable sizes (G9).
 * The deliberate personality asymmetry (Aggressive fields larger stables) is
 * preserved, but every consumer now reads the same config.
 */
import type { OwnerPersonality } from '@/types/state.types';
import { AI_GENERATED_RECRUIT_COST } from './world';

/** Soft cap on active roster size — recruitment stops at this. */
export function aiRosterMax(personality?: OwnerPersonality): number {
  return personality === 'Aggressive' ? 10 : 8;
}

/** Floor below which the stable flags `needsRecruit`. */
export function aiRosterMin(personality?: OwnerPersonality): number {
  return personality === 'Aggressive' ? 8 : personality === 'Showman' ? 7 : 6;
}

/** Signing fee for a generated (non-pool) recruit — lives in
 *  `src/constants/world.ts` with the rest of the world-population knobs. */
export { AI_GENERATED_RECRUIT_COST };

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

// ─── Personality draft weights ────────────────────────────────────────────
// Extended scorer inputs for the unified draft (megaplan): each personality
// buys what it values — Showman pays for Prodigies, Pragmatic hunts value,
// Methodical prefers young prospects, Aggressive prefers ready-now bodies,
// Tactician fills the game plan.

/** Scoring weights a personality applies when drafting recruits. */
export interface PersonalityDraftWeights {
  /** Score bonus per recruit tier. */
  tierBonus: Record<string, number>;
  /** Price appetite: score -= cost * priceSensitivity / 100 (higher = thriftier). */
  priceSensitivity: number;
  /** Bonus for free-agent veterans with proven careers. */
  veteranBonus: number;
  /** Bonus when the recruit fights a personality/founder-favored style. */
  styleMatchBonus: number;
  /** Per-warrior penalty for styles already on the roster (roster balance). */
  duplicatePenalty: number;
  /** Bonus per year of youth under 21 (prospect appetite). */
  youthBonusPerYear: number;
  /** Bonus per point of attribute total above 70 (ready-now appetite). */
  readyBonusPerPoint: number;
}

/** Draft scoring weights keyed by owner personality. */
export const PERSONALITY_DRAFT_WEIGHTS: Record<OwnerPersonality, PersonalityDraftWeights> = {
  Aggressive: {
    tierBonus: { Prodigy: 80, Exceptional: 50, Promising: 25, Common: 10 },
    priceSensitivity: 15,
    veteranBonus: 40,
    styleMatchBonus: 30,
    duplicatePenalty: 15,
    youthBonusPerYear: 0,
    readyBonusPerPoint: 2,
  },
  Methodical: {
    tierBonus: { Prodigy: 100, Exceptional: 60, Promising: 35, Common: 5 },
    priceSensitivity: 30,
    veteranBonus: 0,
    styleMatchBonus: 30,
    duplicatePenalty: 15,
    youthBonusPerYear: 8,
    readyBonusPerPoint: 0,
  },
  Showman: {
    tierBonus: { Prodigy: 140, Exceptional: 60, Promising: 15, Common: 0 },
    priceSensitivity: 10,
    veteranBonus: 30,
    styleMatchBonus: 35,
    duplicatePenalty: 15,
    youthBonusPerYear: 0,
    readyBonusPerPoint: 1,
  },
  Pragmatic: {
    tierBonus: { Prodigy: 60, Exceptional: 45, Promising: 30, Common: 15 },
    priceSensitivity: 50,
    veteranBonus: 20,
    styleMatchBonus: 25,
    duplicatePenalty: 20,
    youthBonusPerYear: 0,
    readyBonusPerPoint: 1,
  },
  Tactician: {
    tierBonus: { Prodigy: 100, Exceptional: 55, Promising: 30, Common: 5 },
    priceSensitivity: 35,
    veteranBonus: 15,
    styleMatchBonus: 40,
    duplicatePenalty: 18,
    youthBonusPerYear: 4,
    readyBonusPerPoint: 1,
  },
};

/** Fallback weights when the owner's personality is unset. */
export const DEFAULT_DRAFT_WEIGHTS: PersonalityDraftWeights = PERSONALITY_DRAFT_WEIGHTS.Pragmatic;
