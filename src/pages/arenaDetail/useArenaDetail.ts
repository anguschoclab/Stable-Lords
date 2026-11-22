import { useMemo } from 'react';
import { tryGetArenaById, getArenaLore } from '@/data/arenas';
import { getPackArenaLore } from '@/lib/contentPacks';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { describeArenaEffects } from '@/engine/narrative/arenaNarrative';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import {
  CHAMPIONSHIP_EXCLUDED_ARENAS,
  owningStableOf,
  topContenders,
} from '@/engine/championship/arenaChampionship';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { findWarriorById } from '@/engine/core/warriorLookup';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { getFightsForArena } from '@/engine/core/historyUtils';
import type { GameState } from '@/types/state.types';
import { statusBadge, useArenaDetailStore, useArenaBoards } from './useArenaSelectors';

/** All arena-detail derived state: champion, boards, ladder, history, bouts. */
export function useArenaDetail(arenaId: string) {
  const arena = useMemo(() => tryGetArenaById(arenaId), [arenaId]);

  const store = useArenaDetailStore();
  const state = store as unknown as GameState;

  const title = store.arenaChampions[arenaId];
  const reign = title?.champion ?? null;
  const champWarrior = reign ? findWarriorById(state, reign.warriorId) : undefined;
  const champStable = reign ? owningStableOf(state, reign.warriorId) : null;
  const isExcluded = CHAMPIONSHIP_EXCLUDED_ARENAS.has(arenaId);
  const badge = statusBadge(title);
  const effects = useMemo(() => (arena ? describeArenaEffects(arenaId) : []), [arena, arenaId]);
  const lore = useMemo(
    () =>
      arena ? [...getArenaLore(arenaId), ...getPackArenaLore(store.contentPacks, arenaId)] : [],
    [arena, arenaId, store.contentPacks]
  );

  const { lb, styleLeaders, stableStandings } = useArenaBoards(arena, arenaId, store, state);

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
    lore,
    lb,
    styleLeaders,
    stableStandings,
    recentBouts,
    ladder,
    history,
    champId: reign?.warriorId,
  };
}
