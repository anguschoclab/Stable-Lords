import { describe, it, expect } from 'vitest';
import { reconstructGameState } from '@/state/serialization';
import {
  makeTournamentBaseState,
  makeTournamentWarrior,
  TOURNEY_PLAYER_ID,
} from '@/test/_fixtures/tournamentState';
import type { WarriorId } from '@/types/shared.types';

/**
 * Store→state plumbing for the V27 tournament cycle + warrior FE counters.
 * Mostly a ratchet: the fields were wired in Phase 1 stubs, and this spec
 * keeps them from silently drifting out of the store's collected shape.
 */
describe('tournamentCycle + FE serialization plumbing', () => {
  it('reconstructGameState carries tournamentCycle through the store', () => {
    const warrior = makeTournamentWarrior('a', 'Alpha', undefined, TOURNEY_PLAYER_ID, {
      fightEquivalents: 4,
    });
    const state = makeTournamentBaseState(9);
    state.roster = [warrior];
    state.tournamentCycle = {
      forWeek: 10,
      season: 'Spring',
      frozenAtAbsWeek: 8,
      feByWarrior: { [warrior.id]: 4 } as Record<WarriorId, number>,
      invited: { apprentices: [warrior.id] },
      declared: {},
      scratched: [],
      elevated: [],
    };
    const reconstructed = reconstructGameState(state as never);
    expect(reconstructed.tournamentCycle).toEqual(state.tournamentCycle);
  });

  it('fightEquivalents survives the round trip on the roster', () => {
    const warrior = makeTournamentWarrior('a', 'Alpha', undefined, TOURNEY_PLAYER_ID, {
      fightEquivalents: 7,
    });
    const state = makeTournamentBaseState(5);
    state.roster = [warrior];
    const reconstructed = reconstructGameState(state as never);
    expect(reconstructed.roster[0]!.fightEquivalents).toBe(7);
  });
});
