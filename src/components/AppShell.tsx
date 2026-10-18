import { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';

import { useRivalryAlerts } from '@/hooks/useRivalryAlerts';
import { useAudioSync } from '@/hooks/useAudioSync';
import { LeftNav } from '@/components/layout/LeftNav';
import { DeathModal } from '@/components/modals/DeathModal';
import { WinScreen } from '@/components/progression/WinScreen';
import { CoachOverlay } from '@/components/ui/CoachOverlay';
import { TacticalBar } from '@/components/layout/TacticalBar';
import EventLog from '@/components/EventLog';
import { MobileEventLogSheet } from '@/components/layout/MobileEventLogSheet';
import { resolveEventLogRouteState } from '@/components/layout/eventLogRoutePolicy';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AppHeader } from '@/components/layout/AppHeader';
import { ResetDialog } from '@/components/layout/ResetDialog';
import { ResultsBanner } from '@/components/layout/ResultsBanner';
import { useWeekExecution } from '@/hooks/useWeekExecution';

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
          className="absolute inset-0 z-50 bg-background flex items-center justify-center flex-col gap-4"
        >
          <div className="w-12 h-12 rounded-none border-2 border-primary/20 border-t-primary animate-spin motion-reduce:animate-none" />
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60 animate-pulse motion-reduce:animate-none">
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
          className="flex-shrink-0 border-l border-white/10 bg-background overflow-hidden flex flex-col"
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Route-aware Event Log Toggling ─────────────────────────────────────────
// We open the Event Log on the dashboard and high-stakes command screens.
// We close it on management-heavy screens (Stable/World) to maximize workspace.

function useRouteAwareEventLog(activePath: string, isCompactShell: boolean) {
  useEffect(() => {
    const { eventLogOpen, setEventLogOpen } = useGameStore.getState();
    const nextOpen = resolveEventLogRouteState(activePath, isCompactShell, eventLogOpen);
    if (nextOpen !== eventLogOpen) setEventLogOpen(nextOpen);
  }, [activePath, isCompactShell]);
}

/** Central column: results banner, animated page outlet, overlays. */
function MainColumn(props: {
  week: number;
  isInitialized: boolean;
  results: ReturnType<typeof useWeekExecution>['results'];
  clearResults: () => void;
  pathname: string;
  children: React.ReactNode;
}) {
  const { week, isInitialized, results, clearResults, pathname } = props;
  const { children } = props;
  return (
    <main className="flex-1 flex flex-col relative bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      <ResultsBanner week={week} results={results} onDismiss={clearResults} />
      <div className="flex-1 relative overflow-y-auto overflow-x-hidden p-6 md:p-10 pb-20 md:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
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
  );
}

/**
 * App shell.
 * @param - { children }.
 */
/** Shell chrome state: header fields, simulation/reset plumbing, event log. */
function useShellState() {
  return useGameStore(
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
}

function ShellContent(props: {
  week: number;
  isInitialized: boolean;
  eventLogOpen: boolean;
  setEventLogOpen: (open: boolean) => void;
  isCompactShell: boolean;
  pathname: string;
  results: ReturnType<typeof useWeekExecution>['results'];
  clearResults: () => void;
  resetOpen: boolean;
  setResetOpen: (open: boolean) => void;
  doReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* ─── Left Navigation Rail ─── */}
        <div className="hidden lg:flex">
          <LeftNav />
        </div>

        {/* ─── Main Content Area ─── */}
        <MainColumn
          week={props.week}
          isInitialized={props.isInitialized}
          results={props.results}
          clearResults={props.clearResults}
          pathname={props.pathname}
        >
          {props.children}
        </MainColumn>

        {/* ─── Event Log Context ─── */}
        {!props.isCompactShell && (
          <EventLogRail eventLogOpen={props.eventLogOpen}>
            <EventLog />
          </EventLogRail>
        )}
      </div>

      {props.isCompactShell && (
        <MobileEventLogSheet open={props.eventLogOpen} onOpenChange={props.setEventLogOpen} />
      )}

      <DeathModal />
      <WinScreen />

      <ResetDialog
        open={props.resetOpen}
        onOpenChange={props.setResetOpen}
        onConfirm={props.doReset}
      />
    </>
  );
}

/** Application shell: header, CTA, and routed content frame. */
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
    setEventLogOpen,
    initialize,
  } = useShellState();
  const isCompactShell = useMediaQuery('(max-width: 1023px)');
  const location = useLocation();
  const activePath = location.pathname;
  const [resetOpen, setResetOpen] = useState(false);
  const { results, clearResults } = useWeekExecution();

  useRivalryAlerts();
  useAudioSync();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useRouteAwareEventLog(activePath, isCompactShell);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden text-foreground selection:bg-primary/30">
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
        compact={isCompactShell}
      />

      <ShellContent
        week={week}
        isInitialized={isInitialized}
        eventLogOpen={eventLogOpen}
        setEventLogOpen={setEventLogOpen}
        isCompactShell={isCompactShell}
        pathname={location.pathname}
        results={results}
        clearResults={clearResults}
        resetOpen={resetOpen}
        setResetOpen={setResetOpen}
        doReset={doReset}
      >
        {children}
      </ShellContent>
    </div>
  );
}
