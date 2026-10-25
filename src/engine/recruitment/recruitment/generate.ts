import { FightingStyle } from '@/types/shared.types';
import { type StyleMeta } from '../../analytics/metaDrift';
import { type WarriorLineage, type Warrior } from '@/types/warrior.types';
import { computeWarriorStats, rollBloodlust, rollLuckfactor } from '../../warrior/skillCalc';
import { generatePotential } from '../../warrior/potential';
import { generateFavorites } from '../../favorites';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { applyTraitAttrBonuses, generateTraits } from '@/engine/traits';
import type { Archetype } from '@/data/names/archetypeNames';
import { generateWarriorName, generateDynasticWarriorName } from '@/data/names/nameGenerator';
import { STYLE_ARCHETYPE, generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';
import { ATTRIBUTE_MIN } from '@/types/shared.types';
import { TIER_COST, type PoolWarrior, type RecruitTier } from './types';

// Names come from the procedural generator (src/data/names/nameGenerator.ts);
// the narrative recruitment corpus is folded into the 'common' culture.

/**
 * Randomly rolls a recruitment tier based on predefined probabilities.
 * 5% chance for Prodigy, 15% for Exceptional, 30% for Promising, 50% for Common.
 *
 * @param rng - RNG service for random generation
 * @returns The rolled RecruitTier
 */
function rollTier(rng: IRNGService): RecruitTier {
  if (rng.next() < 0.05) return 'Prodigy';
  if (rng.next() < 0.2) return 'Exceptional';
  if (rng.next() < 0.5) return 'Promising';
  return 'Common';
}

/**
 * Pick the recruit's style + optional bloodline lineage. Consumes RNG draws in
 * the original order: legacy roll → parent/style pick.
 */
function pickStyleAndLineage(
  rng: IRNGService,
  meta: StyleMeta | undefined,
  legacyCandidates: Warrior[],
  legacyChance = 0.05
): { style: FightingStyle; lineage: WarriorLineage | undefined } {
  // 🧬 Genetic Bloodlines: small chance to be a Legacy recruit — boosted when
  // retired veterans mentor the next intake (see RecruitmentPass).
  const isLegacy = rng.next() < legacyChance && legacyCandidates.length > 0;
  if (isLegacy) {
    const parent = rng.pick(legacyCandidates);
    return {
      style: parent.style,
      lineage: {
        parentId: parent.id,
        generation: (parent.lineage?.generation ?? 1) + 1,
        pedigree: parent.fame > 2000 ? 'Noble Blood' : 'Legacy',
        mentorName: parent.name,
      },
    };
  }
  if (meta) {
    // ⚡ Institutional Style Drift: Bias toward current meta
    const stylesByWeight: FightingStyle[] = [];
    for (const s of Object.values(FightingStyle)) {
      const drift = meta[s] ?? 0;
      const weight = Math.max(1, 5 + drift); // Scale drift (-10..10) to weights (1..15)
      for (let w = 0; w < weight; w++) stylesByWeight.push(s);
    }
    return { style: rng.pick(stylesByWeight), lineage: undefined };
  }
  return { style: rng.pick(Object.values(FightingStyle)), lineage: undefined };
}

/** Pick a unique archetype-cultured name; legacy recruits get dynastic names. */
function pickRecruitName(
  rng: IRNGService,
  archetype: Archetype,
  usedNames: Set<string>,
  lineage?: WarriorLineage
): string {
  const name = lineage?.mentorName
    ? generateDynasticWarriorName(lineage.mentorName, { rng, usedNames })
    : generateWarriorName({ rng, archetype, usedNames });
  usedNames.add(name);
  return name;
}

/**
 *
 */
interface GenerateRecruitArgs {
  rng: IRNGService;
  usedNames: Set<string>;
  week: number;
  forceTier?: RecruitTier;
  meta?: StyleMeta;
  legacyCandidates?: Warrior[];
  /** Override the 5% base legacy-bloodline roll (mentor-boosted weeks). */
  legacyChance?: number;
}

// Include new origins/traits in generateRecruit() pools. No manual wiring needed due to dynamic nature.
/** Generates a recruit: style/lineage, unique name, stats, lore payload. */
export function generateRecruit(args: GenerateRecruitArgs): PoolWarrior {
  const { rng, usedNames, week, forceTier, meta, legacyChance } = args;
  const { legacyCandidates = [] } = args;
  const tier = forceTier ?? rollTier(rng);
  const { style, lineage } = pickStyleAndLineage(rng, meta, legacyCandidates, legacyChance);

  const archetype = STYLE_ARCHETYPE[style];
  const attributes = generateArchetypeAttrs(style, rng);

  // Trait generation — unified TRAITS registry with archetype-aware weighting.
  // Uses snake_case IDs that the combat engine (traits.ts) recognises.
  const traits = generateTraits(rng, archetype);

  // Apply personality attrBonus from traits at recruitment time
  applyTraitAttrBonuses(attributes, traits);

  // Pick unique name based on Archetype — legacy recruits take dynastic names
  const name = pickRecruitName(rng, archetype, usedNames, lineage);

  const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
  const potential = generatePotential(attributes, tier, rng);
  const favorites = generateFavorites(style, rng);
  const originStr = generateOrigin(rng);
  const loreStr = generateLore(name, rng);

  return {
    id: rng.uuid(),
    name,
    style,
    attributes,
    potential,
    baseSkills,
    luckfactor: rollLuckfactor(rng),
    bloodlust: rollBloodlust(rng),
    derivedStats,
    tier,
    cost: TIER_COST[tier],
    age: 16 + Math.floor(rng.next() * 6),
    lore: loreStr,
    origin: originStr,
    traits,
    addedWeek: week,
    favorites,
    lineage,
    source: 'orphanage',
    avatarSeed: Math.floor(rng.next() * 1000000),
  };
}

/**
 * Academy apprentice intake — the same recipe as generateRecruit, but the
 * cadet is younger (14–16), rolls each attribute 2 points lighter (floored
 * at ATTRIBUTE_MIN), prices at three quarters of the open-market tier cost,
 * and — for Common cadets — carries Promising potential headroom (an
 * academy shapes raw kids further than their intake numbers suggest).
 * Consumes the same RNG draw sequence as generateRecruit.
 */
export function generateApprentice(args: GenerateRecruitArgs): PoolWarrior {
  const { rng, usedNames, week, forceTier, meta, legacyChance } = args;
  const { legacyCandidates = [] } = args;
  const tier = forceTier ?? rollTier(rng);
  const { style, lineage } = pickStyleAndLineage(rng, meta, legacyCandidates, legacyChance);

  const archetype = STYLE_ARCHETYPE[style];
  const attributes = generateArchetypeAttrs(style, rng);

  const traits = generateTraits(rng, archetype);
  applyTraitAttrBonuses(attributes, traits);
  for (const key of Object.keys(attributes) as (keyof typeof attributes)[]) {
    attributes[key] = Math.max(ATTRIBUTE_MIN, attributes[key] - 2);
  }

  const name = pickRecruitName(rng, archetype, usedNames, lineage);

  const { baseSkills, derivedStats } = computeWarriorStats(attributes, style);
  // Common cadets get Promising headroom — academies grow raw material.
  const potential = generatePotential(attributes, tier === 'Common' ? 'Promising' : tier, rng);
  const favorites = generateFavorites(style, rng);
  const originStr = generateOrigin(rng);
  const loreStr = generateLore(name, rng);

  return {
    id: rng.uuid(),
    name,
    style,
    attributes,
    potential,
    baseSkills,
    luckfactor: rollLuckfactor(rng),
    bloodlust: rollBloodlust(rng),
    derivedStats,
    tier,
    cost: Math.floor(TIER_COST[tier] * 0.75),
    age: 14 + Math.floor(rng.next() * 3),
    lore: loreStr,
    origin: originStr,
    traits,
    addedWeek: week,
    favorites,
    lineage,
    source: 'apprentice',
    avatarSeed: Math.floor(rng.next() * 1000000),
  };
}
