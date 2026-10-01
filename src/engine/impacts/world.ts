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
import type { PoolWarrior } from '@/engine/recruitment/recruitment';

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
 * Apply legacy-founder queue to state.
 */
export const legacyFounderQueue = (
  state: GameState,
  value: import('@/types/warrior.types').Warrior[]
) => {
  state.legacyFounderQueue = value;
};

/**
 * Apply free-agent list to state.
 */
export const freeAgents = (state: GameState, value: PoolWarrior[]) => {
  state.freeAgents = value;
};

/** Append founder candidates to the persisted queue. */
export const legacyFounderEnqueue = (
  state: GameState,
  value: import('@/types/warrior.types').Warrior[]
) => {
  state.legacyFounderQueue = [...(state.legacyFounderQueue ?? []), ...value];
};

/**
 * Append displaced veterans to the free-agent shelf. Freed warriors are read
 * from pre-merge snapshots, so a fold that doesn't actually remove its stable
 * (a dropped bankruptcy swap) — or a double free across churn paths — would
 * leave the same warrior rostered AND pooled; signing it then clones it into
 * a second stable. Skip ids already shelved or still rostered.
 */
export const freeAgentAdditions = (state: GameState, value: PoolWarrior[]) => {
  const live = new Set<string>((state.freeAgents ?? []).map((w) => w.id));
  for (const r of state.rivals ?? []) for (const w of r.roster) live.add(w.id);
  for (const w of state.roster ?? []) live.add(w.id);
  const fresh = value.filter((w) => !live.has(w.id));
  if (fresh.length > 0) state.freeAgents = [...(state.freeAgents ?? []), ...fresh];
};

/** Remove signed veterans from the free-agent shelf by id. */
export const freeAgentRemovals = (state: GameState, value: string[]) => {
  const gone = new Set(value);
  state.freeAgents = (state.freeAgents ?? []).filter((w) => !gone.has(w.id));
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
  legacyFounderQueue,
  legacyFounderEnqueue,
  freeAgents,
  freeAgentAdditions,
  freeAgentRemovals,
  seasonalGrowth,
  realmRankings,
};
