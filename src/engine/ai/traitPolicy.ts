import type { OwnerPersonality } from '@/types/state.types';
import type { TrainerTier } from '@/types/shared.types';

/**
 *
 */
export interface TraitPolicy {
  /** Release a warrior whose liability score (System 4) reaches this. Lower = cuts faster. */
  cutLiabilityThreshold: number;
  /** Per-warrior weekly chance to resolve a trait-training arc. Higher = develops more. */
  trainAppetite: number;
  /** Max trainer tier the stable will gamble on (bold reaches Signature, cautious stays safe). */
  ceiling: TrainerTier;
}

export const OWNER_PERSONALITIES_WITH_POLICY: OwnerPersonality[] = [
  'Aggressive',
  'Methodical',
  'Showman',
  'Pragmatic',
  'Tactician',
];

/** Maps the 5 owner personalities onto the design's Ruthless/Loyal/Frugal/Prestige archetypes. */
export const TRAIT_POLICY: Record<OwnerPersonality, TraitPolicy> = {
  Aggressive: { cutLiabilityThreshold: 55, trainAppetite: 0.18, ceiling: 'Master' },
  Showman: { cutLiabilityThreshold: 60, trainAppetite: 0.22, ceiling: 'Master' },
  Tactician: { cutLiabilityThreshold: 62, trainAppetite: 0.12, ceiling: 'Seasoned' },
  Pragmatic: { cutLiabilityThreshold: 70, trainAppetite: 0.06, ceiling: 'Seasoned' },
  Methodical: { cutLiabilityThreshold: 78, trainAppetite: 0.1, ceiling: 'Seasoned' },
};

/**
 *
 */
export function policyFor(personality?: OwnerPersonality): TraitPolicy {
  return TRAIT_POLICY[personality ?? 'Pragmatic'];
}
