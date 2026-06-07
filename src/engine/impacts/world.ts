/**
 * World Domain Impacts
 * Handles week, day, season, weather, recruit pool, seasonal growth, and rankings.
 */
import type {
  GameState,
  RankingEntry,
  Season,
  WeatherType,
  SeasonalGrowth,
} from '@/types/state.types';
import type { PoolWarrior } from '@/engine/recruitment';

/**
 * Apply week to state.
 */
export const week = (state: GameState, value: number) => {
  state.week = value;
};

/**
 * Apply day to state.
 */
export const day = (state: GameState, value: number) => {
  state.day = value;
};

/**
 * Apply season to state.
 */
export const season = (state: GameState, value: Season) => {
  state.season = value;
};

/**
 * Apply weather to state.
 */
export const weather = (state: GameState, value: WeatherType) => {
  state.weather = value;
};

/**
 * Apply recruit pool to state.
 */
export const recruitPool = (state: GameState, value: PoolWarrior[]) => {
  state.recruitPool = value;
};

/**
 * Apply seasonal growth to state.
 */
export const seasonalGrowth = (state: GameState, value: SeasonalGrowth[]) => {
  state.seasonalGrowth = value;
};

/**
 * Apply realm rankings to state.
 */
export const realmRankings = (state: GameState, value: Record<string, RankingEntry>) => {
  state.realmRankings = value;
};

/**
 * World impact handlers map.
 */
export const worldHandlers = {
  week,
  day,
  season,
  weather,
  recruitPool,
  seasonalGrowth,
  realmRankings,
};
