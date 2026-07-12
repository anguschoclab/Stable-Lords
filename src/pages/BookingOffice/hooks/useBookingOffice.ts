import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore, useWorldState, type GameStore } from '@/state/useGameStore';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { filterAndSortOffers } from '@/engine/matchmaking/boutOfferFilters';
import { isExhausted, FATIGUE_FRESH, FATIGUE_ELEVATED } from '@/engine/core/fatigueUtils';
import { toast } from 'sonner';
import type { Warrior } from '@/types/state.types';
import type { InjuryData } from '@/types/warrior.types';
import { Heart, Clock, AlertTriangle } from 'lucide-react';

/**
 *
 */
export function getFatigueStatus(fatigue: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (fatigue <= FATIGUE_FRESH)
    return {
      label: 'Optimal',
      color: 'text-primary',
      icon: React.createElement(Heart, { className: 'h-3 w-3' }),
    };
  if (fatigue <= FATIGUE_ELEVATED)
    return {
      label: 'Degraded',
      color: 'text-arena-gold',
      icon: React.createElement(Clock, { className: 'h-3 w-3' }),
    };
  return {
    label: 'Critical',
    color: 'text-destructive',
    icon: React.createElement(AlertTriangle, { className: 'h-3 w-3' }),
  };
}

/**
 *
 */
export function getInjuryBadge(
  injuries: InjuryData[]
): { label: string; color: string; count: number } | null {
  const blocking = injuries.filter((i) =>
    ['Moderate', 'Severe', 'Critical', 'Permanent'].includes(i.severity)
  );
  if (blocking.length === 0) return null;
  const first = blocking[0];
  if (!first) return null;
  const severest = blocking.reduce<InjuryData>((max, i) => {
    const order = ['Minor', 'Moderate', 'Severe', 'Critical', 'Permanent'];
    return order.indexOf(i.severity) > order.indexOf(max.severity) ? i : max;
  }, first);
  const colorMap: Record<string, string> = {
    Moderate: 'text-arena-gold',
    Severe: 'text-primary',
    Critical: 'text-destructive',
    Permanent: 'text-arena-fame',
  };
  const severity: string = severest.severity ?? 'Moderate';
  const color = colorMap[severity] ?? colorMap['Moderate'] ?? 'text-arena-gold';
  return {
    label: severity,
    color,
    count: blocking.length,
  };
}

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
  const { promoters, boutOffers, roster, week, rivals } = state;
  const [activeTab, setActiveTab] = useState('this-week');
  const [signedOfferIds, setSignedOfferIds] = useState<Set<string>>(new Set());
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);
  const [trackedWeek, setTrackedWeek] = useState(week);

  useEffect(() => {
    if (week !== trackedWeek) {
      setTrackedWeek(week);
      setSignedOfferIds(new Set());
      setSelectedWarriorId(null);
    }
  }, [week, trackedWeek]);

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
      filterAndSortOffers(boutOffers, roster, week, promoters, signedOfferIds, selectedWarriorId),
    [boutOffers, roster, week, promoters, signedOfferIds, selectedWarriorId]
  );

  const handleResponse = (
    offerId: string,
    warriorId: string | undefined,
    response: 'Accepted' | 'Declined'
  ) => {
    if (!warriorId) return;
    if (response === 'Accepted') {
      setSignedOfferIds((prev) => new Set(prev).add(offerId));
    }
    setState((s: GameStore) => {
      const next = respondToBoutOffer(
        state,
        offerId as BoutOfferId,
        warriorId as WarriorId,
        response
      );
      if (next.boutOffers) {
        s.boutOffers = next.boutOffers as any;
      }
    });
    toast.success(`Bout ${response === 'Accepted' ? 'accepted' : 'declined'}.`);
  };

  const acceptAllHonorable = () => {
    const honorableOffers = thisWeekOffers.filter(
      (o) => promoters[o.promoterId]?.personality === 'Honorable'
    );
    let accepted = 0;
    honorableOffers.forEach((offer) => {
      const warrior = roster.find((w) => offer.warriorIds.includes(w.id));
      if (
        warrior &&
        !isExhausted(warrior.fatigue ?? 0) &&
        !getInjuryBadge(warrior.injuries || [])
      ) {
        handleResponse(offer.id, warrior.id, 'Accepted');
        accepted++;
      }
    });
    toast.success(`${accepted} bouts accepted.`);
  };

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
