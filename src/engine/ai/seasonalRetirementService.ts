import type { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Warrior } from '@/types/warrior.types';
import { isActive, deadIdSet } from '@/engine/warrior/warriorStatus';
import { retireWithHonors } from '@/engine/warrior/retirement';
import {
  isLegacyFounderCaliber,
  buildLegacyFounderQueueEntry,
  collectCrownedWarriorIds,
} from './legacyFounder';
import { LEGACY_FOUND_CHANCE } from '@/constants/world';

/**
 * SeasonalRetirementService - Handles retirement and legacy founder system.
 * Manages seasonal retirement for all rivals and legacy founders.
 */

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
  processSeasonalRetirement(state: GameState, rng: IRNGService): { updatedState: GameState } {
    const updatedState = { ...state };
    const founderQueue: Warrior[] = [...(state.legacyFounderQueue ?? [])];

    // Reigning champions defer retirement — the crown keeps them fighting.
    const championIds = new Set(
      Object.values(state.arenaChampions ?? {})
        .map((t) => t.champion?.warriorId)
        .filter((id): id is NonNullable<typeof id> => id != null)
    );
    // Past or present crown-holders are founder caliber when they retire.
    const crownedIds = collectCrownedWarriorIds(state);
    const deadIds = deadIdSet(state);

    updatedState.rivals = (updatedState.rivals || []).map((rival) => {
      const updatedRoster = rival.roster.map((w) => {
        if (!isActive(w) || deadIds.has(w.id)) return w;

        const retireChance = retireChanceFor(w, championIds.has(w.id));

        if (rng.next() < retireChance) {
          // Hall-of-Fame-caliber retirees may found a stable of their own —
          // the queue is persisted on state (consumed by the expansion pass).
          if (isLegacyFounderCaliber(w, crownedIds) && rng.next() < LEGACY_FOUND_CHANCE) {
            founderQueue.push(buildLegacyFounderQueueEntry(w));
          }
          return retireWithHonors(w, state.week);
        }
        return w;
      });

      return {
        ...rival,
        roster: updatedRoster,
      };
    });

    updatedState.legacyFounderQueue = founderQueue;
    return { updatedState };
  },
} as const;
