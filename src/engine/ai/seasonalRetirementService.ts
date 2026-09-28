import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import { isActive } from '@/engine/warrior/warriorStatus';

/**
 * SeasonalRetirementService - Handles retirement and legacy founder system.
 * Manages seasonal retirement for all rivals and legacy founders.
 */

interface LegacyCandidate {
  name: string;
  stableName: string;
  parentStableId?: string; // 🛡️ Track parent stable for crest inheritance
  warriorId?: string; // Lineage breadcrumb — mirrors Trainer.retiredFromWarrior
  fightingStyle?: import('@/types/shared.types').FightingStyle;
}

/** Each permanent injury adds this many years of effective aging pressure. */
const PERMANENT_INJURY_AGE_PRESSURE = 5;
/** Reigning champions stop deferring at this effective age — old enough that
 *  even a crown can't hold off the end for long. */
const CHAMPION_DEFERRAL_AGE = 38;

/**
 * Probability a rival warrior retires at the seasonal churn.
 * Career-aware rather than pure age:
 *  - permanent injuries count as accelerated aging (broken bodies exit early)
 *  - a reigning champion defers retirement while defending the crown —
 *    voluntary exits flow through the relinquish path instead; deferral
 *    fades to a halved chance once the champion is genuinely old.
 */
export function retireChanceFor(w: Warrior, isChampion: boolean): number {
  const age = w.age ?? 20;
  const permanent = (w.injuries ?? []).filter(
    (i) => i.permanent || i.severity === 'Permanent'
  ).length;
  const effectiveAge = age + permanent * PERMANENT_INJURY_AGE_PRESSURE;
  const base = effectiveAge >= 40 ? 1 : effectiveAge >= 30 ? (effectiveAge - 30) * 0.05 : 0;
  if (!isChampion) return base;
  if (effectiveAge < CHAMPION_DEFERRAL_AGE) return 0;
  return base * 0.5;
}

/**
 * Seasonal retirement service.
 */
export const SeasonalRetirementService = {
  /**
   * Processes seasonal retirement for all rival stables.
   * Handles legacy founders (retired warriors becoming owners).
   */
  processSeasonalRetirement(
    state: GameState,
    rng: IRNGService
  ): { updatedState: GameState; legacyCandidates: LegacyCandidate[] } {
    const updatedState = { ...state };
    const legacyCandidates: LegacyCandidate[] = [];

    // Reigning champions defer retirement — the crown keeps them fighting.
    const championIds = new Set(
      Object.values(state.arenaChampions ?? {})
        .map((t) => t.champion?.warriorId)
        .filter((id): id is NonNullable<typeof id> => id != null)
    );

    updatedState.rivals = (updatedState.rivals || []).map((rival) => {
      const updatedRoster = rival.roster.map((w) => {
        if (!isActive(w)) return w;

        const retireChance = retireChanceFor(w, championIds.has(w.id));

        if (rng.next() < retireChance) {
          // Check if warrior could become a legacy founder
          if (w.fame >= 90 && (w.career?.wins || 0) >= 50 && rng.next() < 0.25) {
            const newStableName = `${w.name}'s Academy`;
            legacyCandidates.push({
              name: w.name,
              stableName: newStableName,
              parentStableId: rival.id, // 🛡️ Track parent for crest inheritance
              warriorId: w.id,
              fightingStyle: w.style,
            });
          }
          return { ...w, status: 'Retired' as const, retiredWeek: state.week } as Warrior;
        }
        return w;
      });

      return {
        ...rival,
        roster: updatedRoster,
      };
    });

    return { updatedState, legacyCandidates };
  },
} as const;
