import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from './useGameStore';
import { reconstructGameState } from './serialization';

/** --- Fine-Grained Selectors --- */
export const useWorldState = () => useGameStore(reconstructGameState);

/**
 *
 */
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

// Arena preferences — used by ArenaView, BoutViewer, ArenaSettings (3 components)
/**
 *
 */
export const useArenaPreferences = () => useGameStore((s) => s.arenaPreferences);

// Bookmarks array — for bookmark-sensitive pages that need to re-render on bookmark changes
// Used by: Tournaments, Trainers, Scouting, PromoterDirectory, RosterWall (5 components)
/**
 *
 */
export const useBookmarks = () => useGameStore((s) => s.bookmarks);

// Warrior name resolution state — used by TournamentBracket (3 sub-components),
// TournamentSchedule, NextBoutWidget, HeadToHead (6 call sites across 4 files)
// Provides NameResolutionState shape for resolveWarriorName/resolveStableName/findWarrior
/**
 *
 */
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
