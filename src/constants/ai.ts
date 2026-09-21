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
