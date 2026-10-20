import React, { useEffect, useState } from 'react';
import { useWorldState, type GameStore } from '@/state/useGameStore';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { filterAndSortOffers } from '@/engine/matchmaking/boutOfferFilters';
import { isExhausted, getFatigueBand } from '@/engine/core/fatigueUtils';
import { toast } from 'sonner';
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
  switch (getFatigueBand(fatigue)) {
    case 'fresh':
      return {
        label: 'Optimal',
        color: 'text-primary',
        icon: React.createElement(Heart, { className: 'h-3 w-3' }),
      };
    case 'elevated':
      return {
        label: 'Degraded',
        color: 'text-arena-gold',
        icon: React.createElement(Clock, { className: 'h-3 w-3' }),
      };
    default:
      return {
        label: 'Critical',
        color: 'text-destructive',
        icon: React.createElement(AlertTriangle, { className: 'h-3 w-3' }),
      };
  }
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

/** Reset transient selections when the week rolls over. */
export function useWeekReset(
  week: number,
  setSignedOfferIds: (v: Set<string>) => void,
  setSelectedWarriorId: (v: string | null) => void
) {
  const [trackedWeek, setTrackedWeek] = useState(week);
  useEffect(() => {
    if (week !== trackedWeek) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset state on week change
      setTrackedWeek(week);
      setSignedOfferIds(new Set());
      setSelectedWarriorId(null);
    }
  }, [week, trackedWeek, setSignedOfferIds, setSelectedWarriorId]);
}

/** Accept/decline mutations + the accept-all-honorable batch action. */
export function useOfferActions(
  state: ReturnType<typeof useWorldState>,
  setState: GameStore['setState'],
  setSignedOfferIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  thisWeekOffers: ReturnType<typeof filterAndSortOffers>['thisWeekOffers']
) {
  const { promoters, roster } = state;

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
        s.boutOffers = next.boutOffers;
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

  return { handleResponse, acceptAllHonorable };
}
