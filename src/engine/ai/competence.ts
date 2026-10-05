/**
 * Owner competence — the quality axis (Stage B).
 *
 * Orthogonal to personality (what a stable wants) and metaAdaptation (how it
 * adapts): competence scales the *error term* in AI decision scoring — a
 * Novice reads plans noisily, misevaluates recruits, under-reserves cash,
 * and carries thinner adaptive plans than a Master. It never changes which
 * choices are available; the choice vocabulary stays personality-shaped.
 *
 * `competenceQuality` is the single knob every worker consumes; callers that
 * already key a quality table on personality blend via `blendQuality` (the
 * mean, so a Master of a weaker personality can out-perform a Novice of a
 * stronger one — competence matters as much as temperament).
 */
import type { Owner, OwnerCompetence } from '@/types/state/owner';
import { OWNER_COMPETENCES } from '@/types/enumSources';
import { hashStr } from '@/utils/random';
import { clamp } from '@/utils/math';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/** Decision-quality by tier — mirrors the SCOUT_QUALITY personality table. */
export const COMPETENCE_QUALITY: Record<OwnerCompetence, number> = {
  Novice: 0.3,
  Journeyman: 0.55,
  Veteran: 0.75,
  Master: 0.9,
};

/** The owner's competence tier; worlds that predate the field default mid. */
export function competenceOf(owner?: Pick<Owner, 'competence'> | null): OwnerCompetence {
  return owner?.competence ?? 'Journeyman';
}

/** 0..1 decision-quality score for the owner. */
export function competenceQuality(owner?: Pick<Owner, 'competence'> | null): number {
  return COMPETENCE_QUALITY[competenceOf(owner)];
}

/**
 * Blend a personality-scaled quality with competence — arithmetic mean, so a
 * Master Pragmatic out-reads a Novice Tactician while personality ordering
 * still matters at equal tier. Inert (returns the personality quality) when
 * competence is unset.
 */
export function blendQuality(
  personalityQuality: number,
  owner?: Pick<Owner, 'competence'> | null
): number {
  if (owner?.competence == null) return personalityQuality;
  return (personalityQuality + competenceQuality(owner)) / 2;
}

/**
 * Deterministic noise scaled by tier — the hash-jitter idiom intelWorker
 * already uses, generalized. `hashJitter ∈ [-1,1]` is keyed on
 * `ownerId|salt`, then multiplied by `(1 - quality) × baseSpread`, so a
 * Novice's error strictly dominates a Master's for any nonzero hash.
 *
 * Absent competence is INERT (0) — not Journeyman noise. Owners that never
 * carried the field (fixtures, un-migrated state) behave exactly as they
 * did before the axis landed; only an explicit tier wobbles.
 */
export function competenceJitter(
  owner: Pick<Owner, 'id' | 'competence'> | undefined,
  salt: string,
  baseSpread: number
): number {
  if (owner?.competence == null) return 0;
  const id = owner?.id ?? 'unknown';
  const hashJitter = ((hashStr(`${id}|${salt}`) % 1000) / 1000 - 0.5) * 2;
  return hashJitter * (1 - competenceQuality(owner)) * baseSpread;
}

/**
 * Reserve multiplier for budget checks — Novices keep thinner cash buffers
 * (down to 0.82×), Masters over-reserve (1.06×). Inert (×1) when competence
 * is unset.
 */
export function competenceReserveScale(owner?: Pick<Owner, 'competence'> | null): number {
  if (owner?.competence == null) return 1;
  return 0.7 + 0.4 * competenceQuality(owner);
}

/**
 * Adaptive-condition ceiling multiplier — Novices carry fewer adaptive
 * branches into a bout (same shape as the existing WIT-gated cap). Inert
 * (returns `authored`) when competence is unset.
 */
export function competenceConditionCap(
  owner: Pick<Owner, 'competence'> | undefined,
  authored: number,
  floor: number
): number {
  if (owner?.competence == null) return authored;
  return floor + Math.floor((authored - floor) * competenceQuality(owner));
}

// ─── Generation / inheritance ────────────────────────────────────────────

/** Per-stable-tier competence weights — Masters are rare outside elite stables. */
const TIER_COMPETENCE_WEIGHTS: Record<
  'Minor' | 'Established' | 'Major' | 'Legendary',
  [number, number, number, number]
> = {
  Minor: [45, 40, 12, 3],
  Established: [25, 40, 25, 10],
  Major: [10, 30, 40, 20],
  Legendary: [0, 15, 45, 40],
};

/** Weighted competence roll for factory minting. */
export function rollCompetence(
  rng: Pick<IRNGService, 'next'>,
  tier: 'Minor' | 'Established' | 'Major' | 'Legendary' = 'Established'
): OwnerCompetence {
  const w = TIER_COMPETENCE_WEIGHTS[tier];
  const total = w[0] + w[1] + w[2] + w[3];
  let roll = rng.next() * total;
  for (const [i, competence] of OWNER_COMPETENCES.entries()) {
    roll -= w[i] ?? 0;
    if (roll < 0) return competence;
  }
  return 'Journeyman';
}

/**
 * Succession drift — the heir is at most one tier removed from the
 * predecessor (dynasties evolve, they don't reroll wholesale).
 */
export function driftCompetence(
  prior: OwnerCompetence | undefined,
  rng: Pick<IRNGService, 'next'>
): OwnerCompetence {
  if (!prior) return rollCompetence(rng);
  const idx = OWNER_COMPETENCES.indexOf(prior);
  const roll = rng.next();
  const delta = roll < 0.5 ? 0 : roll < 0.75 ? -1 : 1;
  return OWNER_COMPETENCES[clamp(idx + delta, 0, OWNER_COMPETENCES.length - 1)] ?? prior;
}
