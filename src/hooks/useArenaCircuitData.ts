import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';

/**
 * Arena-circuit slice: the live champions map plus the rosters/player needed
 * to render circuit surfaces (ArenaCircuit page, arena-hub crowns widget).
 */
export function useArenaCircuitData() {
  return useGameStore(
    useShallow((s) => ({
      arenaChampions: s.arenaChampions,
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
    }))
  );
}
