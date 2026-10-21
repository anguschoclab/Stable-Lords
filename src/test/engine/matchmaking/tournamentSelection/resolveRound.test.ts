import { describe, it, expect, vi } from 'vitest';
import type { Warrior, TournamentBout } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
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
  makeFinalsTournament,
  makeFinalsState,
} from '@/test/_fixtures/tournamentState';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import {
  resolveRound,
  resolveCompleteTournament,
} from '@/engine/matchmaking/tournamentSelection/resolution';

const PLAYER_ID = TOURNEY_PLAYER_ID;
const RIVAL_ID = TOURNEY_RIVAL_ID;

// ─── resolveRound ───

describe('resolveRound (tournamentSelection/resolution.ts)', () => {
  it('returns empty results for missing tournament', () => {
    const state = makeTournamentBaseState(1);
    const { updatedState, roundResults } = resolveRound(state, 'nonexistent', 1);
    expect(updatedState).toEqual(state);
    expect(roundResults).toEqual([]);
  });

  it('returns empty results for completed tournament', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    const tournament = makeCompletedTournament([w1, w2, w1, w2]);
    state.tournaments = [tournament];

    const { updatedState, roundResults } = resolveRound(state, tournament.id, 1);
    expect(roundResults).toEqual([]);
    expect(updatedState.tournaments[0]!.completed).toBe(true);
  });

  it('resolves round 1 bouts and advances winners', () => {
    const warriors = makeAlternatingField(4);
    const state = makeSplitTournamentState(warriors);

    const { updatedState } = resolveRound(state, state.tournaments[0]!.id, 1);

    const r1Bouts = updatedState.tournaments[0]!.bracket.filter(
      (b: TournamentBout) => b.round === 1
    );
    expect(r1Bouts.every((b: TournamentBout) => b.winner !== undefined)).toBe(true);

    // A 4-man round-1 IS the semifinal, so round 2 carries the finals bout
    // plus a bronze playoff (flagged isBronzeMatch) between the semifinal losers.
    const r2Bouts = updatedState.tournaments[0]!.bracket.filter(
      (b: TournamentBout) => b.round === 2
    );
    expect(r2Bouts.length).toBe(2);
    expect(r2Bouts.filter((b: TournamentBout) => b.isBronzeMatch)).toHaveLength(1);
  });

  it('handles bye matches', () => {
    const warriors = makeAlternatingField(6);
    const state = makeSplitTournamentState(warriors);

    // Resolve round 1 (3 bouts, 3 winners)
    const { updatedState } = resolveRound(state, state.tournaments[0]!.id, 1);

    // After round 1, round 2 should be generated with 1 bout + 1 bye
    const r2Bouts = updatedState.tournaments[0]!.bracket.filter(
      (b: TournamentBout) => b.round === 2
    );
    expect(r2Bouts.length).toBe(2);

    // Now resolve round 2 which contains the bye
    const { updatedState: finalState } = resolveRound(updatedState, state.tournaments[0]!.id, 2);

    const byeBout = finalState.tournaments[0]!.bracket.find(
      (b: TournamentBout) => b.round === 2 && b.warriorIdD === 'bye'
    );
    expect(byeBout).toBeDefined();
    expect(byeBout!.winner).toBe('A');
  });

  it('handles missing warrior by auto-advancing the opponent', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];

    const tournament = makeTournamentWithR1([
      w1,
      { id: 'w2', name: 'B', stableId: RIVAL_ID } as Warrior,
    ]);
    state.tournaments = [tournament];

    const { updatedState } = resolveRound(state, tournament.id, 1);

    const bout = updatedState.tournaments[0]!.bracket[0]!;
    expect(bout.winner).toBe('A');
  });

  it('injects bronze match after semifinals (round 5)', () => {
    const warriors = makeAlternatingField(8);
    const state = makeSplitTournamentState(warriors, { withTournament: false });

    const bracket: TournamentBout[] = [
      {
        round: 5,
        matchIndex: 0,
        warriorIdA: warriors[0]!.id,
        warriorIdD: warriors[1]!.id,
        stableIdA: warriors[0]!.stableId,
        stableIdD: warriors[1]!.stableId,
      },
      {
        round: 5,
        matchIndex: 1,
        warriorIdA: warriors[2]!.id,
        warriorIdD: warriors[3]!.id,
        stableIdA: warriors[2]!.stableId,
        stableIdD: warriors[3]!.stableId,
      },
    ];

    const tournament = { ...makeTournamentWithR1(warriors), bracket };

    state.tournaments = [tournament];

    const { updatedState } = resolveRound(state, tournament.id, 1);

    const bronzeMatch = updatedState.tournaments[0]!.bracket.find(
      (b: TournamentBout) => b.round === 6 && b.matchIndex === 1
    );
    expect(bronzeMatch).toBeDefined();
    expect(bronzeMatch!.warriorIdA).toBeDefined();
    expect(bronzeMatch!.warriorIdD).toBeDefined();
  });

  it('marks tournament complete after finals and sets champion', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    // The code requires currentRound >= 7 for completion, so create a round-7 bout
    const tournament = makeFinalsTournament(w1, w2);
    state.tournaments = [tournament];

    const { updatedState, roundResults } = resolveRound(state, tournament.id, 1);

    expect(updatedState.tournaments[0]!.completed).toBe(true);
    expect(updatedState.tournaments[0]!.champion).toBe(w1.name);
    expect(roundResults.length).toBeGreaterThan(0);
    expect(roundResults[0]).toContain('CHAMPION');
  });
});

// ─── resolveRound — tournament param and isComplete ───

describe('resolveRound — tournament param and isComplete (resolution.ts)', () => {
  it('accepts optional tournament param and uses it directly', () => {
    const warriors = makeAlternatingField(4);
    const state = makeSplitTournamentState(warriors);
    const tournament = state.tournaments[0]!;

    // Use fresh deep-copied brackets since resolveRound mutates bout objects in-place
    const state1 = {
      ...state,
      tournaments: [{ ...tournament, bracket: tournament.bracket.map((b) => ({ ...b })) }],
    };
    const state2 = {
      ...state,
      tournaments: [{ ...tournament, bracket: tournament.bracket.map((b) => ({ ...b })) }],
    };

    // Pass the tournament directly — should produce the same result
    const result1 = resolveRound(state1, tournament.id, 1, undefined, state1.tournaments[0]);
    const result2 = resolveRound(state2, tournament.id, 1);
    expect(result1.roundResults).toEqual(result2.roundResults);
    expect(result1.updatedState.tournaments[0]!.bracket).toEqual(
      result2.updatedState.tournaments[0]!.bracket
    );
  });

  it('returns isComplete flag in the result', () => {
    const warriors = makeAlternatingField(4);
    const state = makeSplitTournamentState(warriors);

    // Round 1 of 7 — should not be complete
    const result = resolveRound(state, state.tournaments[0]!.id, 1);
    expect(result).toHaveProperty('isComplete');
    expect(result.isComplete).toBe(false);
  });

  it('resolveCompleteTournament uses returned isComplete', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const { state, tournament } = makeFinalsState(w1, w2);

    const updated = resolveCompleteTournament(state, tournament.id, 1);
    expect(updated.tournaments[0]!.completed).toBe(true);
    expect(updated.tournaments[0]!.champion).toBeDefined();
  });
});

// ─── resolveRound — updatedTournament return field ─────────────────────────────

describe('resolveRound — updatedTournament return field (tournamentSelection)', () => {
  it('returns updatedTournament with updated bracket after round resolution', () => {
    const warriors = makeAlternatingField(4);
    const state = makeSplitTournamentState(warriors);
    const tournament = state.tournaments[0]!;

    const result = resolveRound(state, tournament.id, 1);

    expect(result.updatedTournament).toBeDefined();
    expect(result.updatedTournament!.id).toBe(tournament.id);
    const r1Bouts = result.updatedTournament!.bracket.filter((b: TournamentBout) => b.round === 1);
    expect(r1Bouts.every((b: TournamentBout) => b.winner !== undefined)).toBe(true);
  });

  it('returns updatedTournament as undefined when tournament not found', () => {
    const state = makeTournamentBaseState(1);
    const result = resolveRound(state, 'nonexistent', 1);
    expect(result.updatedTournament).toBeUndefined();
  });

  it('returns updatedTournament as undefined when tournament already completed', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    const tournament = makeCompletedTournament([w1, w2, w1, w2]);
    state.tournaments = [tournament];

    const result = resolveRound(state, tournament.id, 1);
    expect(result.updatedTournament).toBeUndefined();
  });
});
