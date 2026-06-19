import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useGameStore } from '@/state/useGameStore';
import { processWeekBouts, type BoutResult } from '@/engine/bout';
import type { AutosimResult } from '@/engine/autosim';
import type { GameState } from '@/types/state.types';
import { engineProxy } from '@/engine/workerProxy';

interface UseCombatExecutionParams {
  gameState: GameState;
  matchCardLength: number;
  fightReadyLength: number;
}

/**
 * Encapsulates the combat-execution and auto-simulation lifecycle for the Arena
 * Hub: panel visibility, results, in-flight flags, and the cycle/autosim
 * handlers that mutate game state.
 */
export function useCombatExecution({
  gameState,
  matchCardLength,
  fightReadyLength,
}: UseCombatExecutionParams) {
  const { doAdvanceDay, doAdvanceWeek, setSimulating, loadGame } = useGameStore();

  const [showCombat, setShowCombat] = useState(false);
  const [results, setResults] = useState<BoutResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autosimming, setAutosimming] = useState(false);
  const [autosimProgress, setAutosimProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExecuteCycle = useCallback(async () => {
    if (running) return;
    setRunning(true);
    if (matchCardLength === 0 && fightReadyLength < 2) {
      setRunning(false);
      toast.error('No valid pairings available for this mission.');
      return;
    }
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
        toast.success(`Empire Day ${gameState.day + 1} concluded.`);
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
      setRunning(false);
      setExpandedId(null);
    }
  }, [gameState, running, matchCardLength, fightReadyLength, doAdvanceDay, doAdvanceWeek]);

  const handleStartAutosim = useCallback(
    async (weeks: number) => {
      if (autosimming || useGameStore.getState().isSimulating) return;
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
        const store = useGameStore.getState();
        loadGame(store.activeSlotId || 'autosave', result.finalState);
      } catch (err) {
        console.error('Autosim failed', err);
        toast.error('Auto-simulation encountered an archive corruption.');
      } finally {
        setAutosimming(false);
        setSimulating(false);
      }
    },
    [gameState, loadGame, autosimming, setSimulating]
  );

  return {
    showCombat,
    setShowCombat,
    results,
    setResults,
    running,
    autosimming,
    autosimProgress,
    autosimResult,
    setAutosimResult,
    expandedId,
    setExpandedId,
    handleExecuteCycle,
    handleStartAutosim,
  };
}
