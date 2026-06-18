import type { RivalStableData, MetaAdaptation } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { computeWarriorStats, rollLuckfactor } from '@/engine/skillCalc';
import { generateTraits, TRAITS } from '@/engine/traits';
import { generateOrigin, generateLore } from '@/engine/narrative/loreGenerator';
import { STYLE_ARCHETYPE } from '@/engine/factories/statGeneration';
import { ARCHETYPE_NAMES } from '@/data/names/archetypeNames';
import { getPhilosophyStyles } from '@/data/ownerData';
import type { StyleMeta } from '@/engine/metaDrift';

/** Function type for meta-adaptation recruit style pickers. */
type AdaptationStyleFn = (
  philosophyStyles: FightingStyle[],
  favoredStyles: FightingStyle[],
  allStyles: FightingStyle[],
  meta: StyleMeta | undefined,
  rng: IRNGService
) => FightingStyle;

/**
 * Strategy map: each MetaAdaptation maps to a function that picks
 * the recruit's fighting style based on that owner's philosophy.
 * TypeScript will error if a MetaAdaptation variant is missing here.
 */
const ADAPTATION_STYLE_PICKERS: Record<MetaAdaptation, AdaptationStyleFn> = {
  Traditionalist: (philosophyStyles, favoredStyles, _allStyles, _meta, rng) => {
    const pool = favoredStyles.length > 0 ? favoredStyles : philosophyStyles;
    return rng.pick(pool);
  },
  MetaChaser: (philosophyStyles, _favoredStyles, allStyles, meta, rng) => {
    if (meta) {
      const sorted = allStyles.slice().sort((a, b) => (meta[b] ?? 0) - (meta[a] ?? 0));
      return rng.pick(sorted.slice(0, 3));
    }
    return rng.pick(philosophyStyles);
  },
  Innovator: (philosophyStyles, _favoredStyles, allStyles, meta, rng) => {
    if (meta) {
      const sorted = allStyles.slice().sort((a, b) => (meta[a] ?? 0) - (meta[b] ?? 0));
      return rng.pick(sorted.slice(0, 4));
    }
    const nonStandard = allStyles.filter((s) => !philosophyStyles.includes(s));
    return rng.pick(nonStandard);
  },
  Opportunist: (philosophyStyles, favoredStyles, allStyles, meta, rng) => {
    if (meta && rng.next() < 0.5) {
      const rising = allStyles.filter((s) => (meta[s] ?? 0) >= 2);
      if (rising.length > 0) return rng.pick(rising);
    }
    const pool = favoredStyles.length > 0 ? favoredStyles : philosophyStyles;
    return rng.pick(pool);
  },
};

/**
 * Picks a fighting style for a recruit based on owner adaptation and philosophy.
 */
function pickRecruitStyle(
  adaptation: MetaAdaptation,
  philosophy: string,
  favoredStyles: FightingStyle[],
  meta: StyleMeta | undefined,
  rng: IRNGService
): FightingStyle {
  const philosophyStyles = getPhilosophyStyles(philosophy);
  const allStyles = Object.values(FightingStyle);
  const picker = ADAPTATION_STYLE_PICKERS[adaptation] ?? ADAPTATION_STYLE_PICKERS.Opportunist;
  return picker(philosophyStyles, favoredStyles, allStyles, meta, rng);
}

/**
 * Generates base attributes for a recruit based on owner philosophy.
 */
function generateRecruitAttrs(
  philosophy: string,
  rng: IRNGService
): { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number } {
  const biasMap: Record<string, Partial<Record<string, number>>> = {
    'Brute Force': { ST: 3, CN: 2, SZ: 2 },
    'Speed Kills': { SP: 3, DF: 2, WL: 1 },
    'Iron Defense': { CN: 3, WL: 3, SZ: 1 },
    Balanced: { ST: 1, CN: 1, WT: 1, WL: 1, SP: 1, DF: 1 },
    Spectacle: { SP: 2, DF: 2, WL: 2, WT: 1 },
    Cunning: { WT: 3, DF: 2, SP: 2 },
    Endurance: { CN: 3, WL: 3 },
    Specialist: { ST: 2, WT: 2, DF: 2 },
  };
  const bias = biasMap[philosophy] ?? {};
  const attrs = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = 70 - 21;
  const keys: (keyof typeof attrs)[] = ['ST', 'CN', 'SZ', 'WT', 'WL', 'SP', 'DF'];

  const weighted: (keyof typeof attrs)[] = [];
  for (const k of keys) {
    const w = (bias as Record<string, number>)[k] ?? 1;
    for (let i = 0; i < w; i++) weighted.push(k);
  }

  let attempts = 0;
  while (pool > 0 && attempts < 500) {
    attempts++;
    const key = rng.pick(weighted) as keyof typeof attrs;
    const current = attrs[key];
    if (current >= 25) continue;

    const maxAdd = Math.min(pool, 25 - current);
    const add = Math.min(maxAdd, Math.floor(rng.next() * 4) + 1);
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

/**
 * Generates a new warrior for an AI owner's roster.
 */
export function generateAIRecruit(
  rival: RivalStableData,
  week: number,
  meta?: StyleMeta,
  seed?: number
): Warrior | null {
  const rng = new SeededRNGService(seed ?? week * 42 + rival.owner.id.length);
  const philosophy = rival.philosophy ?? 'Balanced';
  const adaptation = rival.owner.metaAdaptation ?? 'Opportunist';
  const favoredStyles = rival.owner.favoredStyles ?? [];

  const style = pickRecruitStyle(adaptation, philosophy, favoredStyles, meta, rng);
  const attrs = generateRecruitAttrs(philosophy, rng);

  // Generate archetype-based traits and name (parity with player recruits)
  const archetype = STYLE_ARCHETYPE[style];
  const traits = generateTraits(rng, archetype);

  // Apply personality attrBonus from traits at recruitment time
  for (const tid of traits) {
    const traitData = TRAITS[tid];
    if (traitData?.effect.attrBonus) {
      for (const [key, bonus] of Object.entries(traitData.effect.attrBonus)) {
        attrs[key as keyof typeof attrs] += bonus as number;
      }
    }
  }

  // Recompute stats after trait attribute bonuses
  const { baseSkills: finalBaseSkills, derivedStats: finalDerivedStats } = computeWarriorStats(
    attrs,
    style
  );

  // Use archetype-based naming like player recruits
  const namePool = [...ARCHETYPE_NAMES[archetype], ...ARCHETYPE_NAMES.tank];
  const name = rng.pick(namePool);

  // Generate origin and lore (parity with player recruits)
  const origin = generateOrigin(rng);
  const lore = generateLore(name, rng);

  return {
    id: rng.uuid('warrior') as import('@/types/shared.types').WarriorId,
    name,
    style,
    attributes: attrs,
    baseSkills: finalBaseSkills,
    luckfactor: rollLuckfactor(rng),
    derivedStats: finalDerivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 17 + Math.floor(rng.next() * 5),
    stableId: rival.id,
    traits,
    origin,
    lore,
  };
}
