/**
 * Social Domain Impacts
 * Handles owner grudges, rivalries, player challenges, player avoids, and unacknowledged deaths.
 */
import type { GameState, OwnerGrudge, Rivalry } from '@/types/state.types';

/**
 * Apply owner grudges to state.
 */
export const ownerGrudges = (state: GameState, value: OwnerGrudge[]) => {
  state.ownerGrudges = value;
};

/**
 * Apply rivalries to state.
 */
export const rivalries = (state: GameState, value: Rivalry[]) => {
  state.rivalries = value;
};

/**
 * Apply player challenges to state.
 */
export const playerChallenges = (state: GameState, value: string[]) => {
  state.playerChallenges = [...(state.playerChallenges || []), ...value];
};

/**
 * Apply player avoids to state.
 */
export const playerAvoids = (state: GameState, value: string[]) => {
  state.playerAvoids = [...(state.playerAvoids || []), ...value];
};

/**
 * Apply unacknowledged deaths to state.
 */
export const unacknowledgedDeaths = (state: GameState, value: string[]) => {
  state.unacknowledgedDeaths = [...(state.unacknowledgedDeaths || []), ...value];
};

/**
 * Social impact handlers map.
 */
export const socialHandlers = {
  ownerGrudges,
  rivalries,
  playerChallenges,
  playerAvoids,
  unacknowledgedDeaths,
};
