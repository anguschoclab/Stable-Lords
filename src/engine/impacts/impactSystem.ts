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
  for (let i = 0; i < impacts.length; i++) {
    const impact = impacts[i];
    if (!impact) continue;
    for (const key in impact) {
      if (Object.prototype.hasOwnProperty.call(impact, key)) {
        const k = key as keyof StateImpact;
        const value = impact[k];
        if (value !== undefined) {
          const handler = impactHandlers[k];
          if (handler) {
            handler(newState, value as never);
          }
        }
      }
    }
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
const mergeStrategies: Record<
  MergeStrategy,
  (merged: StateImpact, key: keyof StateImpact, value: unknown) => void
> = {
  accumulate: (merged, key, value) => {
    const m = merged as Record<keyof StateImpact, unknown>;
    if (typeof value === 'number') {
      m[key] = ((m[key] as number | undefined) || 0) + value;
    }
  },
  append: (merged, key, value) => {
    const m = merged as Record<keyof StateImpact, unknown>;
    if (Array.isArray(value)) {
      m[key] = ((m[key] as unknown[] | undefined) || []).concat(value);
    }
  },
  mapMerge: (merged, key, value) => {
    if (value instanceof Map) {
      const targetMap = (merged as Record<keyof StateImpact, unknown>)[key] as Map<string, object>;
      value.forEach((val, mapKey) => {
        const existing = targetMap.get(mapKey) || {};
        targetMap.set(mapKey, { ...existing, ...val });
      });
    }
  },
  dictMerge: (merged, key, value) => {
    const m = merged as Record<keyof StateImpact, unknown>;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      m[key] = { ...((m[key] as Record<string, unknown> | undefined) ?? {}), ...(value as Record<string, unknown>) };
    }
  },
  replace: (merged, key, value) => {
    (merged as Record<keyof StateImpact, unknown>)[key] = value;
  },
};

/**
 * Merges multiple state impacts into a single combined impact.
 * Uses specific merge strategies (accumulate, append, replace, etc.) for each field.
 *
 * @param impacts - An array of state impacts to merge
 * @returns A single merged state impact
 */
const MERGE_KEYS = Object.keys(MERGE_CONFIG) as Array<keyof StateImpact>;

/**
 * Merges multiple state impacts into a single combined impact.
 * Uses specific merge strategies (accumulate, append, replace, etc.) for each field.
 *
 * @param impacts - An array of state impacts to merge
 * @returns A single merged state impact
 */
export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = {} as StateImpact;

  // Initialize merged with default values using standard for loop
  for (let i = 0; i < MERGE_KEYS.length; i++) {
    const key = MERGE_KEYS[i];
    const config = MERGE_CONFIG[key];
    if (!config) continue;
    const m = merged as Record<keyof StateImpact, unknown>;
    if (Array.isArray(config.defaultValue)) {
      m[key] = [...config.defaultValue];
    } else if (config.defaultValue instanceof Map) {
      m[key] = new Map(config.defaultValue as never);
    } else {
      m[key] = config.defaultValue;
    }
  }

  // Iterate over actual impact objects
  for (let i = 0; i < impacts.length; i++) {
    const imp = impacts[i];
    if (!imp) continue;

    // Only iterate over properties present in the impact object
    for (const key in imp) {
      if (Object.prototype.hasOwnProperty.call(imp, key)) {
        const config = MERGE_CONFIG[key as keyof StateImpact];
        if (!config) continue;
        const value = imp[key as keyof StateImpact];
        if (value === undefined || value === null) continue;

        const strategyFn = mergeStrategies[config.strategy];
        if (strategyFn) {
          strategyFn(merged, key, value);
        }
      }
    }
  }

  return merged;
}

