import {
  FightingStyle,
  type Attributes,
  type BaseSkills,
  type DerivedStats,
} from '@/types/shared.types';
import {
  type AttributePotential,
  type CareerRecord,
  type WarriorFavorites,
  type WarriorLineage,
  type Warrior,
} from '@/types/warrior.types';
import { narrativeContent } from '@/data/narrative';
import type { NarrativeContent } from '@/types/narrative.types';
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
