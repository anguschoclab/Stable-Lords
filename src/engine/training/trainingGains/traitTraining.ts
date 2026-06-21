import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import type { Trainer, TrainerTier } from '@/types/shared.types';
import { TRAITS, type TraitDef, type TraitTier } from '@/engine/traits';

export const TRAIT_TRAIN_WEEKS = 4;
export const TRAIT_CAP = 3;

const CEILING: Record<TrainerTier, TraitTier> = {
  Novice: 'Notable',
  Seasoned: 'Exceptional',
  Master: 'Signature',
};
const TIER_ORDER: TraitTier[] = ['Common', 'Notable', 'Exceptional', 'Signature'];

/** Directly contradictory pairs — a conflict blocks acquisition. */
const CONFLICT_GROUPS: string[][] = [
  ['quick', 'slow'],
  ['agile', 'fragile'],
  ['aggressive', 'evasive', 'sturdy', 'timid', 'coward'],
  ['heavy_handed', 'clumsy'],
];

export function traitTrainingCeiling(tier: TrainerTier): TraitTier {
  return CEILING[tier];
}

const withinCeiling = (t: TraitDef, ceiling: TraitTier) =>
  t.tier !== 'Flaw' && TIER_ORDER.indexOf(t.tier) <= TIER_ORDER.indexOf(ceiling);

/** Positive traits a session can yield: generic + the warrior's class traits, ≤ ceiling, not owned. */
export function traitTrainingPool(warrior: Warrior, trainer: Trainer): TraitDef[] {
  const ceiling = traitTrainingCeiling(trainer.tier);
  const owned = new Set(warrior.traits ?? []);
  return Object.values(TRAITS).filter((t) => {
    if (owned.has(t.id) || t.sign !== 'positive' || !withinCeiling(t, ceiling)) return false;
    if (t.styles) return t.styles.includes(warrior.style);
    return true;
  });
}

const isPersonality = (id: string) => !!TRAITS[id]?.effect?.fightPlanMod;

export function conflictsWith(traitId: string, existing: string[]): boolean {
  return CONFLICT_GROUPS.some((g) => g.includes(traitId) && existing.some((e) => g.includes(e)));
}

/** Cap, single-personality, and conflict gating. */
export function canAcquireTrait(warrior: Warrior, traitId: string): boolean {
  const traits = warrior.traits ?? [];
  if (traits.length >= TRAIT_CAP) return false;
  if (traits.includes(traitId)) return false;
  if (isPersonality(traitId) && traits.some(isPersonality)) return false;
  if (conflictsWith(traitId, traits)) return false;
  return true;
}

function aptitude(warrior: Warrior, _trainer: Trainer): number {
  const a = warrior.attributes;
  const mind = (a.WT + a.WL) / 50;
  const youth = Math.max(0, (30 - (warrior.age ?? 24)) / 30);
  const train = warrior.trainability ?? 0.6;
  return mind * 0.4 + youth * 0.3 + train * 0.3;
}

const TIER_DIFFICULTY: Record<TraitTier, number> = {
  Common: 0,
  Notable: 0.1,
  Exceptional: 0.25,
  Signature: 0.4,
  Flaw: 0,
};

/** Resolve a completed trait-training session. Pure given the rng. */
export function rollTraitTraining(
  warrior: Warrior,
  trainer: Trainer,
  rng: IRNGService
): { outcome: 'success' | 'none' | 'botch'; traitId?: string } {
  const pool = traitTrainingPool(warrior, trainer).filter((t) => canAcquireTrait(warrior, t.id));
  if (pool.length === 0) return { outcome: 'none' };

  const candidate = pickWeighted(pool, rng);
  const apt = aptitude(warrior, trainer);
  const successChance = Math.max(
    0.05,
    Math.min(0.9, 0.35 + apt * 0.5 - TIER_DIFFICULTY[candidate.tier])
  );
  const botchChance = Math.max(
    0.02,
    Math.min(0.4, 0.2 - apt * 0.15 + TIER_DIFFICULTY[candidate.tier])
  );

  const r = rng.next();
  if (r < successChance) return { outcome: 'success', traitId: candidate.id };
  if (r > 1 - botchChance) {
    const flaws = Object.values(TRAITS).filter(
      (t) => t.tier === 'Flaw' && canAcquireTrait(warrior, t.id)
    );
    if (flaws.length === 0) return { outcome: 'none' };
    return { outcome: 'botch', traitId: pickWeighted(flaws, rng).id };
  }
  return { outcome: 'none' };
}

function pickWeighted(pool: TraitDef[], rng: IRNGService): TraitDef {
  const tierFactor: Record<TraitTier, number> = {
    Common: 1,
    Notable: 0.7,
    Exceptional: 0.4,
    Signature: 0.2,
    Flaw: 1,
  };
  let total = 0;
  const w = pool.map((t) => {
    const x = (t.weight ?? 0.5) * tierFactor[t.tier];
    total += x;
    return x;
  });
  let target = rng.next() * total;
  for (let i = 0; i < pool.length; i++) {
    target -= w[i]!;
    if (target <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}
