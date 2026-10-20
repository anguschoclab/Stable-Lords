import { useMemo, useState } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { filterAndSortOffers } from '@/engine/matchmaking/boutOfferFilters';
import type { Warrior } from '@/types/state.types';
import { useWeekReset, useOfferActions } from './useOfferActions';

export { getFatigueStatus, getInjuryBadge } from './useOfferActions';

/**
 *
 */
export interface RivalWarriorMap {
  [warriorId: string]: Warrior & { stableName: string };
}

/**
 *
 */
export function useBookingOffice() {
  const state = useWorldState();
  const setState = useGameStore((s) => s.setState);
  const { promoters, boutOffers, roster, week, absoluteWeek, rivals } = state;
  const [activeTab, setActiveTab] = useState('this-week');
  const [signedOfferIds, setSignedOfferIds] = useState<Set<string>>(new Set());
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);

  useWeekReset(week, setSignedOfferIds, setSelectedWarriorId);

  const rivalWarriorMap = useMemo<RivalWarriorMap>(() => {
    const map: RivalWarriorMap = {};
    for (const rival of rivals || []) {
      for (const warrior of rival.roster) {
        map[warrior.id] = { ...warrior, stableName: rival.owner.stableName };
      }
    }
    return map;
  }, [rivals]);

  const { thisWeekOffers, upcomingOffers, idleWarriors, highestPurse } = useMemo(
    () =>
      filterAndSortOffers({
        boutOffers: boutOffers,
        roster: roster,
        week: absoluteWeek,
        promoters: promoters,
        signedOfferIds: signedOfferIds,
        selectedWarriorId: selectedWarriorId,
      }),
    [boutOffers, roster, absoluteWeek, promoters, signedOfferIds, selectedWarriorId]
  );

  const { handleResponse, acceptAllHonorable } = useOfferActions(
    state,
    setState,
    setSignedOfferIds,
    thisWeekOffers
  );

  return {
    week,
    promoters,
    roster,
    boutOffers,
    activeTab,
    setActiveTab,
    signedOfferIds,
    selectedWarriorId,
    setSelectedWarriorId,
    rivalWarriorMap,
    thisWeekOffers,
    upcomingOffers,
    idleWarriors,
    highestPurse,
    handleResponse,
    acceptAllHonorable,
  };
}
