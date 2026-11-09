import {
  FightingStyle,
  type Attributes,
  type BaseSkills,
  type DerivedStats,
} from '@/types/shared.types';
import {
  type AttributePotential,
  type CareerRecord,
  type StrategyMemory,
  type WarriorFavorites,
  type WarriorLineage,
  type Warrior,
} from '@/types/warrior.types';
import type { EquipmentLoadout } from '@/data/equipment';
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
  /** Hidden −1..+1 bloodlust — per-warrior lust for the kill (canon). */
  bloodlust?: number;
  /** Persisted handedness rolled at creation; ambidextrous carries +1 ATT
   *  (already baked into `baseSkills`) and eases dual-wield requirements.
   *  'ambi-reversed' is the rare canon variant (primary side = left). */
  handedness?: 'right' | 'left' | 'ambidextrous' | 'ambi-reversed';
  /** Hidden trait aptitude — rolled at materialization when absent. */
  trainability?: number;
  /**
   * Veteran progression carried through the free-agent round-trip — a
   * displaced warrior's xp, drills, arena lessons, plan memory, and burned
   * learn slots are part of their sheet, not reset on re-sign. Ordinary
   * pool recruits leave these undefined.
   */
  xp?: number;
  learnedSkills?: Partial<Record<keyof BaseSkills, number>>;
  skillDrills?: Partial<Record<keyof BaseSkills, number>>;
  strategyMemory?: StrategyMemory;
  burnedSkills?: Partial<Record<keyof BaseSkills, number>>;
  /** Veteran loadout — kept on re-sign; prospects get a fitted loadout. */
  equipment?: EquipmentLoadout;
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
  source?: 'orphanage' | 'academy' | 'freeAgent' | 'released' | 'apprentice' | 'generated';
  /** Deterministic seed for the recruit's portrait. */
  avatarSeed?: number;
}

// TIER data is now fetched from narrative domain files — the literals are
// the design-table fallbacks so a missing/renamed narrative key degrades to
// the documented economy instead of silently pricing recruits at 0g.

/**
 * Tier_cost.
 */
export const TIER_COST: Record<RecruitTier, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment.tiers.Common?.cost ?? 100,
  Promising: (narrativeContent as NarrativeContent).recruitment.tiers.Promising?.cost ?? 150,
  Exceptional: (narrativeContent as NarrativeContent).recruitment.tiers.Exceptional?.cost ?? 250,
  Prodigy: (narrativeContent as NarrativeContent).recruitment.tiers.Prodigy?.cost ?? 400,
};

/**
 * Tier_stars.
 */
export const TIER_STARS: Record<RecruitTier, number> = {
  Common: (narrativeContent as NarrativeContent).recruitment.tiers.Common?.stars ?? 0,
  Promising: (narrativeContent as NarrativeContent).recruitment.tiers.Promising?.stars ?? 1,
  Exceptional: (narrativeContent as NarrativeContent).recruitment.tiers.Exceptional?.stars ?? 2,
  Prodigy: (narrativeContent as NarrativeContent).recruitment.tiers.Prodigy?.stars ?? 3,
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
