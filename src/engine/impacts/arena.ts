/**
 * Arena Domain Impacts
 * Handles arena history, hall of fame, match history, mood history, and crowd mood.
 */
import type {
  GameState,
  HallEntry,
  MatchRecord,
  CrowdMoodType,
  ArenaTitle,
  GrandChampionEntry,
} from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';

/**
 * Apply arena history to state.
 */
const arenaHistory = (state: GameState, value: FightSummary[]) => {
  state.arenaHistory = [...(state.arenaHistory || []), ...value];
};

/**
 * Apply hall of fame to state.
 */
const hallOfFame = (state: GameState, value: HallEntry[]) => {
  state.hallOfFame = [...(state.hallOfFame || []), ...value];
};

/**
 * Apply match history to state.
 */
const matchHistory = (state: GameState, value: MatchRecord[]) => {
  state.matchHistory = value;
};

/**
 * Apply mood history to state.
 */
const moodHistory = (state: GameState, value: { week: number; mood: CrowdMoodType }[]) => {
  state.moodHistory = [...(state.moodHistory || []), ...value];
};

/**
 * Apply crowd mood to state.
 */
const crowdMood = (state: GameState, value: CrowdMoodType) => {
  state.crowdMood = value;
};

/**
 * Apply arena championship updates — each entry replaces the whole ArenaTitle for that arena.
 */
const arenaChampions = (state: GameState, value: Record<string, ArenaTitle>) => {
  state.arenaChampions = { ...(state.arenaChampions || {}), ...value };
};

/**
 * Apply grand champion entries to state.
 */
const grandChampions = (state: GameState, value: GrandChampionEntry[]) => {
  state.grandChampions = [...(state.grandChampions || []), ...value];
};

/**
 * Arena impact handlers map.
 */
export const arenaHandlers = {
  arenaHistory,
  hallOfFame,
  matchHistory,
  moodHistory,
  crowdMood,
  arenaChampions,
  grandChampions,
};
