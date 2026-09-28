import { useCallback } from 'react';
import { toast } from 'sonner';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { cryptoRandomInt } from '@/utils/cryptoRandom';
import { audioManager } from '@/lib/AudioManager';
import { engineProxy } from '@/engine/runtime/workerProxy';
import type { TournamentEntry } from '@/types/state.types';
import type { GameState } from '@/types/state.types';

interface ExecuteRoundDeps {
  tournament: TournamentEntry | null | undefined;
  activeSlotId: string | null;
  loadGame: (slot: string, state: GameState) => void;
  setSimulating: (v: boolean) => void;
}

/**
 * Resolves the next round of the live tournament bracket through the engine
 * worker, persists the result, and reports completion/failure via toast.
 */
export function useExecuteTournamentRound({
  tournament,
  activeSlotId,
  loadGame,
  setSimulating,
}: ExecuteRoundDeps) {
  return useCallback(async () => {
    if (!tournament) return;

    setSimulating(true);
    try {
      const state = useGameStore.getState();
      const currentFullState = reconstructGameState(state);

      const { updatedState, roundResults } = await engineProxy.resolveTournamentRound(
        currentFullState,
        tournament.id,
        cryptoRandomInt(0, 2147483647)
      );

      loadGame(activeSlotId || 'autosave', updatedState);
      audioManager.play('clash');
      toast.success(roundResults.length > 0 ? 'Round resolved.' : 'Tournament complete.');
    } catch (error) {
      console.error('Tournament resolution failed:', error);
      toast.error('Resolution failed.');
    } finally {
      setSimulating(false);
    }
  }, [tournament, activeSlotId, loadGame, setSimulating]);
}
