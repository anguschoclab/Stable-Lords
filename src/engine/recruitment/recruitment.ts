import {
  FightingStyle,
  type Attributes,
  type BaseSkills,
  type DerivedStats,
  type WarriorId,
} from '@/types/shared.types';
import { type StyleMeta } from '../analytics/metaDrift';
import {
  type AttributePotential,
  type CareerRecord,
  type WarriorFavorites,
  type WarriorLineage,
  type Warrior,
} from '@/types/warrior.types';
import { computeWarriorStats, rollLuckfactor } from '../warrior/skillCalc';
import { generatePotential } from '../warrior/potential';
import { generateFavorites } from '../favorites';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { narrativeContent } from '@/data/narrative';
import type { NarrativeContent } from '@/types/narrative.types';
import { applyTraitAttrBonuses, generateTraits } from '@/engine/traits';
import type { Archetype } from '@/data/names/archetypeNames';
import { generateWarriorName, generateDynasticWarriorName } from '@/data/names/nameGenerator';
import { STYLE_ARCHETYPE, generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { generateLore, generateOrigin } from '@/engine/narrative/loreGenerator';
import { clamp } from '@/utils/math';
import {
  RECRUIT_POOL_MIN,
  RECRUIT_POOL_PER_STABLE,
  FREE_AGENT_SHELF_WEEKS,
  WORLD_RIVAL_FLOOR,
} from '@/constants/world';
import { computeWarriorLiability } from '@/engine/warrior/warriorValue';

// NARRATIVE AUDIT 2026: Origin string generation and lore traits are dynamically sourced from registries. No manual wiring needed for new additions to populate AI stable pools and scouting reports.
/**
 * Recruit tier type.
 */

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Recruit tier type.
 */
export type RecruitTier = 'Common' | 'Promising' | 'Exceptional' | 'Prodigy';

/**
 * Defines the shape of pool warrior.
 */
export interface PoolWarrior {
  id: string;
  name: string;
  style: FightingStyle;
  attributes: Attributes;
  potential: AttributePotential;
  baseSkills: BaseSkills;
  derivedStats: DerivedStats;
  tier: RecruitTier;
  cost: number;
  age: number;
  lore: string;
  origin?: string;
  traits: string[];
  addedWeek: number;
  favorites: WarriorFavorites;
  lineage?: WarriorLineage;
  luckfactor: BaseSkills;
  /**
   * Present when this pool entry is a displaced roster veteran — a warrior
   * whose stable dissolved (bankruptcy, seasonal churn). Signing paths must
   * preserve identity and career instead of minting a fresh prospect.
   */
  veteran?: {
    fame: number;
    popularity: number;
    career: CareerRecord;
    titles: string[];
  };
  /** Academy stable that gets first look at this intake recruit. */
  academyStableId?: string;
  /** Absolute week the academy first-look claim expires. */
  academyClaimExpiryWeek?: number;
  /** Weeks left before a free agent leaves the market (veteran entries only). */
  shelfWeeksRemaining?: number;
  /** Where this recruit entered the supply chain — diagnostics + AI routing. */
  source?: 'orphanage' | 'academy' | 'freeAgent' | 'generated';
}

// ─── Constants ────────────────────────────────────────────────────────────

// TIER data is now fetched from narrative domain files

/**
 * Tier_cost.
 */
export const TIER_COST: Record<RecruitTier, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment.tiers.Common?.cost ?? 0,
  Promising: (narrativeContent as NarrativeContent).recruitment.tiers.Promising?.cost ?? 0,
  Exceptional: (narrativeContent as NarrativeContent).recruitment.tiers.Exceptional?.cost ?? 0,
  Prodigy: (narrativeContent as NarrativeContent).recruitment.tiers.Prodigy?.cost ?? 0,
};

/**
 * Tier_stars.
 */
export const TIER_STARS: Record<RecruitTier, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment.tiers.Common?.stars ?? 0,
  Promising: (narrativeContent as NarrativeContent).recruitment.tiers.Promising?.stars ?? 0,
  Exceptional: (narrativeContent as NarrativeContent).recruitment.tiers.Exceptional?.stars ?? 0,
  Prodigy: (narrativeContent as NarrativeContent).recruitment.tiers.Prodigy?.stars ?? 0,
};

/**
 * Refresh_cost.
 */
const REFRESH_COST = 50;

/**
 * Recruit-pool depth scales with the living world: half a slot per stable,
 * floored at RECRUIT_POOL_MIN. A 90-stable world seeds ~45; a mature
 * 160-stable world holds ~80.
 */
export function computeRecruitPoolSize(stableCount: number): number {
  return Math.max(RECRUIT_POOL_MIN, Math.round(stableCount * RECRUIT_POOL_PER_STABLE));
}

/** Pool hard cap — ×3 headroom for death/academy bonuses without runaway growth. */
export function computeRecruitPoolHardCap(stableCount: number): number {
  return computeRecruitPoolSize(stableCount) * 3;
}

/**
 * Default pool size — floor-scaled. Kept for existing callers/tests; new code
 * should prefer `computeRecruitPoolSize(stableCount)`.
 */
const DEFAULT_POOL_SIZE = computeRecruitPoolSize(WORLD_RIVAL_FLOOR);
export { REFRESH_COST, DEFAULT_POOL_SIZE };

/** Signing price for a free-agent veteran — fame-driven, bounded, flaw-adjusted. */
export function computeFreeAgentCost(w: Warrior): number {
  const fameCost = (w.fame ?? 0) * 10;
  const liability = computeWarriorLiability(w).score;
  // Flaw-loaded veterans cost less to sign (they carry risk the buyer absorbs).
  const liabilityDiscount = Math.round(fameCost * (liability / 200));
  return clamp(fameCost - liabilityDiscount, 50, 500);
}

/**
 * Weeks of pool presence an academy-claimed recruit reserves for its stable —
 * half the free-agent shelf so claims don't hold orphans hostage all season.
 */
export const ACADEMY_CLAIM_WEEKS = Math.ceil(FREE_AGENT_SHELF_WEEKS / 2);

// Names come from the procedural generator (src/data/names/nameGenerator.ts);
// the narrative recruitment corpus is folded into the 'common' culture.

// Removed manual seededRng implementation in favor of utils/random

// ─── Generation ───────────────────────────────────────────────────────────

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
 * Generates a single recruit for the pool.
 *
 * @param rng - RNG service for random generation
 * @param usedNames - Set of names already in use to ensure uniqueness
 * @param week - Current game week
 * @param forceTier - Optional tier to force for the recruit
 * @param meta - Optional style meta for institutional drift
 * @param legacyCandidates - Optional list of former warriors for lineage generation
 * @returns A new PoolWarrior object
 */
/**
 * Pick the recruit's style + optional bloodline lineage. Consumes RNG draws in
 * the original order: legacy roll → parent/style pick.
 */
function pickStyleAndLineage(
  rng: IRNGService,
  meta: StyleMeta | undefined,
  legacyCandidates: import('@/types/warrior.types').Warrior[]
): { style: FightingStyle; lineage: import('@/types/warrior.types').WarriorLineage | undefined } {
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
export interface GenerateRecruitArgs {
  rng: IRNGService;
  usedNames: Set<string>;
  week: number;
  forceTier?: RecruitTier;
  meta?: StyleMeta;
  legacyCandidates?: import('@/types/warrior.types').Warrior[];
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

/**
 *
 */
export interface GenerateRecruitPoolArgs {
  count?: number;
  week: number;
  usedNames: Set<string>;
  rng?: IRNGService;
  meta?: StyleMeta;
  legacyCandidates?: import('@/types/warrior.types').Warrior[];
}

// ─── Pool Management ──────────────────────────────────────────────────────

/**
 * Generates a full pool of recruits.
 *
 * @param args.count - Number of recruits to generate
 * @param args.week - Current game week
 * @param args.usedNames - Set of names already in use
 * @param args.rng - Optional RNG service
 * @param args.meta - Optional style meta
 * @param args.legacyCandidates - Optional list of former warriors
 * @returns An array of generated PoolWarriors
 */
export function generateRecruitPool(args: GenerateRecruitPoolArgs): PoolWarrior[] {
  const { count = DEFAULT_POOL_SIZE, week, usedNames, rng, meta } = args;
  const { legacyCandidates = [] } = args;
  const rngService = resolveRng(rng, week * 9973 + 42);
  const pool: PoolWarrior[] = [];

  // Guarantee at least two Promising+ warriors in a larger pool
  pool.push(
    generateRecruit(
      { rng: rngService, usedNames: usedNames, week: week, forceTier: rngService.next() < 0.3 ? 'Exceptional' : 'Promising', meta: meta, legacyCandidates: legacyCandidates }
    )
  );
  pool.push(
    generateRecruit(
      { rng: rngService, usedNames: usedNames, week: week, forceTier: rngService.next() < 0.1 ? 'Prodigy' : 'Promising', meta: meta, legacyCandidates: legacyCandidates }
    )
  );

  while (pool.length < count) {
    pool.push(generateRecruit({ rng: rngService, usedNames: usedNames, week: week, forceTier: undefined, meta: meta, legacyCandidates: legacyCandidates }));
  }

  return pool;
}

/**
 *
 */
export interface PartialRefreshPoolArgs {
  currentPool: PoolWarrior[];
  week: number;
  usedNames: Set<string>;
  rng?: IRNGService;
  meta?: StyleMeta;
  legacyCandidates?: import('@/types/warrior.types').Warrior[];
  stableCount?: number;
}

/** Partial weekly refresh — replace the oldest slice, then top up to the
 *  world-scaled target size. */
export function partialRefreshPool(args: PartialRefreshPoolArgs): PoolWarrior[] {
  const { currentPool, week, usedNames, rng, meta } = args;
  const { legacyCandidates = [], stableCount = WORLD_RIVAL_FLOOR } = args;
  const targetSize = computeRecruitPoolSize(stableCount);
  if (currentPool.length === 0)
    return generateRecruitPool({ count: targetSize, week: week, usedNames: usedNames, rng: rng, meta: meta, legacyCandidates: legacyCandidates });

  const sorted = [...currentPool].sort((a, b) => a.addedWeek - b.addedWeek);
  // Spec §3.4 cadence: a sixth of the pool turns over each week.
  const removeCount = Math.max(2, Math.ceil(targetSize / 6));
  const remaining = sorted.slice(removeCount);

  // Rebuild used names from remaining
  const remainingNames = new Set(remaining.map((w) => w.name));
  const allUsed = new Set([...usedNames, ...remainingNames]);

  const rngService = resolveRng(rng, week * 7919 + 31);
  const newWarriors: PoolWarrior[] = [];
  for (let i = 0; i < removeCount; i++) {
    newWarriors.push(generateRecruit({ rng: rngService, usedNames: allUsed, week: week, forceTier: undefined, meta: meta, legacyCandidates: legacyCandidates }));
  }

  // Top up to the world-scaled target, then cap so the pool can't grow
  // unbounded when AI drafts are slower than the natural turnover rate.
  const newPool = [...remaining, ...newWarriors];
  while (newPool.length < targetSize) {
    newPool.push(generateRecruit({ rng: rngService, usedNames: allUsed, week: week, forceTier: undefined, meta: meta, legacyCandidates: legacyCandidates }));
  }
  const poolHardCap = computeRecruitPoolHardCap(stableCount);
  if (newPool.length > poolHardCap) {
    // Drop oldest first so the pool stays fresh
    return newPool.sort((a, b) => a.addedWeek - b.addedWeek).slice(-poolHardCap);
  }
  return newPool;
}

/** Full manual refresh (costs gold) */
/**
 * Full manual refresh of the recruitment pool.
 *
 * @param week - Current game week
 * @param usedNames - Set of names already in use
 * @param rng - Optional RNG service
 * @returns A fresh array of PoolWarriors
 */
export function fullRefreshPool(
  week: number,
  usedNames: Set<string>,
  rng?: IRNGService
): PoolWarrior[] {
  const rngService = resolveRng(rng, week * 1337 + 7);
  return generateRecruitPool({ count: DEFAULT_POOL_SIZE, week: week, usedNames: usedNames, rng: rngService });
}

/**
 * Project a roster warrior into the recruit pool — when a stable dissolves
 * (bankruptcy, seasonal churn), its live warriors re-enter the world as free
 * agents instead of silently vanishing. The `veteran` snapshot keeps fame,
 * popularity, career, and titles so the signing path restores the warrior's
 * identity rather than minting a fresh prospect.
 */
export function warriorToPoolWarrior(w: Warrior, week: number, rng: IRNGService): PoolWarrior {
  const fame = w.fame ?? 0;
  const tier: RecruitTier =
    fame >= 200 ? 'Prodigy' : fame >= 80 ? 'Exceptional' : fame >= 30 ? 'Promising' : 'Common';
  return {
    id: w.id as string,
    name: w.name,
    style: w.style,
    attributes: { ...w.attributes },
    potential: w.potential ?? generatePotential(w.attributes, tier, rng),
    baseSkills: w.baseSkills ?? ({} as BaseSkills),
    derivedStats: w.derivedStats ?? ({} as DerivedStats),
    tier,
    cost: computeFreeAgentCost(w),
    age: w.age ?? 20,
    lore: w.lore ?? `${w.name}, veteran free agent.`,
    origin: w.origin,
    traits: [...(w.traits ?? [])],
    addedWeek: week,
    favorites: w.favorites ?? generateFavorites(w.style, rng),
    lineage: w.lineage,
    luckfactor: w.luckfactor ?? rollLuckfactor(rng),
    shelfWeeksRemaining: FREE_AGENT_SHELF_WEEKS,
    source: 'freeAgent',
    veteran: {
      fame: w.fame ?? 0,
      popularity: w.popularity ?? 0,
      career: { ...(w.career ?? { wins: 0, losses: 0, kills: 0 }) },
      titles: [...(w.titles ?? [])],
    },
  };
}

/**
 * Signing-path patch for displaced veterans: restores the warrior's original
 * id, fame, popularity, career, and titles. Returns `{}` for ordinary pool
 * recruits, so call sites can spread it unconditionally.
 */
export function veteranSigningPatch(recruit: PoolWarrior): Partial<Warrior> {
  if (!recruit.veteran) return {};
  return {
    id: recruit.id as WarriorId,
    fame: recruit.veteran.fame,
    popularity: recruit.veteran.popularity,
    career: { ...recruit.veteran.career },
    titles: [...recruit.veteran.titles],
  };
}

// AI Draft behavior has been moved to src/engine/draftService.ts
