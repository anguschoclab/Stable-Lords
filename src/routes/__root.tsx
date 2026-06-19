import React, { Suspense, lazy } from 'react';
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import AppShell from '@/components/AppShell';
import NotFound from '@/pages/NotFound';
import { useCoachTip } from '@/hooks/useCoachTip';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { useDeathNotifications } from '@/hooks/useDeathNotifications';

const StartGame = lazy(() => import('@/pages/StartGame'));
const Orphanage = lazy(() => import('@/pages/Orphanage'));
const ResolutionReveal = lazy(() => import('@/components/ResolutionReveal'));

const darkFallback = <div className="h-screen w-screen bg-[#050506]" />;

function RouterHooks() {
  const location = useLocation();
  const toggleEventLog = useGameStore((s) => s.toggleEventLog);

  useCoachTip(location.pathname);

  useKeyboardShortcuts({ onToggleSidebar: toggleEventLog });

  return null;
} /**
 * Route.
 */

/**
 * Route.
 */
export const Route = createRootRoute({
  component: () => {
    const state = useWorldState();
    const { atTitleScreen } = useGameStore();

    // App-wide death ping — subscribes once, cleans up on unmount.
    useDeathNotifications();

    // No active game → show title / start screen
    if (atTitleScreen) {
      return (
        <Suspense fallback={darkFallback}>
          <StartGame />
        </Suspense>
      );
    }

    // FTUE not complete → Orphanage flow (stable already named on start page)
    if (!state.ftueComplete) {
      return (
        <Suspense fallback={darkFallback}>
          <Orphanage />
        </Suspense>
      );
    }

    return (
      <>
        <Suspense fallback={null}>
          <ResolutionReveal />
        </Suspense>
        <RouterHooks />
        <AppShell>
          <React.Suspense
            fallback={
              <div className="h-screen w-screen bg-[#0d0f14] flex flex-col items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-primary/80 animate-pulse">
                <div className="mb-4">Unsealing the Archive...</div>
                <div className="w-48 h-[1px] bg-primary/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/60 animate-progress" />
                </div>
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </AppShell>
      </>
    );
  },
  notFoundComponent: () => <NotFound />,
});
