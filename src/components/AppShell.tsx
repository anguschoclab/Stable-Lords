import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';

import { useRivalryAlerts } from '@/hooks/useRivalryAlerts';
import { filterActive } from '@/utils/roster';
import { LeftNav } from '@/components/layout/LeftNav';
import { DeathModal } from '@/components/modals/DeathModal';
import { CoachOverlay } from '@/components/ui/CoachOverlay';
import { TacticalBar } from '@/components/layout/TacticalBar';
import EventLog from '@/components/EventLog';
import { AppHeader } from '@/components/layout/AppHeader';
import { ResetDialog } from '@/components/layout/ResetDialog';

// ─── Loading Overlay Component ─────────────────────────────────────────────

interface LoadingOverlayProps {
  isInitialized: boolean;
}

function LoadingOverlay({ isInitialized }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {!isInitialized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-[#0C0806] flex items-center justify-center flex-col gap-4"
        >
          <div className="w-12 h-12 rounded-none border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 animate-pulse">
            Unsealing the Archive...
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Event Log Rail Component ───────────────────────────────────────────────

interface EventLogRailProps {
  eventLogOpen: boolean;
  children: React.ReactNode;
}

function EventLogRail({ eventLogOpen, children }: EventLogRailProps) {
  return (
    <AnimatePresence>
      {eventLogOpen && (
        <motion.aside
          key="event-log"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex-shrink-0 border-l border-white/10 bg-[#08090b] overflow-hidden flex flex-col"
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/**
 * App shell.
 * @param - { children }.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const {
    week,
    day,
    isTournamentWeek,
    treasury,
    fame,
    crowdMood,
    weather,
    doReset,
    returnToTitle,
    lastSavedAt,
    isSimulating,
    isInitialized,
    eventLogOpen,
    initialize,
  } = useGameStore(
    useShallow((s: GameStore) => ({
      week: s.week,
      day: s.day,
      isTournamentWeek: s.isTournamentWeek,
      treasury: s.treasury,
      fame: s.fame,
      crowdMood: s.crowdMood,
      weather: s.weather,
      doReset: s.doReset,
      returnToTitle: s.returnToTitle,
      lastSavedAt: s.lastSavedAt,
      isSimulating: s.isSimulating,
      isInitialized: s.isInitialized,
      eventLogOpen: s.eventLogOpen,
      setEventLogOpen: s.setEventLogOpen,
      initialize: s.initialize,
    }))
  );
  const roster = useGameStore(useShallow((s: GameStore) => s.roster));
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;
  const [resetOpen, setResetOpen] = useState(false);

  useRivalryAlerts();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Only check for "Orphan" status if we are in the main game loops
    const exemptPaths = ['/welcome', '/stable/', '/admin', '/help'];
    if (exemptPaths.some((p) => activePath.startsWith(p))) return;

    if (filterActive(roster).length < 3) {
      navigate({ to: '/welcome' });
    }
  }, [roster, activePath, navigate]);

  useEffect(() => {
    // Strategic Route-Aware Event Log Toggling
    // We open the Event Log on the dashboard and high-stakes command screens.
    // We close it on management-heavy screens (Stable/World) to maximize workspace.
    const autoOpenPaths = ['/', '/stable/arena', '/stable/planner'];
    const autoClosePaths = ['/stable', '/world', '/stable/roster', '/stable/training'];

    if (autoOpenPaths.includes(activePath)) {
      useGameStore.getState().setEventLogOpen(true);
    } else if (autoClosePaths.some((p) => activePath.startsWith(p))) {
      useGameStore.getState().setEventLogOpen(false);
    }
  }, [activePath]);

  return (
    <div className="min-h-screen bg-[#0C0806] flex flex-col overflow-hidden text-foreground selection:bg-primary/30">
      <AppHeader
        week={week}
        day={day}
        isTournamentWeek={isTournamentWeek}
        treasury={treasury}
        fame={fame}
        crowdMood={crowdMood}
        weather={weather}
        isSimulating={isSimulating}
        lastSavedAt={lastSavedAt}
        onResetPrompt={() => setResetOpen(true)}
        returnToTitle={returnToTitle}
      />

      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* ─── Left Navigation Rail ─── */}
        <div className="hidden md:flex">
          <LeftNav />
        </div>

        {/* ─── Main Content Area ─── */}
        <main className="flex-1 flex flex-col relative bg-[#0C0806] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

          <div className="flex-1 relative overflow-y-auto overflow-x-hidden p-6 md:p-10 pb-20 md:pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative z-10"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <CoachOverlay />
          <TacticalBar />

          <LoadingOverlay isInitialized={isInitialized} />
        </main>

        {/* ─── Event Log Right Rail ─── */}
        <EventLogRail eventLogOpen={eventLogOpen}>
          <EventLog />
        </EventLogRail>
      </div>

      <DeathModal />

      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={doReset} />
    </div>
  );
}
