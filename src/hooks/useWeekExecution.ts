import { useCallback, useRef, useState } from 'react';
import * as Comlink from 'comlink';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import type { BoutResult } from '@/engine/bout';
import { engineProxy } from '@/engine/runtime/workerProxy';
import { engineSession } from '@/engine/runtime/session';
import type { AutosimResult } from '@/engine/autosim/autosim';

/** Reads the post-advance store state into bout results + death toasts. */
function applyPostAdvanceState(setResults: (r: BoutResult[]) => void): void {
  const storeState = useGameStore.getState();
  if (storeState.lastWeekBoutDisplay?.results) {
    setResults(storeState.lastWeekBoutDisplay.results);
  }

  // Emit death toasts from lastWeekBoutDisplay (replaces engineEventBus-based toasts
  // that only worked when processWeekBouts ran on the main thread)
  if (storeState.lastWeekBoutDisplay?.deathNames) {
    storeState.lastWeekBoutDisplay.deathNames.forEach((name) => {
      toast(`${name} has fallen in the arena.`, {
        description: 'The stands fall briefly silent.',
        duration: 6000,
      });
    });
  }
}

/**
 * Runs the worker-pool autosim with progress callbacks, then loads the final
 * state. `undefined` from runAutosim means the epoch moved mid-run — discard.
 */
async function runAutosimSession(
  gameState: ReturnType<typeof useWorldState>,
  weeks: number,
  councilAutoPilot: boolean,
  onProgress: (current: number, total: number) => void
): Promise<AutosimResult | 'epoch-moved' | 'failed'> {
  try {
    const result = await engineSession.runExclusive(() =>
      // onProgress must be a top-level arg: Comlink only detects proxy
      // markers on direct arguments — a nested callback is structured-
      // cloned into the worker and throws DataCloneError.
      engineProxy.runAutosim(
        gameState,
        { weeksToSim: weeks, councilAutoPilot },
        Comlink.proxy((currentWeek: number) => onProgress(currentWeek, weeks))
      )
    );
    return result ?? 'epoch-moved';
  } catch (err) {
    console.error('Autosim failed', err);
    toast.error('Auto-simulation failed.');
    return 'failed';
  }
}

/** Autosim lifecycle state + the start handler. */
function useAutosim(
  gameState: ReturnType<typeof useWorldState>,
  setSimulating: (b: boolean) => void,
  loadGame: ReturnType<typeof useGameStore.getState>['loadGame']
) {
  const [autosimming, setAutosimming] = useState(false);
  const autosimmingRef = useRef(false);
  const [autosimProgress, setAutosimProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);

  const handleStartAutosim = useCallback(
    async (weeks: number, options?: { councilAutoPilot?: boolean }) => {
      if (autosimmingRef.current || useGameStore.getState().isSimulating) return;
      autosimmingRef.current = true;
      setAutosimming(true);
      setSimulating(true);
      setAutosimResult(null);
      try {
        const result = await runAutosimSession(
          gameState,
          weeks,
          options?.councilAutoPilot ?? false,
          (currentWeek, total) => setAutosimProgress({ current: currentWeek, total })
        );
        // 'epoch-moved' → epoch moved mid-run (loadGame/reset); discard the result.
        if (result === 'epoch-moved' || result === 'failed') return;
        setAutosimResult(result);
        const currentStore = useGameStore.getState();
        loadGame(currentStore.activeSlotId || 'autosave', result.finalState);
      } finally {
        autosimmingRef.current = false;
        setAutosimming(false);
        setSimulating(false);
        setAutosimProgress(null);
      }
    },
    [gameState, loadGame, setSimulating]
  );

  const clearAutosimResult = useCallback(() => setAutosimResult(null), []);

  /**
   * Cooperative stop — flips the worker-local cancel flag; the autosim loop
   * exits at the next week boundary and returns its partial result through
   * the normal commit path (finalState still lands via loadGame).
   */
  const stopAutosim = useCallback(() => {
    void engineProxy.cancelSim();
  }, []);

  return {
    handleStartAutosim,
    stopAutosim,
    autosimming,
    autosimProgress,
    autosimResult,
    setAutosimResult,
    clearAutosimResult,
  };
}

/**
 * Day-or-week advance with its conclusion toast.
 *
 * The store layer swallows worker failures (`runEngineJob` catch →
 * console.error), so the only reliable signal is whether the calendar moved —
 * same detection pattern as useExecuteTournamentRound. An unchanged clock with
 * no other simulation in flight means the pipeline failed: say so instead of
 * claiming the week concluded.
 */
function useWeekAdvance(
  gameState: ReturnType<typeof useWorldState>,
  doAdvanceDay: () => Promise<unknown>,
  doAdvanceWeek: () => Promise<unknown>
) {
  return useCallback(async () => {
    const clockKey = (s: ReturnType<typeof useGameStore.getState>) =>
      `${s.absoluteWeek ?? 0}:${s.week}:${s.day}`;
    const before = clockKey(useGameStore.getState());

    if (gameState.isTournamentWeek) {
      await doAdvanceDay();
    } else {
      await doAdvanceWeek();
    }

    const after = useGameStore.getState();
    if (clockKey(after) === before) {
      if (!after.isSimulating) {
        toast.error('Resolution failed — the calendar did not advance.');
      }
      return;
    }

    if (gameState.isTournamentWeek) {
      toast.success(`Empire Day ${gameState.day + 1} — Week ${gameState.week} concluded.`);
    } else {
      toast.success(`Week ${gameState.week} concluded.`);
    }
  }, [gameState, doAdvanceDay, doAdvanceWeek]);
}

/**
 * Self-contained hook that owns the entire week-execution lifecycle.
 * Can be called from any component — no props required.
 * Replaces useCombatExecution as the single source of truth for
 * running bouts, advancing time, and running autosim.
 */
export function useWeekExecution() {
  const { doAdvanceDay, doAdvanceWeek, setSimulating, loadGame } = useGameStore(
    useShallow((s) => ({
      doAdvanceDay: s.doAdvanceDay,
      doAdvanceWeek: s.doAdvanceWeek,
      setSimulating: s.setSimulating,
      loadGame: s.loadGame,
    }))
  );

  const gameState = useWorldState();
  const advance = useWeekAdvance(gameState, doAdvanceDay, doAdvanceWeek);

  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [results, setResults] = useState<BoutResult[]>([]);

  const {
    handleStartAutosim,
    stopAutosim,
    autosimming,
    autosimProgress,
    autosimResult,
    setAutosimResult,
    clearAutosimResult,
  } = useAutosim(gameState, setSimulating, loadGame);

  const executeWeek = useCallback(async () => {
    if (runningRef.current) return;

    // No readiness gate: the week pipeline is also the recovery mechanism
    // (injury healing, fatigue decay, bankruptcy loan, roster-floor recruit).
    // Refusing to advance when the stable can't field a card soft-locks the
    // exact failure states the pipeline exists to rescue.
    runningRef.current = true;
    setRunning(true);
    setResults([]);

    try {
      await advance();

      // Populate results from store after advance completes
      applyPostAdvanceState(setResults);
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [advance]);

  const clearResults = useCallback(() => {
    setResults([]);
    clearAutosimResult();
  }, [clearAutosimResult]);

  return {
    executeWeek,
    running,
    results,
    clearResults,
    handleStartAutosim,
    stopAutosim,
    autosimming,
    autosimProgress,
    autosimResult,
    setAutosimResult,
    gameState,
  };
}
