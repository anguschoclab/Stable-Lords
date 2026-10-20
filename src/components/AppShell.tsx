import { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

import { useRivalryAlerts } from '@/hooks/useRivalryAlerts';
import { useAudioSync } from '@/hooks/useAudioSync';
import { useNavTrailRecorder } from '@/components/layout/breadcrumbs/useNavTrailRecorder';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useWeekExecution } from '@/hooks/useWeekExecution';
import { useRouteAwareEventLog, useShellState, ShellTop, ShellContent } from './appShell/chrome';

/**
 * App shell.
 * @param - { children }.
 */
/** Application shell: header, CTA, and routed content frame. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const shell = useShellState();
  const { week, isInitialized, eventLogOpen, setEventLogOpen, initialize } = shell;
  const { doReset } = shell;
  const isCompactShell = useMediaQuery('(max-width: 1023px)');
  const location = useLocation();
  const activePath = location.pathname;
  const [resetOpen, setResetOpen] = useState(false);
  const { results, clearResults } = useWeekExecution();

  useRivalryAlerts();
  useAudioSync();
  useNavTrailRecorder();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useRouteAwareEventLog(activePath, isCompactShell);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden text-foreground selection:bg-primary/30">
      <ShellTop
        shell={shell}
        compact={isCompactShell}
        onResetPrompt={() => setResetOpen(true)}
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
