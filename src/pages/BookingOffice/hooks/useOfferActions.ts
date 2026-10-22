import React, { useEffect, useState } from 'react';
import { useWorldState, type GameStore } from '@/state/useGameStore';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { filterAndSortOffers } from '@/engine/matchmaking/boutOfferFilters';
import { isExhausted, getFatigueBand } from '@/engine/core/fatigueUtils';
import { toast } from 'sonner';
import type { InjuryData, Warrior } from '@/types/warrior.types';
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
/** Severities that block bout acceptance. */
const BLOCKING_SEVERITIES = new Set(['Moderate', 'Severe', 'Critical', 'Permanent']);

/** Severity → rank for worst-injury selection (unknown severities rank -1). */
const SEVERITY_RANK = new Map(
  ['Minor', 'Moderate', 'Severe', 'Critical', 'Permanent'].map((s, i) => [s, i] as const)
);

export function getInjuryBadge(
  injuries: InjuryData[]
): { label: string; color: string; count: number } | null {
  const blocking = injuries.filter((i) => BLOCKING_SEVERITIES.has(i.severity));
  if (blocking.length === 0) return null;
  const first = blocking[0];
  if (!first) return null;
  const severest = blocking.reduce<InjuryData>((max, i) => {
    return (SEVERITY_RANK.get(i.severity) ?? -1) > (SEVERITY_RANK.get(max.severity) ?? -1)
      ? i
      : max;
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
    // warriorId → roster position: the per-offer pick keeps the previous
    // roster.find semantics (first in roster order wins when both sides of
    // a bout are our own warriors).
    const rosterPos = new Map(roster.map((w, i) => [w.id, i] as const));
    let accepted = 0;
    honorableOffers.forEach((offer) => {
      let warrior: Warrior | undefined;
      let bestPos = Infinity;
      for (const wid of offer.warriorIds) {
        const pos = rosterPos.get(wid);
        if (pos !== undefined && pos < bestPos) {
          bestPos = pos;
          warrior = roster[pos];
        }
      }
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
