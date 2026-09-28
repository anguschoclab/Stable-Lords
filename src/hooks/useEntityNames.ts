import { useMemo } from 'react';
import { useGameStore, type GameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import type { GameState } from '@/types/state.types';

type NameSource = Pick<GameState, 'roster' | 'graveyard' | 'retired' | 'rivals' | 'player'>;

/** All known warrior names — player roster, fallen, retired, and rival rosters. */
export function collectWarriorNames(
  state: Pick<NameSource, 'roster' | 'graveyard' | 'retired' | 'rivals'>
): string[] {
  const names = new Set<string>();
  for (const w of state.roster ?? []) names.add(w.name);
  for (const w of state.graveyard ?? []) names.add(w.name);
  for (const w of state.retired ?? []) names.add(w.name);
  for (const r of state.rivals ?? []) {
    for (const w of r.roster) names.add(w.name);
  }
  return [...names];
}

/** All known stable names — the player's and each rival owner's. */
export function collectStableNames(
  state: Pick<NameSource, 'player' | 'rivals'>
): string[] {
  const names = new Set<string>();
  if (state.player?.stableName) names.add(state.player.stableName);
  for (const r of state.rivals ?? []) {
    if (r.owner?.stableName) names.add(r.owner.stableName);
  }
  return [...names];
}

/**
 * Warrior + stable name sets for EntityLink linkification, derived from the
 * roster/graveyard/retired/rivals/player store slice.
 */
export function useEntityNames(): { warriorNames: string[]; stableNames: string[] } {
  const state = useGameStore(
    useShallow((s: GameStore) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
      player: s.player,
    }))
  );

  const { roster, graveyard, retired, rivals, player } = state;
  const warriorNames = useMemo(
    () => collectWarriorNames({ roster, graveyard, retired, rivals }),
    [roster, graveyard, retired, rivals]
  );
  const stableNames = useMemo(
    () => collectStableNames({ player, rivals }),
    [player, rivals]
  );

  return { warriorNames, stableNames };
}
