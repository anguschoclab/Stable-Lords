import { GameState, Warrior, BoutOffer } from '@/types/state.types';

export interface BoutPairing {
  a: Warrior;
  d: Warrior;
  isRivalry: boolean;
  rivalStable?: string;
  rivalStableId?: string;
  contractId?: string;
}

export function generatePairings(state: GameState): BoutPairing[] {
  const currentWeek = state.week;
  const pairings: BoutPairing[] = [];

  // ⚡ Bolt: Use cached warriorMap if available, otherwise build it
  const warriorMap =
    state.warriorMap ||
    (() => {
      const map = new Map<string, Warrior>();
      state.roster.forEach((w) => map.set(w.id, w));
      (state.rivals || []).forEach((r) => {
        r.roster.forEach((w) => map.set(w.id, w));
      });
      return map;
    })();

  // 2. Derive pairings from Signed Contracts for this week
  const allOffers = Object.values(state.boutOffers || {});
  const currentOffers = allOffers.filter(
    (o) => o.status === 'Signed' && o.boutWeek === currentWeek
  );

  if (allOffers.length > 0) {
    const signed = allOffers.filter((o) => o.status === 'Signed').length;
    console.log(
      `[DEBUG-STATE] Week ${currentWeek} | Total Offers: ${allOffers.length} | Total Signed: ${signed} | Current Week Signed: ${currentOffers.length}`
    );
  }

  currentOffers.forEach((offer) => {
    const wA = warriorMap.get(offer.warriorIds[0]);
    const wD = warriorMap.get(offer.warriorIds[1]);

    if (wA && wD) {
      // Find which stable wD belongs to
      const rivalStable = (state.rivals || []).find((r) => r.roster.some((w) => w.id === wD.id));

      pairings.push({
        a: wA,
        d: wD,
        isRivalry: (offer.hype || 0) > 150, // Use hype as a proxy for rivalry
        rivalStable: rivalStable?.owner.stableName,
        rivalStableId: rivalStable?.id,
        contractId: offer.id,
      });
    } else {
      console.log(
        `[DEBUG] Pairing Failed: wA=${!!wA} wD=${!!wD}. IDs: ${offer.warriorIds.join(', ')}`
      );
      if (!wA) console.log(`[DEBUG] Missing Warrior A ID: ${offer.warriorIds[0]}`);
      if (!wD) console.log(`[DEBUG] Missing Warrior D ID: ${offer.warriorIds[1]}`);
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
        const wA =
          warriorMap.get(bout.a) || Array.from(warriorMap.values()).find((w) => w.name === bout.a);
        const wD =
          warriorMap.get(bout.d) || Array.from(warriorMap.values()).find((w) => w.name === bout.d);

        if (wA && wD) {
          pairings.push({
            a: wA,
            d: wD,
            isRivalry: true, // Tournaments are always high stakes
            rivalStable:
              (state.rivals || []).find((r) => r.owner.id === bout.stableD)?.owner.stableName ||
              'Rival',
            rivalStableId: bout.stableD,
            contractId: `tour_${tournament.id}_${bout.round}_${bout.matchIndex}`,
          });
        }
      });
    }
  }

  return pairings;
}
