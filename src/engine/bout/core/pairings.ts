import { BoutOffer, GameState, Warrior } from '@/types/state.types';
import { buildActiveWarriorMap } from '@/utils/roster';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';

/**
 * Defines the shape of bout pairing.
 */
export interface BoutPairing {
  a: Warrior;
  d: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  contractId?: string;
}

/**
 * Result of pairing generation. `voidedOffers` are Signed contracts that lost
 * the one-bout-per-warrior dedupe — callers must cancel them explicitly.
 */
export interface PairingsResult {
  pairings: BoutPairing[];
  voidedOffers: BoutOffer[];
}

/**
 * Deterministic ordering for conflicting signed offers. Title bouts take
 * precedence once `titleArenaId` exists (Phase 3); until then offer-id order
 * keeps the outcome independent of map insertion order.
 */
function compareOffersForPairing(a: BoutOffer, b: BoutOffer): number {
  return String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0;
}

/**
 * Generate pairings.
 */
export function generatePairings(state: GameState): PairingsResult {
  const currentWeek = state.absoluteWeek;
  const pairings: BoutPairing[] = [];
  const voidedOffers: BoutOffer[] = [];

  // ⚡ Bolt: Use cached warriorMap if available, otherwise build it
  const warriorMap = state.warriorMap || buildActiveWarriorMap(state);

  // Warriors already committed this week (tournament combatants first — the
  // bracket is authoritative — then signed contracts). One bout per warrior.
  const committedWarriors = new Set<string>();

  // Tournament combatants for the current day take precedence over signed
  // offers. Their pairings are still emitted after contract pairings below to
  // preserve the established ordering.
  const tournamentPairings: BoutPairing[] = [];
  if (state.isTournamentWeek && state.activeTournamentId) {
    const tournament = state.tournaments.find((t) => t.id === state.activeTournamentId);
    if (tournament) {
      // Round 1 is Day 1, Round 2 is Day 2, etc.
      const currentDay = state.day || 0;
      const tournamentBouts = tournament.bracket.filter(
        (b) => b.round === currentDay && b.winner === undefined
      );

      tournamentBouts.forEach((bout) => {
        const wA = warriorMap.get(bout.warriorIdA);
        const wD = warriorMap.get(bout.warriorIdD);

        if (wA && wD) {
          committedWarriors.add(wA.id);
          committedWarriors.add(wD.id);
          tournamentPairings.push({
            a: wA,
            d: wD,
            isRivalry: true, // Tournaments are always high stakes
            rivalStable: state.rivalMap?.get(bout.stableIdD || '')?.owner.stableName || 'Rival',
            rivalStableId: bout.stableIdD,
            contractId: `tour_${tournament.id}_${bout.round}_${bout.matchIndex}`,
          });
        }
      });
    }
  }

  // Derive pairings from Signed Contracts for this week
  const allOffers = Object.values(state.boutOffers || {});
  const currentOffers = allOffers
    .filter((o) => o.status === 'Signed' && boutOfferAbsoluteWeek(o) === currentWeek)
    .sort(compareOffersForPairing);

  currentOffers.forEach((offer) => {
    const idA = offer.warriorIds[0];
    const idD = offer.warriorIds[1];
    const wA = idA ? warriorMap.get(idA) : undefined;
    const wD = idD ? warriorMap.get(idD) : undefined;

    if (wA && wD) {
      // A warrior can only fight once per week — later contracts are voided
      // by the caller so no ghost Signed offer is left dangling.
      if (committedWarriors.has(wA.id) || committedWarriors.has(wD.id)) {
        voidedOffers.push(offer);
        return;
      }
      committedWarriors.add(wA.id);
      committedWarriors.add(wD.id);

      // Find which stable wD belongs to using O(1) map lookup
      const stableInfo = state.warriorToStableMap?.get(wD.id);
      const rivalStable =
        stableInfo && !stableInfo.isPlayer ? state.rivalMap?.get(stableInfo.stableId) : undefined;

      pairings.push({
        a: wA,
        d: wD,
        isRivalry: (offer.hype || 0) > 150, // Use hype as a proxy for rivalry
        rivalStable: rivalStable?.owner.stableName,
        rivalStableId: rivalStable?.id,
        contractId: offer.id,
      });
    }
  });

  return { pairings: [...pairings, ...tournamentPairings], voidedOffers };
}
