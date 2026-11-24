import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from './useGameStore';
import { reconstructGameState } from './serialization';
import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';

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

// ─── Scoped world-state selectors ───────────────────────────────────────────
// Narrow replacements for useWorldState() in components whose reads are a
// fixed field subset — a tracked-field write elsewhere no longer re-renders
// them. Each selector mirrors the entity-index fields when the consumer
// resolves names (findWarrior/resolveWarriorName/resolveStableName), and
// derives absoluteWeek from year+week exactly as reconstructGameState does.

/** Rivalry-alert detection (useRivalryAlerts): history + graveyard + rivals. */
export const useRivalryAlertState = () =>
  useGameStore(
    useShallow((s) => ({
      arenaHistory: s.arenaHistory,
      graveyard: s.graveyard,
      rivals: s.rivals,
    }))
  );

/** Hall of Fights (useHallData + LifetimeStatsRow): history, week, lifetime. */
export const useHallOfFightsState = () =>
  useGameStore(
    useShallow((s) => ({
      arenaHistory: s.arenaHistory,
      week: s.week,
      lifetimeStats: s.lifetimeStats,
    }))
  );

/** Training assignments hook state. */
export const useTrainingAssignmentState = () =>
  useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      season: s.season,
      seasonalGrowth: s.seasonalGrowth,
      trainingAssignments: s.trainingAssignments,
    }))
  );

/** Next-bout widget: tournament/next-bout inputs + entity-index fields. */
export const useNextBoutState = () =>
  useGameStore(
    useShallow((s) => ({
      activeTournamentId: s.activeTournamentId,
      tournaments: s.tournaments,
      player: s.player,
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
    }))
  );

/** Gazette page state — week + season + gazette issues. */
export const useGazetteState = () =>
  useGameStore(
    useShallow((s) => ({
      week: s.week,
      season: s.season,
      gazettes: s.gazettes,
    }))
  );

/**
 * Bloodfeud marks: feud data + kill history + the entity-index fields the
 * name resolvers need. absoluteWeek is derived like reconstructGameState.
 */
export const useBloodfeudState = () =>
  useGameStore(
    useShallow((s) => ({
      absoluteWeek: deriveAbsoluteWeek(s.year, s.week),
      week: s.week,
      bloodfeudMarks: s.bloodfeudMarks,
      killEvents: s.killEvents,
      player: s.player,
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
    }))
  );

/** Booking office: offers, promoter/roster reads, rivals, derived week. */
export const useBookingOfficeState = () =>
  useGameStore(
    useShallow((s) => ({
      promoters: s.promoters,
      boutOffers: s.boutOffers,
      roster: s.roster,
      week: s.week,
      absoluteWeek: deriveAbsoluteWeek(s.year, s.week),
      rivals: s.rivals,
    }))
  );
