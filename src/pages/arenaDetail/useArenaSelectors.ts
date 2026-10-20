import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { getAllArenas } from '@/data/arenas';
import {
  calculateArenaLeaderboard,
  calculateArenaStyleLeaders,
  calculateArenaStableStandings,
} from '@/engine/core/leaderboards';
import type { GameState, ArenaTitle } from '@/types/state.types';

/** Maps an arena title's reign state to a display label and badge styling. */
export function statusBadge(title: ArenaTitle | undefined): { label: string; className: string } {
  if (!title?.champion)
    return { label: 'TITLE VACANT', className: 'border-white/15 text-muted-foreground/70' };
  if (title.status === 'dormant')
    return { label: 'DORMANT', className: 'border-accent/30 text-accent/80' };
  if (title.status === 'pendingReengagement')
    return { label: 'RE-ENGAGING', className: 'border-arena-gold/40 text-arena-gold' };
  return { label: 'REIGNING CHAMPION', className: 'border-arena-gold/40 text-arena-gold' };
}

export function useArenaDetailStore() {
  return useGameStore(
    useShallow((s) => ({
      arenaChampions: s.arenaChampions,
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
      arenaHistory: s.arenaHistory,
      relinquishArenaTitle: s.relinquishArenaTitle,
      contentPacks: s.contentPacks,
    }))
  );
}

/** Arena leaderboard, style leaders, and stable standings memos. */
export function useArenaBoards(
  arena: ReturnType<typeof getAllArenas>[number] | undefined,
  arenaId: string,
  store: ReturnType<typeof useArenaDetailStore>,
  state: GameState
) {
  const lb = useMemo(
    () =>
      arena
        ? calculateArenaLeaderboard(arenaId, store.roster, store.player.stableName, store.rivals)
        : undefined,
    [arena, arenaId, store.roster, store.rivals, store.player.stableName]
  );
  const styleLeaders = useMemo(
    () =>
      arena
        ? calculateArenaStyleLeaders(arenaId, store.roster, store.player.stableName, store.rivals)
        : {},
    [arena, arenaId, store.roster, store.rivals, store.player.stableName]
  );
  const stableStandings = useMemo(
    () => (arena ? calculateArenaStableStandings(state, arenaId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [arena, arenaId, store.roster, store.rivals, store.arenaChampions]
  );
  return { lb, styleLeaders, stableStandings };
}
