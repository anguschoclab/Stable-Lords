import { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useTacticalAlerts } from '@/hooks/useTacticalAlerts';
import type { HubId } from './navigationHubs';

interface UseNavAlertsOptions {
  trackWeek?: boolean;
}

/**
 *
 */
export function useNavAlerts(options: UseNavAlertsOptions = {}) {
  const { trackWeek = false } = options;
  const { week, isTournamentWeek } = useGameStore(
    useShallow((s) => ({
      week: s.week,
      isTournamentWeek: s.isTournamentWeek,
    }))
  );
  const alerts = useTacticalAlerts();
  const location = useLocation();
  const onStableSection = location.pathname.startsWith('/stable');

  // Track the week when user last visited each section — badge only shows for newer weeks
  const [lastSeenStableWeek, setLastSeenStableWeek] = useState(
    trackWeek && onStableSection ? week : -1
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync last seen week when user visits stable section
    if (trackWeek && onStableSection) setLastSeenStableWeek(week);
  }, [onStableSection, week, trackWeek]);

  // Extract counts from tactical alerts
  const trainingAlert = alerts.find((a) => a.id === 'unassigned-training');
  const untrainedCount = trainingAlert
    ? parseInt(trainingAlert.message.match(/\d+/)?.[0] || '0')
    : 0;
  const offersAlert = alerts.find((a) => a.id === 'pending-offers');
  const pendingOffers = offersAlert ? parseInt(offersAlert.message.match(/\d+/)?.[0] || '0') : 0;

  const showStableAlert = trackWeek
    ? (untrainedCount > 0 || pendingOffers > 0) && !onStableSection && week > lastSeenStableWeek
    : untrainedCount > 0 || pendingOffers > 0;

  return {
    counts: {
      stable: showStableAlert ? untrainedCount + pendingOffers : 0,
      world: isTournamentWeek ? 1 : 0,
    } as Record<HubId, number>,
    links: {
      stable: '/stable',
      world: '/world/tournaments',
    } as Record<HubId, string>,
  };
}
