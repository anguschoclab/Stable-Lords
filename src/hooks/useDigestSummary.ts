import { useMemo } from 'react';
import type { FightSummary, WarriorId } from '@/types/game';
import type { BoutOffer } from '@/types/state.types';

/**
 *
 */
export interface DigestSummary {
  totalFights: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  upcomingBouts: number;
  pendingOffers: number;
  signedOffers: number;
  tournamentActive: boolean;
}

interface UseDigestSummaryOptions {
  arenaHistory: FightSummary[];
  boutOffers: Record<string, BoutOffer>;
  currentWeek: number;
  playerWarriorIds: Set<WarriorId>;
}

/**
 *
 */
export function useDigestSummary({
  arenaHistory,
  boutOffers,
  currentWeek,
  playerWarriorIds,
}: UseDigestSummaryOptions): DigestSummary {
  return useMemo(() => {
    const thisWeekFights = arenaHistory.filter((f) => f.week === currentWeek);

    let wins = 0;
    let losses = 0;
    let kills = 0;
    let deaths = 0;

    thisWeekFights.forEach((f) => {
      const playerIsA = playerWarriorIds.has(f.warriorIdA);
      const playerIsD = playerWarriorIds.has(f.warriorIdD);

      if (!playerIsA && !playerIsD) return;

      const playerWon = (playerIsA && f.winner === 'A') || (playerIsD && f.winner === 'D');
      const playerLost = (playerIsA && f.winner === 'D') || (playerIsD && f.winner === 'A');

      if (playerWon) {
        wins++;
        if (f.by === 'Kill') kills++;
      } else if (playerLost) {
        losses++;
        if (f.by === 'Kill') deaths++;
      }
    });

    const { pending, signed, upcoming } = Object.values(boutOffers).reduce(
      (acc, o) => {
        if (o.status === 'Proposed' && o.boutWeek >= currentWeek) acc.pending++;
        if (o.status === 'Signed' && o.boutWeek === currentWeek) acc.signed++;
        if (o.status === 'Signed' && o.boutWeek > currentWeek) acc.upcoming++;
        return acc;
      },
      { pending: 0, signed: 0, upcoming: 0 }
    );

    return {
      totalFights: thisWeekFights.length,
      wins,
      losses,
      kills,
      deaths,
      upcomingBouts: upcoming,
      pendingOffers: pending,
      signedOffers: signed,
      tournamentActive: false,
    };
  }, [arenaHistory, boutOffers, currentWeek, playerWarriorIds]);
}
