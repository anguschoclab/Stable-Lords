import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { getAllArenas } from '@/data/arenas';
import { describeArenaEffects } from '@/engine/narrative/arenaNarrative';
import {
  CHAMPIONSHIP_EXCLUDED_ARENAS,
  owningStableOf,
  topContenders,
} from '@/engine/championship/arenaChampionship';
import { findWarriorById } from '@/engine/core/warriorLookup';
import {
  calculateArenaLeaderboard,
  calculateArenaStyleLeaders,
  calculateArenaStableStandings,
} from '@/engine/core/leaderboards';
import { getFightsForArena } from '@/engine/core/historyUtils';
import type { GameState, ArenaTitle } from '@/types/state.types';

export function statusBadge(title: ArenaTitle | undefined): { label: string; className: string } {
  if (!title?.champion)
    return { label: 'TITLE VACANT', className: 'border-white/15 text-muted-foreground/70' };
  if (title.status === 'dormant')
    return { label: 'DORMANT', className: 'border-accent/30 text-accent/80' };
  if (title.status === 'pendingReengagement')
    return { label: 'RE-ENGAGING', className: 'border-arena-gold/40 text-arena-gold' };
  return { label: 'REIGNING CHAMPION', className: 'border-arena-gold/40 text-arena-gold' };
}

/** All arena-detail derived state: champion, boards, ladder, history, bouts. */
export function useArenaDetail(arenaId: string) {
  const arena = useMemo(() => getAllArenas().find((a) => a.id === arenaId), [arenaId]);

  const store = useGameStore(
    useShallow((s) => ({
      arenaChampions: s.arenaChampions,
      roster: s.roster,
      rivals: s.rivals,
      player: s.player,
      arenaHistory: s.arenaHistory,
      relinquishArenaTitle: s.relinquishArenaTitle,
    }))
  );
  const state = store as unknown as GameState;

  const title = store.arenaChampions[arenaId];
  const reign = title?.champion ?? null;
  const champWarrior = reign ? findWarriorById(state, reign.warriorId) : undefined;
  const champStable = reign ? owningStableOf(state, reign.warriorId) : null;
  const isExcluded = CHAMPIONSHIP_EXCLUDED_ARENAS.has(arenaId);
  const badge = statusBadge(title);
  const effects = useMemo(
    () => (arena ? describeArenaEffects(arenaId) : []),
    [arena, arenaId]
  );

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

  const recentBouts = useMemo(
    () => getFightsForArena(store.arenaHistory, arenaId).slice(-8).reverse(),
    [store.arenaHistory, arenaId]
  );

  // The queue behind the throne — the same eligibility ordering the
  // championship pass books title bouts from.
  const ladder = useMemo(
    () => (arena && !isExcluded ? topContenders(state, arenaId, 5) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [arena, arenaId, isExcluded, store.roster, store.rivals, store.arenaChampions]
  );

  const history = useMemo(() => [...(title?.history ?? [])].reverse(), [title]);

  return {
    arena,
    state,
    store,
    title,
    reign,
    champWarrior,
    champStable,
    isExcluded,
    badge,
    effects,
    lb,
    styleLeaders,
    stableStandings,
    recentBouts,
    ladder,
    history,
    champId: reign?.warriorId,
  };
}
