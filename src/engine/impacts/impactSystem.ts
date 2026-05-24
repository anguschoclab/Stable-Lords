import type { GameState, StateImpact, ImpactHandler } from './types';
import { economyHandlers } from './economy';
import { warriorsHandlers } from './warriors';
import { worldHandlers } from './world';
import { promotersHandlers } from './promoters';
import { tournamentsHandlers } from './tournaments';
import { trainingHandlers } from './training';
import { arenaHandlers } from './arena';
import { narrativeHandlers } from './narrative';
import { rivalsHandlers } from './rivals';
import { socialHandlers } from './social';
import { awardsHandlers } from './awards';

// Re-export types for backward compatibility
export type { StateImpact, ImpactHandler } from './types';

/**
 * Combined impact handlers from all domains.
 */
const impactHandlers: { [K in keyof StateImpact]-?: ImpactHandler<K> } = {
  ...economyHandlers,
  ...warriorsHandlers,
  ...worldHandlers,
  ...promotersHandlers,
  ...tournamentsHandlers,
  ...trainingHandlers,
  ...arenaHandlers,
  ...narrativeHandlers,
  ...rivalsHandlers,
  ...socialHandlers,
  ...awardsHandlers,
};

/**
 * Applies a list of state impacts to the current game state.
 *
 * @param state - The current game state
 * @param impacts - An array of state impacts to apply
 * @returns A new game state with the impacts applied
 */
export function resolveImpacts(state: GameState, impacts: StateImpact[]): GameState {
  const newState = { ...state };
  for (const impact of impacts) {
    (Object.keys(impact) as Array<keyof StateImpact>).forEach((key) => {
      const value = impact[key];
      if (value !== undefined) {
        const handler = impactHandlers[key] as ImpactHandler<typeof key>;
        if (handler) {
          handler(newState, value as any); // eslint-disable-line @typescript-eslint/no-explicit-any -- Cast only here because of the generic key loss in forEach
        }
      }
    });
  }
  return newState;
}

// Merge strategy configuration
type MergeStrategy = 'accumulate' | 'append' | 'mapMerge' | 'dictMerge' | 'replace';

type MergeConfig = {
  [K in keyof StateImpact]: { strategy: MergeStrategy; defaultValue: StateImpact[K] };
};

const MERGE_CONFIG: MergeConfig = {
  treasuryDelta: { strategy: 'accumulate', defaultValue: 0 },
  fameDelta: { strategy: 'accumulate', defaultValue: 0 },
  popularityDelta: { strategy: 'accumulate', defaultValue: 0 },
  rosterUpdates: { strategy: 'mapMerge', defaultValue: new Map() },
  rivalsUpdates: { strategy: 'mapMerge', defaultValue: new Map() },
  newsletterItems: { strategy: 'append', defaultValue: [] },
  ledgerEntries: { strategy: 'append', defaultValue: [] },
  graveyard: { strategy: 'append', defaultValue: [] },
  arenaHistory: { strategy: 'append', defaultValue: [] },
  matchHistory: { strategy: 'append', defaultValue: [] },
  restStates: { strategy: 'append', defaultValue: [] },
  insightTokens: { strategy: 'append', defaultValue: [] },
  awards: { strategy: 'append', defaultValue: [] },
  retired: { strategy: 'append', defaultValue: [] },
  scoutReports: { strategy: 'append', defaultValue: [] },
  hallOfFame: { strategy: 'append', defaultValue: [] },
  moodHistory: { strategy: 'append', defaultValue: [] },
  playerChallenges: { strategy: 'append', defaultValue: [] },
  playerAvoids: { strategy: 'append', defaultValue: [] },
  coachDismissed: { strategy: 'append', defaultValue: [] },
  unacknowledgedDeaths: { strategy: 'append', defaultValue: [] },
  seasonalGrowth: { strategy: 'replace', defaultValue: [] },
  rosterRemovals: { strategy: 'append', defaultValue: [] },
  tournaments: { strategy: 'replace', defaultValue: undefined },
  recruitPool: { strategy: 'replace', defaultValue: undefined },
  realmRankings: { strategy: 'replace', defaultValue: undefined },
  boutOffers: { strategy: 'dictMerge', defaultValue: undefined },
  promoters: { strategy: 'replace', defaultValue: undefined },
  trainers: { strategy: 'replace', defaultValue: undefined },
  hiringPool: { strategy: 'replace', defaultValue: undefined },
  gazettes: { strategy: 'replace', defaultValue: undefined },
  ownerGrudges: { strategy: 'replace', defaultValue: undefined },
  rivalries: { strategy: 'replace', defaultValue: undefined },
  trainingAssignments: { strategy: 'replace', defaultValue: undefined },
  lastSimulationReport: { strategy: 'replace', defaultValue: undefined },
  isTournamentWeek: { strategy: 'replace', defaultValue: undefined },
  activeTournamentId: { strategy: 'replace', defaultValue: undefined },
  day: { strategy: 'replace', defaultValue: undefined },
  week: { strategy: 'replace', defaultValue: undefined },
  season: { strategy: 'replace', defaultValue: undefined },
  weather: { strategy: 'replace', defaultValue: undefined },
  crowdMood: { strategy: 'replace', defaultValue: undefined },
};

// 🌩️ Pure helpers for merging strategies (Strategy Pattern)
const mergeStrategies: Record<MergeStrategy, (merged: any, key: string, value: any) => void> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  accumulate: (merged, key, value) => {
    if (typeof value === 'number') {
      merged[key] = (merged[key] || 0) + value;
    }
  },
  append: (merged, key, value) => {
    if (Array.isArray(value)) {
      merged[key] = (merged[key] || []).concat(value);
    }
  },
  mapMerge: (merged, key, value) => {
    if (value instanceof Map) {
      const targetMap = merged[key] as Map<string, object>;
      value.forEach((val, mapKey) => {
        const existing = targetMap.get(mapKey) || {};
        targetMap.set(mapKey, { ...existing, ...val });
      });
    }
  },
  dictMerge: (merged, key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      merged[key] = { ...(merged[key] ?? {}), ...value };
    }
  },
  replace: (merged, key, value) => {
    merged[key] = value;
  },
};

/**
 * Merges multiple state impacts into a single combined impact.
 * Uses specific merge strategies (accumulate, append, replace, etc.) for each field.
 *
 * @param impacts - An array of state impacts to merge
 * @returns A single merged state impact
 */
export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = {} as StateImpact;

  // Initialize merged with default values
  (Object.keys(MERGE_CONFIG) as Array<keyof StateImpact>).forEach((key) => {
    const config = MERGE_CONFIG[key];
    if (!config) return;
    if (Array.isArray(config.defaultValue)) {
      (merged as any)[key] = [...config.defaultValue]; // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (config.defaultValue instanceof Map) {
      (merged as any)[key] = new Map(config.defaultValue as never); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      (merged as any)[key] = config.defaultValue; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  });

  for (const imp of impacts) {
    (Object.keys(MERGE_CONFIG) as Array<keyof StateImpact>).forEach((key) => {
      const config = MERGE_CONFIG[key];
      if (!config) return;
      const value = imp[key];
      if (value === undefined || value === null) return;

      const strategyFn = mergeStrategies[config.strategy];
      if (strategyFn) {
        strategyFn(merged, key, value);
      }
    });
  }

  return merged;
}
