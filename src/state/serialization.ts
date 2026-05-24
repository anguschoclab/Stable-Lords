/**
 * State Serialization Utilities
 * Handles serialization and reconstruction of game state for worker transfer and persistence.
 */
import type { GameState } from '@/types/state.types';
import type { GameStore } from './useGameStore';

/**
 * Helper to strip non-serializable fields before worker transfer.
 * Removes computed maps and caches that cannot be serialized.
 *
 * @param state - The state to strip
 * @returns The state with non-serializable fields removed
 */
export function stripNonSerializable<
  T extends {
    warriorMap?: unknown;
    cachedMetaDrift?: unknown;
    warriorToStableMap?: unknown;
    rivalMap?: unknown;
  }
>(
  state: T
): Omit<T, 'warriorMap' | 'cachedMetaDrift' | 'warriorToStableMap' | 'rivalMap'> {
  const { warriorMap, cachedMetaDrift, warriorToStableMap, rivalMap, ...rest } = state; // eslint-disable-line @typescript-eslint/no-unused-vars
  return rest;
}

// Type for the extracted values from GameStore that we compare for change detection
// Note: This only includes properties that are directly extracted from store slices
type GameStateValues = {
  treasury: number;
  ledger: GameState['ledger'];
  roster: GameState['roster'];
  graveyard: GameState['graveyard'];
  retired: GameState['retired'];
  recruitPool: GameState['recruitPool'];
  insightTokens: GameState['insightTokens'];
  arenaHistory: GameState['arenaHistory'];
  player: GameState['player'];
  week: GameState['week'];
  day: GameState['day'];
  season: GameState['season'];
  weather: GameState['weather'];
  promoters: GameState['promoters'];
  boutOffers: GameState['boutOffers'];
  rivals: GameState['rivals'];
  gazettes: GameState['gazettes'];
  scoutReports: GameState['scoutReports'];
  unacknowledgedDeaths: GameState['unacknowledgedDeaths'];
  rosterBonus: GameState['rosterBonus'];
  tournaments: GameState['tournaments'];
  isTournamentWeek: GameState['isTournamentWeek'];
  activeTournamentId: GameState['activeTournamentId'];
  year: GameState['year'];
  popularity: GameState['popularity'];
  fame: GameState['fame'];
  realmRankings: GameState['realmRankings'];
  awards: GameState['awards'];
  trainers: GameState['trainers'];
  hiringPool: GameState['hiringPool'];
  trainingAssignments: GameState['trainingAssignments'];
  seasonalGrowth: GameState['seasonalGrowth'];
  restStates: GameState['restStates'];
  crowdMood: GameState['crowdMood'];
  moodHistory: GameState['moodHistory'];
  newsletter: GameState['newsletter'];
  hallOfFame: GameState['hallOfFame'];
  isFTUE: GameState['isFTUE'];
  ftueStep: GameState['ftueStep'];
  ftueComplete: GameState['ftueComplete'];
  coachDismissed: GameState['coachDismissed'];
  rivalries: GameState['rivalries'];
  matchHistory: GameState['matchHistory'];
  ownerGrudges: GameState['ownerGrudges'];
  phase: GameState['phase'];
  playerChallenges: GameState['playerChallenges'];
  playerAvoids: GameState['playerAvoids'];
  lastSimulationReport: import('@/types/combat.types').FightOutcome | undefined;
};

let lastResult: GameState | null = null;
let lastStoreValues: GameStateValues | null = null;

/**
 * Reconstruct game state from store slices.
 * Extracts all relevant fields from the store and combines them into a GameState object.
 * Uses change detection to avoid unnecessary reconstruction.
 *
 * @param store - The game store
 * @returns The reconstructed game state
 */
export function reconstructGameState(store: GameStore): GameState {
  const currentValues = {
    treasury: store.treasury,
    ledger: store.ledger,
    roster: store.roster,
    graveyard: store.graveyard,
    retired: store.retired,
    recruitPool: store.recruitPool,
    insightTokens: store.insightTokens,
    arenaHistory: store.arenaHistory,
    player: store.player,
    week: store.week,
    day: store.day,
    season: store.season,
    weather: store.weather,
    promoters: store.promoters,
    boutOffers: store.boutOffers,
    rivals: store.rivals,
    gazettes: store.gazettes,
    scoutReports: store.scoutReports,
    unacknowledgedDeaths: store.unacknowledgedDeaths,
    rosterBonus: store.rosterBonus,
    tournaments: store.tournaments,
    isTournamentWeek: store.isTournamentWeek,
    activeTournamentId: store.activeTournamentId,
    year: store.year,
    popularity: store.popularity,
    fame: store.fame,
    realmRankings: store.realmRankings,
    awards: store.awards,
    trainers: store.trainers,
    hiringPool: store.hiringPool,
    trainingAssignments: store.trainingAssignments,
    seasonalGrowth: store.seasonalGrowth,
    restStates: store.restStates,
    crowdMood: store.crowdMood,
    moodHistory: store.moodHistory,
    newsletter: store.newsletter,
    hallOfFame: store.hallOfFame,
    isFTUE: store.isFTUE,
    ftueStep: store.ftueStep,
    ftueComplete: store.ftueComplete,
    coachDismissed: store.coachDismissed,
    rivalries: store.rivalries,
    matchHistory: store.matchHistory,
    ownerGrudges: store.ownerGrudges,
    phase: store.phase,
    playerChallenges: store.playerChallenges,
    playerAvoids: store.playerAvoids,
    lastSimulationReport: store.lastSimulationReport,
  };

  if (lastResult && lastStoreValues) {
    let changed = false;
    const keys = Object.keys(currentValues) as Array<keyof GameStateValues>;
    for (const key of keys) {
      if (currentValues[key] !== lastStoreValues[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return lastResult;
  }

  const result: GameState = {
    meta: {
      gameName: 'Stable Lords',
      version: '2.1.0-hardened',
      createdAt: store.lastSavedAt || new Date().toISOString(),
    },
    ...currentValues,
    coachDismissed: store.coachDismissed || [],
    rivalries: store.rivalries || [],
    matchHistory: store.matchHistory || [],
    ownerGrudges: store.ownerGrudges || [],
    phase: store.phase || 'planning',
    playerChallenges: store.playerChallenges || [],
    playerAvoids: store.playerAvoids || [],
    // Type assertion to handle FightOutcome vs SimulationReport mismatch
    // This preserves existing behavior while extracting the logic
    lastSimulationReport: store.lastSimulationReport as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  lastResult = result;
  lastStoreValues = currentValues;
  return result;
}

/**
 * Clear the reconstruction cache.
 * Should be called when the store is reset or a new game is loaded.
 */
export function clearReconstructionCache(): void {
  lastResult = null;
  lastStoreValues = null;
}
