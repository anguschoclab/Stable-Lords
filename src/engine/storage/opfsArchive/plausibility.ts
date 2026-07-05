import type { GameState } from '@/types/state.types';

/**
 * Cheap shape check for self-produced hot-state data.
 * Always runs (prod + dev) as a tripwire against corruption or incompatible saves.
 * Checks ALL required top-level fields from the GameState type — exhaustive, not representative.
 *
 * Does NOT check optional/computed fields that are stripped before serialization:
 * pendingResolutionData, lastWeekBoutDisplay, ftueStep, activeTournamentId,
 * lastSimulationReport, cachedMetaDrift, warriorMap, warriorToStableMap, rivalMap,
 * rivalryMap, deferredBoutLogs, warriorToOfferIds
 */
export function isPlausibleGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;

  // meta: object with string gameName, version, createdAt
  if (typeof v.meta !== 'object' || v.meta === null || Array.isArray(v.meta)) return false;
  const meta = v.meta as Record<string, unknown>;
  if (typeof meta.gameName !== 'string') return false;
  if (typeof meta.version !== 'string') return false;
  if (typeof meta.createdAt !== 'string') return false;

  // Boolean scalars
  if (typeof v.ftueComplete !== 'boolean') return false;
  if (typeof v.isFTUE !== 'boolean') return false;
  if (typeof v.isTournamentWeek !== 'boolean') return false;

  // Number scalars
  if (typeof v.week !== 'number') return false;
  if (typeof v.year !== 'number') return false;
  if (typeof v.fame !== 'number') return false;
  if (typeof v.popularity !== 'number') return false;
  if (typeof v.treasury !== 'number') return false;
  if (typeof v.rosterBonus !== 'number') return false;
  if (typeof v.day !== 'number') return false;

  // String scalars
  if (typeof v.phase !== 'string') return false;
  if (typeof v.season !== 'string') return false;
  if (typeof v.weather !== 'string') return false;
  if (typeof v.crowdMood !== 'string') return false;

  // Object fields (non-null, non-array)
  if (typeof v.player !== 'object' || v.player === null || Array.isArray(v.player)) return false;
  if (typeof v.promoters !== 'object' || v.promoters === null || Array.isArray(v.promoters))
    return false;
  if (typeof v.boutOffers !== 'object' || v.boutOffers === null || Array.isArray(v.boutOffers))
    return false;
  if (
    typeof v.realmRankings !== 'object' ||
    v.realmRankings === null ||
    Array.isArray(v.realmRankings)
  )
    return false;
  if (typeof v.progression !== 'object' || v.progression === null || Array.isArray(v.progression))
    return false;

  // Array fields
  if (!Array.isArray(v.roster)) return false;
  if (!Array.isArray(v.graveyard)) return false;
  if (!Array.isArray(v.retired)) return false;
  if (!Array.isArray(v.arenaHistory)) return false;
  if (!Array.isArray(v.newsletter)) return false;
  if (!Array.isArray(v.gazettes)) return false;
  if (!Array.isArray(v.hallOfFame)) return false;
  if (!Array.isArray(v.tournaments)) return false;
  if (!Array.isArray(v.trainers)) return false;
  if (!Array.isArray(v.hiringPool)) return false;
  if (!Array.isArray(v.trainingAssignments)) return false;
  if (!Array.isArray(v.seasonalGrowth)) return false;
  if (!Array.isArray(v.rivals)) return false;
  if (!Array.isArray(v.scoutReports)) return false;
  if (!Array.isArray(v.restStates)) return false;
  if (!Array.isArray(v.rivalries)) return false;
  if (!Array.isArray(v.matchHistory)) return false;
  if (!Array.isArray(v.playerChallenges)) return false;
  if (!Array.isArray(v.playerAvoids)) return false;
  if (!Array.isArray(v.recruitPool)) return false;
  if (!Array.isArray(v.ownerGrudges)) return false;
  if (!Array.isArray(v.insightTokens)) return false;
  if (!Array.isArray(v.moodHistory)) return false;
  if (!Array.isArray(v.unacknowledgedDeaths)) return false;
  if (!Array.isArray(v.awards)) return false;
  if (!Array.isArray(v.bookmarks)) return false;
  if (!Array.isArray(v.coachDismissed)) return false;
  if (!Array.isArray(v.ledger)) return false;

  return true;
}
