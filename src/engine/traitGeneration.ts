/**
 * Trait Generation - rolling birth traits for new warriors.
 * Extracted from traits.ts for SRP separation.
 */
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Archetype } from '@/data/names/archetypeNames';
import type { FightingStyle } from '@/types/shared.types';
import {
  TRAIT_SYNERGY_MULTIPLIER,
  TRAIT_ANTI_SYNERGY_MULTIPLIER,
  BIRTH_BLANK_CHANCE,
  BIRTH_FLAW_CHANCE,
} from '@/constants/combat/combat';
import { TRAITS, type TraitDef, type TraitTier } from './traitDefs';

/** Class traits available to a given fighting style. */
export function traitsForStyle(style: FightingStyle): TraitDef[] {
  return Object.values(TRAITS).filter((t) => t.styles?.includes(style));
}

/** All traits of a given tier. */
export function traitsByTier(tier: TraitTier): TraitDef[] {
  return Object.values(TRAITS).filter((t) => t.tier === tier);
}

/**
 *
 */

const TRAIT_IDS = Object.keys(TRAITS) as TraitId[];

/**
 * Roll birth traits for a newly created warrior.
 *
 * Sparse distribution: ~68% blank, ~7% a single Flaw, ~25% one generic
 * Common/Notable positive trait. Exceptional/Signature and class-restricted
 * traits are never granted at birth — they are earned through training.
 *
 * When an archetype is provided, traits with matching synergy get a weight
 * multiplier and anti-synergy traits are suppressed, biasing the positive
 * pick toward the fighter's identity without leaking cross-style noise.
 *
 * @param rng - RNG service
 * @param archetype - Optional archetype to bias trait generation
 * @returns An array of trait IDs (0 or 1)
 */
export function generateTraits(rng: IRNGService, archetype?: Archetype): string[] {
  const roll = rng.next();
  if (roll < BIRTH_BLANK_CHANCE) return [];

  const wantFlaw = roll < BIRTH_BLANK_CHANCE + BIRTH_FLAW_CHANCE;

  const eligible = TRAIT_IDS.filter((id) => {
    const t = TRAITS[id];
    if (!t) return false;
    if (wantFlaw) return t.tier === 'Flaw';
    return t.sign === 'positive' && !t.styles && (t.tier === 'Common' || t.tier === 'Notable');
  });
  if (eligible.length === 0) return [];

  let total = 0;
  const weights: { id: string; w: number }[] = [];
  for (const id of eligible) {
    const t = TRAITS[id];
    if (!t) continue;
    let w = t.weight;
    if (archetype) {
      if (t.synergy?.includes(archetype)) w *= TRAIT_SYNERGY_MULTIPLIER;
      if (t.antiSynergy?.includes(archetype)) w *= TRAIT_ANTI_SYNERGY_MULTIPLIER;
    }
    weights.push({ id, w });
    total += w;
  }

  let target = rng.next() * total;
  for (const { id, w } of weights) {
    target -= w;
    if (target <= 0) return [id];
  }
  return [];
}
