/**
 * Arena Domain Impacts
 * Handles arena history, hall of fame, match history, mood history, and crowd mood.
 */
import type { GameState, HallEntry, MatchRecord, CrowdMoodType } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';

/**
 * Apply arena history to state.
 */
export const arenaHistory = (state: GameState, value: FightSummary[]) => {
  state.arenaHistory = [...(state.arenaHistory || []), ...value];
};

/**
 * Apply hall of fame to state.
 */
export const hallOfFame = (state: GameState, value: HallEntry[]) => {
  state.hallOfFame = [...(state.hallOfFame || []), ...value];
};

/**
 * Apply match history to state.
 */
export const matchHistory = (state: GameState, value: MatchRecord[]) => {
  state.matchHistory = [...(state.matchHistory || []), ...value];
};

/**
 * Apply mood history to state.
 */
export const moodHistory = (state: GameState, value: { week: number; mood: CrowdMoodType }[]) => {
  state.moodHistory = [...(state.moodHistory || []), ...value];
};

/**
 * Apply crowd mood to state.
 */
export const crowdMood = (state: GameState, value: CrowdMoodType) => {
  state.crowdMood = value;
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
};
