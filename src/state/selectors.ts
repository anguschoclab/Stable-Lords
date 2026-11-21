import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from './useGameStore';
import { reconstructGameState } from './serialization';

/** --- Fine-Grained Selectors --- */
/** Full engine-shaped GameState reconstructed from the store's slices. */
export const useWorldState = () => useGameStore(reconstructGameState);

/** The state subset feeding `computeStableReputation`. */
export const useReputationState = () =>
  useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      arenaHistory: s.arenaHistory,
      newsletter: s.newsletter,
      player: s.player,
      fame: s.fame,
      trainingAssignments: s.trainingAssignments,
      trainers: s.trainers,
    }))
  );

/** Arena preferences — used by ArenaView, BoutViewer, ArenaSettings (3 components). */
export const useArenaPreferences = () => useGameStore((s) => s.arenaPreferences);

/** Bookmarks array — for pages that must re-render on bookmark changes. */
export const useBookmarks = () => useGameStore((s) => s.bookmarks);

/** Warrior/stable name-resolution state — feeds resolveWarriorName/resolveStableName/findWarrior. */
export const useWarriorNameState = () =>
  useGameStore(
    useShallow((s) => ({
      player: s.player,
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
    }))
  );
