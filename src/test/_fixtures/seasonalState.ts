import type { GameState, Warrior } from '@/types/state.types';
import { makeGameState } from '@/test/_fixtures/factories';

/**
 * Seasonal-event test state: Winter week 13, established stable
 * (fame 100 / popularity 50) with a configurable player roster.
 */
export function makeSeasonalTestState(roster: Warrior[] = []): GameState {
  return makeGameState({
    meta: { gameName: '', version: '', createdAt: '' },
    ftueComplete: true,
    player: {
      id: 'p1' as any,
      name: 'Player',
      stableName: 'Stable',
      fame: 100,
      renown: 50,
      titles: 0,
    },
    fame: 100,
    popularity: 50,
    week: 13,
    absoluteWeek: 13,
    season: 'Winter',
    roster,
    day: 1,
    isFTUE: false,
    progression: {
      phase: 'Early',
      playerFame: 100,
      rivalCount: 0,
      tournamentCount: 0,
      deaths: 0,
      weeksElapsed: 13,
    } as any,
  } as any);
}
