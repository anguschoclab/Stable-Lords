import type { GameState } from '@/types/state.types';

/**
 * Cheap shape check for self-produced hot-state data.
 * Always runs (prod + dev) as a tripwire against corruption or incompatible saves.
 * Checks ALL required top-level fields from the GameState type — exhaustive, not representative.
 *
 * Does NOT check optional/computed fields that are stripped before serialization:
 * pendingResolutionData, lastWeekBoutDisplay, ftueStep, activeTournamentId,
 * lastSimulationReport, cachedMetaDrift, warriorMap, warriorToStableMap, rivalMap,
 * rivalryMap, grudgeMap, deferredBoutLogs, warriorToOfferIds
 */

const isPlainObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const META_STRING_FIELDS = ['gameName', 'version', 'createdAt'] as const;

const SCALAR_FIELDS = {
  boolean: ['ftueComplete', 'isFTUE', 'isTournamentWeek'],
  number: ['week', 'year', 'fame', 'popularity', 'treasury', 'rosterBonus', 'day'],
  string: ['phase', 'season', 'weather', 'crowdMood'],
} as const;

const OBJECT_FIELDS = ['player', 'promoters', 'boutOffers', 'realmRankings', 'progression'] as const;

const ARRAY_FIELDS = [
  'roster',
  'graveyard',
  'retired',
  'deadWarriorIds',
  'killEvents',
  'arenaHistory',
  'newsletter',
  'gazettes',
  'hallOfFame',
  'tournaments',
  'trainers',
  'hiringPool',
  'trainingAssignments',
  'seasonalGrowth',
  'rivals',
  'scoutReports',
  'restStates',
  'rivalries',
  'matchHistory',
  'playerChallenges',
  'playerAvoids',
  'recruitPool',
  'ownerGrudges',
  'insightTokens',
  'moodHistory',
  'unacknowledgedDeaths',
  'awards',
  'bookmarks',
  'coachDismissed',
  'ledger',
] as const;

/**
 * Returns true when `value` carries every required GameState field.
 * @param value - Candidate state object.
 */
export function isPlausibleGameState(value: unknown): value is GameState {
  if (!isPlainObject(value)) return false;

  const meta = value.meta;
  if (!isPlainObject(meta)) return false;
  if (!META_STRING_FIELDS.every((f) => typeof meta[f] === 'string')) return false;

  for (const [type, fields] of Object.entries(SCALAR_FIELDS)) {
    if (!fields.every((f) => typeof value[f] === type)) return false;
  }

  if (!OBJECT_FIELDS.every((f) => isPlainObject(value[f]))) return false;
  if (!ARRAY_FIELDS.every((f) => Array.isArray(value[f]))) return false;

  return true;
}
