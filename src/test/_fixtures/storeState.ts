import type { GameState } from '@/types/state.types';

/**
 * Sparse GameState stub — intentionally partial (cast `as any`) for specs that
 * only exercise a handful of fields; do NOT swap for `makeGameState` (full
 * `createFreshState`) — the missing fields are the point.
 */
export function makeStubGameState(over: Partial<GameState> = {}): GameState {
  return {
    player: { stableName: 'Player Stable' },
    roster: [],
    graveyard: [],
    newsletter: [],
    arenaHistory: [],
    fame: 0,
    trainingAssignments: [],
    trainers: [],
    ...over,
  } as any as GameState;
}

/** Shared page-test store state — the common GameStore-shaped literal. */
export function makePageStoreState(over: Record<string, unknown> = {}) {
  return {
    roster: [],
    newsletter: [],
    ledger: [],
    matchHistory: [],
    moodHistory: [],
    graveyard: [],
    retired: [],
    week: 1,
    season: 'Spring',
    year: 1,
    treasury: 500,
    tournaments: [],
    rivals: [],
    arenaHistory: [],
    trainers: [],
    hiringPool: [],
    trainingAssignments: [],
    fame: 0,
    awards: [],
    bookmarks: [],
    isBookmarked: () => false,
    ftueComplete: false,
    player: {
      id: 'p1',
      name: 'Player',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    ...over,
  };
}
