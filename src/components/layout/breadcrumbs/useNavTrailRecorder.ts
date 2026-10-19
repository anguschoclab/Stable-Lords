import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useGameStore } from '@/state/useGameStore';
import { recordVisit, resetNavTrail } from './navTrail';
import { labelForPathname } from './routeCrumbs';

/**
 * Records each route change into the nav trail. Mounted once in AppShell
 * (which persists across route transitions), so the trail spans the whole
 * session — post-FTUE by construction since AppShell only mounts then.
 * Loading a different save resets the trail: stale labels would point at
 * entities that no longer exist.
 */
export function useNavTrailRecorder(): void {
  const pathname = useLocation().pathname;
  const playerId = useGameStore((s) => s.player?.id);

  useEffect(() => {
    resetNavTrail();
  }, [playerId]);

  useEffect(() => {
    recordVisit(pathname, labelForPathname(pathname, useGameStore.getState()));
  }, [pathname]);
}
