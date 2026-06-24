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
}

function RootComponent() {
  const state = useWorldState();
  const atTitleScreen = useGameStore((s) => s.atTitleScreen);

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
}

/**
 * Route.
 */
export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-[#050506]">
      <div className="text-center font-mono max-w-md p-8">
        <div className="text-destructive text-[10px] uppercase tracking-[0.5em] mb-4 animate-pulse">
          Critical Error
        </div>
        <h1 className="text-foreground text-4xl font-bold uppercase tracking-widest mb-4">
          Archive Corrupted
        </h1>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] mb-8">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary text-[10px] uppercase tracking-[0.4em] border border-primary px-6 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Reload Archive
        </button>
      </div>
    </div>
  ),
});
