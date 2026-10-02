import { GameState, Warrior, RivalStableData, BoutOffer } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { type BoutOfferId, type PromoterId } from '@/types/shared.types';
import { selectArenaForMatchup } from './arenaFit';
import { weekToTimestamp } from '@/constants';
import { displayWeek } from '@/engine/core/absoluteWeek';
import { isBookable } from '@/engine/warrior/warriorStatus';
import { isChampionBookingLocked } from '@/engine/championship/arenaChampionship';
import { collectBookedWarriorIds } from '@/engine/core/warriorCollection';
import { buildRecentFightPairs } from '@/engine/core/historyUtils';
import { getPairKey } from '@/utils/keyUtils';

const WORLD_MATCHMAKING = 'WORLD_MATCHMAKING' as PromoterId;

/**
 * World Matchmaking Service
 *
 * Logic to pair NPC warriors from different stables for background bouts.
 * Ensures the world evolves (XP, fame, mortality) even without player input.
 */

type EligibleWarrior = { warrior: Warrior; stable: RivalStableData };

/**
 * Collect eligible warriors.
 */
function collectEligibleWarriors(
  state: GameState,
  bookedIds: Set<string>,
  targetWeek: number
): EligibleWarrior[] {
  const eligibleWarriors: EligibleWarrior[] = [];

  (state.rivals || []).forEach((rival) => {
    for (const warrior of rival.roster) {
      if (bookedIds.has(warrior.id)) continue;
      if (isChampionBookingLocked(state, warrior.id)) continue;
      if (
        isBookable(warrior, {
          // restStates is global (injuryHandler writes it for any warrior);
          // trainingAssignments combine the global list with the owning
          // stable's own list — G19 rival rest prep (TOURNAMENT_CAMPAIGN)
          // must gate booking the same way the player's assignments do.
          // Entries are keyed by warriorId, so the lists can't cross-match.
          restStates: state.restStates || [],
          trainingAssignments: [
            ...(state.trainingAssignments || []),
            ...(rival.trainingAssignments || []),
          ],
          targetWeek,
        })
      ) {
        eligibleWarriors.push({ warrior, stable: rival });
      }
    }
  });

  return eligibleWarriors;
}

/**
 * Find opponent.
 */
function findOpponent(
  entryA: EligibleWarrior,
  i: number,
  pool: EligibleWarrior[],
  pairedIds: Set<string>,
  recentFightPairs: Set<string>
): EligibleWarrior | null {
  // Find a suitable opponent (proximity in fame + different stable)
  // If the stable is on a VENDETTA intent with a target, bias toward that stable's warriors.
  const vendettaTargetId =
    entryA.stable.strategy?.intent === 'VENDETTA'
      ? entryA.stable.strategy.targetStableId
      : undefined;

  let bestOpponent: EligibleWarrior | null = null;
  let minFameGap = Infinity;

  for (let j = 0; j < pool.length; j++) {
    if (i === j) continue;
    const entryD = pool[j];
    if (!entryD || pairedIds.has(entryD.warrior.id)) continue;
    if (entryA.stable.id === entryD.stable.id) continue;
    if (recentFightPairs.has(getPairKey(entryA.warrior.id, entryD.warrior.id))) continue;

    const fameGap = Math.abs((entryA.warrior.fame || 0) - (entryD.warrior.fame || 0));

    // Prefer vendetta target if fame is within ±200
    if (vendettaTargetId && entryD.stable.id === vendettaTargetId && fameGap <= 200) {
      bestOpponent = entryD;
      break;
    }

    if (fameGap < minFameGap) {
      minFameGap = fameGap;
      bestOpponent = entryD;
    }

    if (fameGap < 50) break; // Good enough for background sim
  }

  return bestOpponent;
}

/**
 * Build world bout offer.
 */
function buildWorldBoutOffer(
  entryA: EligibleWarrior,
  bestOpponent: EligibleWarrior,
  state: GameState,
  rng: IRNGService
): BoutOffer {
  const offerId = `world_bout_${rng.uuid()}` as BoutOfferId;
  const arenaId = selectArenaForMatchup(entryA.warrior, bestOpponent.warrior, rng, {
    weather: state.weather,
    arenaHistory: state.arenaHistory,
    currentWeek: state.absoluteWeek,
  });
  return {
    id: offerId,
    promoterId: WORLD_MATCHMAKING,
    proposerStableId: entryA.stable.id,
    warriorIds: [entryA.warrior.id, bestOpponent.warrior.id],
    boutWeek: displayWeek(state.absoluteWeek + 2),
    expirationWeek: displayWeek(state.absoluteWeek + 1),
    createdAbsoluteWeek: state.absoluteWeek,
    purse: 300 + Math.floor(rng.next() * 200), // Variable purses
    hype: 100 + Math.floor(rng.next() * 100),
    status: 'Proposed',
    responses: {
      [entryA.warrior.id]: 'Pending',
      [bestOpponent.warrior.id]: 'Pending',
    },
    conditions: [],
    createdAt: weekToTimestamp(state.absoluteWeek || state.week),
    arenaId,
  };
}

/**
 * Plan world bouts.
 * @param state - The current game state.
 * @param rng - RNG service.
 */
export function planWorldBouts(state: GameState, rng: IRNGService): BoutOffer[] {
  const targetWeek = state.absoluteWeek + 1;
  // World bouts are scheduled for absoluteWeek + 2 (see offer.boutWeek below);
  // exclude warriors already signed for that week to prevent double-booking.
  const bookedIds = collectBookedWarriorIds(state, state.absoluteWeek + 2);
  const eligibleWarriors = collectEligibleWarriors(state, bookedIds, targetWeek);

  if (eligibleWarriors.length < 2) return [];

  const recentFightPairs = buildRecentFightPairs(state.arenaHistory || [], state.absoluteWeek, 4);

  const offers: BoutOffer[] = [];
  const pairedIds = new Set<string>();

  // 🏆 Ranking Incentive: Sort by fame (desc) then by inactivity (lastBoutWeek)
  // This ensures top-tier warriors fight to keep their tournament slots.
  const pool = [...eligibleWarriors].sort((a, b) => {
    const fameB = b.warrior.fame || 0;
    const fameA = a.warrior.fame || 0;
    if (Math.abs(fameB - fameA) > 100) return fameB - fameA;

    const lastBoutA = a.warrior.lastBoutWeek || 0;
    const lastBoutB = b.warrior.lastBoutWeek || 0;
    return lastBoutA - lastBoutB; // Prioritize those who haven't fought in a while
  });

  for (let i = 0; i < pool.length; i++) {
    const entryA = pool[i];
    if (!entryA || pairedIds.has(entryA.warrior.id)) continue;

    const bestOpponent = findOpponent(entryA, i, pool, pairedIds, recentFightPairs);

    if (bestOpponent) {
      pairedIds.add(entryA.warrior.id);
      pairedIds.add(bestOpponent.warrior.id);
      offers.push(buildWorldBoutOffer(entryA, bestOpponent, state, rng));
    }
  }

  return offers;
}
