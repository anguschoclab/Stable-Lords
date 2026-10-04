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
import { TRAITS } from './registry';
import type { TraitDef, TraitTier } from './types';

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
export type TraitId = keyof typeof TRAITS;
const TRAIT_IDS = Object.keys(TRAITS) as TraitId[];

/**
 * Archetype → trait-id indexes, built once from the static registry so the
 * birth-roll weighting loop never scans each def's synergy arrays.
 */
const ARCHETYPE_INDEXES = (() => {
  const synergy = new Map<Archetype, Set<TraitId>>();
  const antiSynergy = new Map<Archetype, Set<TraitId>>();
  for (const id of TRAIT_IDS) {
    const t = TRAITS[id];
    for (const a of t?.synergy ?? []) {
      let s = synergy.get(a);
      if (!s) synergy.set(a, (s = new Set()));
      s.add(id);
    }
    for (const a of t?.antiSynergy ?? []) {
      let s = antiSynergy.get(a);
      if (!s) antiSynergy.set(a, (s = new Set()));
      s.add(id);
    }
  }
  return { synergy, antiSynergy };
})();

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
      if (ARCHETYPE_INDEXES.synergy.get(archetype)?.has(id)) w *= TRAIT_SYNERGY_MULTIPLIER;
      if (ARCHETYPE_INDEXES.antiSynergy.get(archetype)?.has(id)) w *= TRAIT_ANTI_SYNERGY_MULTIPLIER;
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
