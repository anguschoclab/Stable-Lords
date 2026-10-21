import { describe, it, expect, vi } from 'vitest';
import { FightingStyle, type TournamentId } from '@/types/shared.types';
import {
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeCompletedTournament,
  makeTournamentRival,
  makeTournamentWithR1,
  makeAlternatingField,
  makeSplitTournamentState,
  makeFinalsState,
} from '@/test/_fixtures/tournamentState';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import { resolveCompleteTournament } from '@/engine/matchmaking/tournamentSelection/resolution';

const PLAYER_ID = TOURNEY_PLAYER_ID;
const RIVAL_ID = TOURNEY_RIVAL_ID;

// ─── resolveCompleteTournament ───

describe('resolveCompleteTournament', () => {
  it('resolves all rounds to completion', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    // Use a round-7 bout so isComplete (currentRound >= 7) triggers
    const { state, tournament } = makeFinalsState(w1, w2);

    const updated = resolveCompleteTournament(state, tournament.id, 1);

    expect(updated.tournaments[0]!.completed).toBe(true);
    expect(updated.tournaments[0]!.champion).toBeDefined();
  });

  it('returns same state if tournament is already completed', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    const tournament = makeCompletedTournament([w1, w2, w1, w2]);
    state.tournaments = [tournament];

    const updated = resolveCompleteTournament(state, tournament.id, 1);

    expect(updated.tournaments[0]!.completed).toBe(true);
  });

  it('resolveCompleteTournament produces identical results across calls (golden output)', () => {
    const state1 = makeSplitTournamentState(
      makeAlternatingField(8, { idPrefix: 'gw', namePrefix: 'Golden Warrior' })
    );
    const state2 = makeSplitTournamentState(
      makeAlternatingField(8, { idPrefix: 'gw', namePrefix: 'Golden Warrior' })
    );

    const updated1 = resolveCompleteTournament(state1, state1.tournaments[0]!.id, 42);
    const updated2 = resolveCompleteTournament(state2, state2.tournaments[0]!.id, 42);

    // Champion must be identical
    expect(updated1.tournaments[0]!.champion).toBe(updated2.tournaments[0]!.champion);
    // Completed flag must match
    expect(updated1.tournaments[0]!.completed).toBe(updated2.tournaments[0]!.completed);
    // Bracket length must match
    expect(updated1.tournaments[0]!.bracket.length).toBe(updated2.tournaments[0]!.bracket.length);
    // Every bout winner must match
    const b1 = updated1.tournaments[0]!.bracket;
    const b2 = updated2.tournaments[0]!.bracket;
    for (let i = 0; i < b1.length; i++) {
      expect(b1[i]!.winner).toBe(b2[i]!.winner);
      expect(b1[i]!.by).toBe(b2[i]!.by);
    }
  });
});

// ─── resolveCompleteTournament — degenerate brackets seal instead of lingering ───

describe('resolveCompleteTournament — degenerate brackets seal instead of lingering', () => {
  it('seals a tournament with an empty bracket', () => {
    const state = makeTournamentBaseState(1);
    state.tournaments = [
      {
        id: 't-empty' as TournamentId,
        season: 'Spring',
        week: 1,
        tierId: 'Gold',
        name: 'Empty Cup',
        bracket: [],
        participants: [],
        completed: false,
      },
    ];

    const updated = resolveCompleteTournament(state, 't-empty', 1);

    expect(updated.tournaments![0]!.completed).toBe(true);
  });

  it('seals a fully-resolved bracket whose completed flag was never set', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];
    state.tournaments = [
      {
        id: 't-unflagged' as TournamentId,
        season: 'Spring',
        week: 1,
        tierId: 'Gold',
        name: 'Unflagged Cup',
        bracket: [
          {
            round: 1,
            matchIndex: 0,
            warriorIdA: w1.id,
            warriorIdD: w2.id,
            winner: 'A',
          },
        ],
        participants: [w1, w2],
        completed: false,
      },
    ];

    const updated = resolveCompleteTournament(state, 't-unflagged', 1);
    const after = updated.tournaments![0]!;

    expect(after.completed).toBe(true);
    expect(after.champion).toBe('A');
  });
});

// ─── resolveRound — input immutability ───

describe('resolveRound — input immutability', () => {
  it('does not write winners onto the caller state bout objects', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];
    state.tournaments = [makeTournamentWithR1([w1, w2])];

    const updated = resolveCompleteTournament(state, state.tournaments[0]!.id, 7);

    expect(updated.tournaments[0]!.completed).toBe(true);
    expect(state.tournaments[0]!.bracket.every((b) => b.winner === undefined)).toBe(true);
  });
});
