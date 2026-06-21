import { GameState, Warrior } from '@/types/state.types';
import { buildWarriorMap } from '@/utils/roster'; /**
                                                   * Defines the shape of bout pairing.
                                                   */

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
} /**
   * Generate pairings.
   */

/**
 * Generate pairings.
 */
export function generatePairings(state: GameState): BoutPairing[] {
  const currentWeek = state.week;
  const pairings: BoutPairing[] = [];

  // ⚡ Bolt: Use cached warriorMap if available, otherwise build it
  const warriorMap = state.warriorMap || buildWarriorMap(state);

  // 2. Derive pairings from Signed Contracts for this week
  const allOffers = Object.values(state.boutOffers || {});
  const currentOffers = allOffers.filter(
    (o) => o.status === 'Signed' && o.boutWeek === currentWeek
  );

  currentOffers.forEach((offer) => {
    const idA = offer.warriorIds[0];
    const idD = offer.warriorIds[1];
    const wA = idA ? warriorMap.get(idA) : undefined;
    const wD = idD ? warriorMap.get(idD) : undefined;

    if (wA && wD) {
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

  // 3. Integrate Tournament Matchups
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
          pairings.push({
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

  return pairings;
}
