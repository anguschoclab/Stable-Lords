import type { RivalStableData, MetaAdaptation } from '@/types/state.types';
import { ATTRIBUTE_MAX, type Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService, hashStr } from '@/utils/random';
import { computeWarriorStats, rollLuckfactor } from '@/engine/warrior/skillCalc';
import { generateTraits, TRAITS } from '@/engine/traits';
import { generateOrigin, generateLore } from '@/engine/narrative/loreGenerator';
import { STYLE_ARCHETYPE, ARCHETYPE_STAT_WEIGHTS } from '@/engine/factories/statGeneration';
import { generateWarriorName } from '@/data/names/nameGenerator';
import { cultureForOwner, cultureForArchetype } from '@/data/names/cultures';
import { getPhilosophyStyles } from '@/data/ownerData';
import type { StyleMeta } from '@/engine/analytics/metaDrift';

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
 * Exported for the balance harness's realistic-population scenario — the
 * guardrail fixture (uniform 15s = 105 pts) does not represent the 70-point
 * philosophy-biased recruits the world actually fields.
 */
export function generateRecruitAttrs(
  philosophy: string,
  rng: IRNGService,
  style?: FightingStyle
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

  // Style-aware blend: the recruit's fighting style mixes its archetype
  // key-stats into the ticket pool alongside the philosophy bias — roughly
  // half the weight (high=3, mid=2, low=1 tickets ≈ 14 style tickets vs
  // ~7–11 philosophy tickets). Style-blind recruits left tank styles (WALL
  // OF STEEL ~31% world win rate) starved of CN/WL/SZ.
  const styleWeights = style ? ARCHETYPE_STAT_WEIGHTS[STYLE_ARCHETYPE[style]] : undefined;
  const styleTickets = (k: keyof typeof attrs): number => {
    if (!styleWeights) return 0;
    if (styleWeights.high.includes(k)) return 3;
    if (styleWeights.mid.includes(k)) return 2;
    return 1;
  };

  const weighted: (keyof typeof attrs)[] = [];
  for (const k of keys) {
    const w = ((bias as Record<string, number>)[k] ?? 1) + styleTickets(k);
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

/** Apply personality attrBonus from traits at recruitment time, clamped to
 * ATTRIBUTE_MAX — development elsewhere respects the cap; recruitment must
 * not overflow it either. */
function applyTraitAttrBonuses(
  attrs: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number },
  traits: string[]
): void {
  for (const tid of traits) {
    const traitData = TRAITS[tid];
    if (traitData?.effect.attrBonus) {
      for (const [key, bonus] of Object.entries(traitData.effect.attrBonus)) {
        const k = key as keyof typeof attrs;
        attrs[k] = Math.min(ATTRIBUTE_MAX, attrs[k] + (bonus as number));
      }
    }
  }
}

/**
 *
 */
export interface GenerateAIRecruitArgs {
  rival: RivalStableData;
  week: number;
  meta?: StyleMeta;
  seed?: number;
  usedNames?: Set<string>;
  usedIds?: Set<string>;
}

/**
 * Generates a new warrior for an AI owner's roster.
 */
export function generateAIRecruit(args: GenerateAIRecruitArgs): Warrior | null {
  const { rival, week, meta, seed, usedNames } = args;
  const { usedIds } = args;
  // `owner.id.length` (~constant) made every stable's same-week fallback
  // recruit share one RNG stream — identical streams mint identical warrior
  // ids. Hash the stable id so each stable gets an independent stream.
  const rng = new SeededRNGService(seed ?? week * 42 + hashStr(rival.id));
  const philosophy = rival.philosophy ?? 'Balanced';
  const adaptation = rival.owner.metaAdaptation ?? 'Opportunist';
  const favoredStyles = rival.owner.favoredStyles ?? [];

  const style = pickRecruitStyle(adaptation, philosophy, favoredStyles, meta, rng);
  const attrs = generateRecruitAttrs(philosophy, rng, style);

  // Generate archetype-based traits and name (parity with player recruits)
  const archetype = STYLE_ARCHETYPE[style];
  const traits = generateTraits(rng, archetype);
  applyTraitAttrBonuses(attrs, traits);

  // Recompute stats after trait attribute bonuses
  const { baseSkills: finalBaseSkills, derivedStats: finalDerivedStats } = computeWarriorStats(
    attrs,
    style
  );

  // Culture-aware naming: the stable's personality shapes recruit names,
  // with the archetype as a secondary influence.
  const name = generateWarriorName({
    rng,
    culture: [
      { culture: cultureForOwner(rival.owner.personality, philosophy), weight: 0.6 },
      { culture: cultureForArchetype(archetype), weight: 0.4 },
    ],
    usedNames,
  });

  // Generate origin and lore (parity with player recruits)
  const origin = generateOrigin(rng);
  const lore = generateLore(name, rng);

  let id = rng.uuid('warrior') as import('@/types/shared.types').WarriorId;
  while (usedIds?.has(id)) id = rng.uuid('warrior') as typeof id;
  usedIds?.add(id);

  return {
    id,
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
