/**
 * Tactical Alerts Hook
 * Consolidates alert generation logic for TacticalBar, LeftNav, and MobileNav
 * Detects unassigned training, pending bout offers, fight-ready warriors, and tournament weeks
 */
import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { isFightReady } from '@/engine/warriorStatus';
import { Dumbbell, ScrollText, Swords, Trophy } from 'lucide-react';

/**
 *
 */
export interface TacticalAlert {
  id: string;
  type: 'warning' | 'info' | 'urgent' | 'success';
  icon: React.ElementType;
  message: string;
  action?: {
    label: string;
    to: string;
  };
}

/**
 *
 */
export function useTacticalAlerts(): TacticalAlert[] {
  const { trainingAssignments, boutOffers, isTournamentWeek, day, roster } = useGameStore(
    useShallow((s) => ({
      trainingAssignments: s.trainingAssignments,
      boutOffers: s.boutOffers,
      isTournamentWeek: s.isTournamentWeek,
      day: s.day,
      roster: s.roster,
    }))
  );

  return useMemo<TacticalAlert[]>(() => {
    const result: TacticalAlert[] = [];

    // Check for unassigned training
    const assignedIds = new Set(
      trainingAssignments?.map((a: { warriorId: string }) => a.warriorId) ?? []
    );
    const activeWarriors = (roster ?? []).filter((w) => w.status === 'Active');
    const unassigned = activeWarriors.filter((w) => !assignedIds.has(w.id));

    if (unassigned.length > 0) {
      result.push({
        id: 'unassigned-training',
        type: 'warning',
        icon: Dumbbell,
        message: `${unassigned.length} warrior${unassigned.length > 1 ? 's' : ''} need${unassigned.length === 1 ? 's' : ''} training assignment`,
        action: { label: 'Assign', to: '/stable/training' },
      });
    }

    // Check for pending bout offers — only those involving the player's own warriors
    // where the player's warrior has NOT yet responded (response still 'Pending')
    const playerWarriorIds = new Set(activeWarriors.map((w) => w.id));
    const offersArray = boutOffers ? Object.values(boutOffers) : [];
    const pendingOffers = offersArray.filter((o) => {
      if (o.status !== 'Proposed') return false;
      return o.warriorIds.some(
        (id) => playerWarriorIds.has(id) && (o.responses[id] === 'Pending' || !o.responses[id])
      );
    });

    if (pendingOffers.length > 0) {
      result.push({
        id: 'pending-offers',
        type: 'info',
        icon: ScrollText,
        message: `${pendingOffers.length} bout offer${pendingOffers.length > 1 ? 's' : ''} pending response`,
        action: { label: 'Review', to: '/stable/bouts' },
      });
    }

    // Check for fight-ready warriors (needs full warrior objects for isFightReady)
    const fightReady = roster?.filter((w) => isFightReady(w)) ?? [];

    if (fightReady.length >= 2) {
      result.push({
        id: 'combat-ready',
        type: 'success',
        icon: Swords,
        message: `${fightReady.length} warriors ready for combat`,
        action: { label: 'Fight', to: '/stable/arena' },
      });
    }

    // Check for tournament week
    if (isTournamentWeek) {
      result.push({
        id: 'tournament-active',
        type: 'urgent',
        icon: Trophy,
        message: `Tournament Day ${day + 1} in progress`,
        action: { label: 'Enter', to: '/world/tournaments' },
      });
    }

    return result;
  }, [roster, trainingAssignments, boutOffers, isTournamentWeek, day]);
}
