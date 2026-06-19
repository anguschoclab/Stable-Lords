import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { processWeekBouts, type BoutResult } from '@/engine/bout';
import { generatePairings } from '@/engine/bout/core/pairings';
import { isFightReady } from '@/engine/warriorStatus';
import { engineProxy } from '@/engine/workerProxy';
import type { AutosimResult } from '@/engine/autosim';
import type { Warrior } from '@/types/warrior.types';

/**
 * Self-contained hook that owns the entire week-execution lifecycle.
 * Can be called from any component — no props required.
 * Replaces useCombatExecution as the single source of truth for
 * running bouts, advancing time, and running autosim.
 */
export function useWeekExecution() {
  const store = useGameStore();
  const { doAdvanceDay, doAdvanceWeek, setSimulating, loadGame } = store;

  const gameState = useMemo(() => reconstructGameState(store), [store]);

  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const [results, setResults] = useState<BoutResult[]>([]);
  const [autosimming, setAutosimming] = useState(false);
  const autosimmingRef = useRef(false);
  const [autosimProgress, setAutosimProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);

  const fightReadyCount = useMemo(
    () => gameState.roster.filter((w: Warrior) => isFightReady(w)).length,
    [gameState.roster]
  );

  const matchCardLength = useMemo(
    () => generatePairings(gameState).length,
    [gameState]
  );

  const executeWeek = useCallback(async () => {
    if (runningRef.current) return;

    if (matchCardLength === 0 && fightReadyCount < 2) {
      toast.error('No warriors are ready to fight this week.');
      return;
    }

    runningRef.current = true;
    setRunning(true);
    setResults([]);

    const processed = processWeekBouts(gameState);
    setResults(processed.results);

    try {
      if (gameState.isTournamentWeek) {
        await doAdvanceDay(
          undefined,
          processed.results,
          processed.summary.deathNames,
          processed.summary.injuryNames
        );
        toast.success(`Empire Day ${gameState.day + 1} — Week ${gameState.week} concluded.`);
      } else {
        await doAdvanceWeek(
          undefined,
          processed.results,
          processed.summary.deathNames,
          processed.summary.injuryNames
        );
        toast.success(`Week ${gameState.week} concluded.`);
      }
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [gameState, matchCardLength, fightReadyCount, doAdvanceDay, doAdvanceWeek]);

  const clearResults = useCallback(() => {
    setResults([]);
    setAutosimResult(null);
  }, []);

  const handleStartAutosim = useCallback(
    async (weeks: number) => {
      if (autosimmingRef.current || useGameStore.getState().isSimulating) return;
      autosimmingRef.current = true;
      setAutosimming(true);
      setSimulating(true);
      setAutosimResult(null);
      try {
        const result = await engineProxy.runAutosim(gameState, {
          weeksToSim: weeks,
          onProgress: (currentWeek: number) => {
            setAutosimProgress({ current: currentWeek, total: weeks });
          },
        });
        setAutosimResult(result);
        const currentStore = useGameStore.getState();
        loadGame(currentStore.activeSlotId || 'autosave', result.finalState);
      } catch (err) {
        console.error('Autosim failed', err);
        toast.error('Auto-simulation failed.');
      } finally {
        autosimmingRef.current = false;
        setAutosimming(false);
        setSimulating(false);
        setAutosimProgress(null);
      }
    },
    [gameState, loadGame, setSimulating]
  );

  return {
    executeWeek,
    running,
    results,
    clearResults,
    fightReadyCount,
    matchCardLength,
    handleStartAutosim,
    autosimming,
    autosimProgress,
    autosimResult,
    setAutosimResult,
    gameState,
  };
}
