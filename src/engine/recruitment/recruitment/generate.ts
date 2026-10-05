import { FightingStyle } from '@/types/shared.types';
import { type StyleMeta } from '../../analytics/metaDrift';
import { type WarriorLineage, type Warrior } from '@/types/warrior.types';
import { computeWarriorStats, rollLuckfactor } from '../../warrior/skillCalc';
import { generatePotential } from '../../warrior/potential';
import { generateFavorites } from '../../favorites';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { applyTraitAttrBonuses, generateTraits } from '@/engine/traits';
import type { Archetype } from '@/data/names/archetypeNames';
import { generateWarriorName, generateDynasticWarriorName } from '@/data/names/nameGenerator';
import { STYLE_ARCHETYPE, generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';
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
  legacyCandidates: Warrior[]
): { style: FightingStyle; lineage: WarriorLineage | undefined } {
  // 🧬 Genetic Bloodlines: 5% chance to be a Legacy recruit
  const isLegacy = rng.next() < 0.05 && legacyCandidates.length > 0;
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
}

// Include new origins/traits in generateRecruit() pools. No manual wiring needed due to dynamic nature.
/** Generates a recruit: style/lineage, unique name, stats, lore payload. */
export function generateRecruit(args: GenerateRecruitArgs): PoolWarrior {
  const { rng, usedNames, week, forceTier, meta } = args;
  const { legacyCandidates = [] } = args;
  const tier = forceTier ?? rollTier(rng);
  const { style, lineage } = pickStyleAndLineage(rng, meta, legacyCandidates);

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
  };
}
