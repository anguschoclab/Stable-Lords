/**
 * Dynamic Orphanage Pool Generator
 * Generates randomized orphan warriors with thematic names, backstories,
 * personality traits, ages, and style-appropriate attribute spreads.
 *
 * Orphans are first-class PoolWarriors now — the orphanage is one intake
 * channel of the unified recruitment supply chain, so every signing path
 * (FTUE pick, recruit page, AI draft) converts them through the same funnel.
 */
import { FightingStyle } from '@/types/game';
import type { PoolWarrior } from '@/engine/recruitment/recruitment';
import { TIER_COST, type RecruitTier } from '@/engine/recruitment/recruitment/types';
import { generatePotential } from '@/engine/warrior/potential';
import { computeWarriorStats, rollLuckfactor } from '@/engine/warrior/skillCalc';
import { generateFavorites } from '@/engine/favorites';
import { applyTraitAttrBonuses, TRAITS } from '@/engine/traits';
import { generateWarriorName } from '@/data/names/nameGenerator';
import { cultureForArchetype } from '@/data/names/cultures';
import { STYLE_ARCHETYPE, generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';
import { SeededRNG } from '@/utils/random';

/** Orphan recruits are PoolWarriors — kept as a named alias at the seam. */
export type OrphanWarrior = PoolWarrior;

// ── RNG & Helpers ────────────────────────────────────────────────────────

const TRAIT_IDS = Object.keys(TRAITS);

// ── Generation Logic ─────────────────────────────────────────────────────

/**
 * Generate orphan pool — deterministic per seed (default 1001). Each orphan
 * is built from an independent stream (seed + i * 7919) so pool order and
 * rerolls never shift a sibling's build, and `usedNames` lets callers seed
 * name collisions away.
 */
export function generateOrphanPool(
  count: number = 8,
  seed: number = 1001,
  usedNames?: Set<string>
): OrphanWarrior[] {
  const nameSet = new Set(usedNames ?? []);
  const styles = Object.values(FightingStyle);
  const pool: OrphanWarrior[] = [];

  for (let i = 0; i < count; i++) {
    const rng = new SeededRNG(seed + i * 7919);
    const style = rng.pick(styles);
    const archetype = STYLE_ARCHETYPE[style];

    // Orphans blend gutter-stock naming with their archetype's culture.
    const name = generateWarriorName({
      rng,
      culture: [
        { culture: 'lowborn', weight: 0.5 },
        { culture: cultureForArchetype(archetype), weight: 0.5 },
      ],
      usedNames: nameSet,
    });
    nameSet.add(name);

    const age = Math.floor(rng.next() * 5) + 15;
    const attributes = generateArchetypeAttrs(style, rng);
    const origin = generateOrigin(rng);
    const trait = rng.pick(TRAIT_IDS);
    const lore = generateLore(name, rng);

    // Orphan intake rarity — leaner than the open market's rollTier.
    const rarityRoll = rng.next();
    let tier: RecruitTier = 'Common';
    if (rarityRoll > 0.99) tier = 'Prodigy';
    else if (rarityRoll > 0.95) tier = 'Exceptional';
    else if (rarityRoll > 0.82) tier = 'Promising';

    const traits = [trait];
    applyTraitAttrBonuses(attributes, traits);

    const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
    const potential = generatePotential(attributes, tier, rng);

    pool.push({
      id: rng.uuid('orphan'),
      name,
      style,
      attributes,
      potential,
      baseSkills,
      derivedStats,
      tier,
      cost: TIER_COST[tier],
      age,
      lore,
      origin,
      traits,
      addedWeek: 1,
      favorites: generateFavorites(style, rng),
      luckfactor: rollLuckfactor(rng),
      source: 'orphanage',
      avatarSeed: Math.floor(rng.next() * 1000000),
    });
  }

  return pool;
}

// Re-export TRAITS as TRAIT_DATA for UI components (WarriorCard tooltip)
export { TRAITS as TRAIT_DATA };
