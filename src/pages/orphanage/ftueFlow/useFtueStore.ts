import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';

/** Store slice for the FTUE flow — player identity, graveyard, and actions. */
export function useFtueStore() {
  return useGameStore(
    useShallow((s) => ({
      player: s.player,
      graveyard: s.graveyard,
      ftueComplete: s.ftueComplete,
      initializeStable: s.initializeStable,
      setState: s.setState,
      returnToTitle: s.returnToTitle,
      saveCurrentState: s.saveCurrentState,
    }))
  );
}
