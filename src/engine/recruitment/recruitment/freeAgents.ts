import {
  type BaseSkills,
  type DerivedStats,
  type WarriorId,
} from '@/types/shared.types';
import { type Warrior } from '@/types/warrior.types';
import { rollLuckfactor } from '../../warrior/skillCalc';
import { generatePotential } from '../../warrior/potential';
import { generateFavorites } from '../../favorites';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { FREE_AGENT_SHELF_WEEKS } from '@/constants/world';
import { computeFreeAgentCost, type PoolWarrior, type RecruitTier } from './types';

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
