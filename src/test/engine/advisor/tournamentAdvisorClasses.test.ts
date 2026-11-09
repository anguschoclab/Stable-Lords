// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { evaluateTournamentAdvice } from '@/engine/advisor/tournamentAdvisor';
import {
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeTournament,
  TOURNEY_PLAYER_ID,
} from '@/test/_fixtures/tournamentState';
const w = (id: string, fe: number) =>
  makeTournamentWarrior(id, `Warrior ${id}`, undefined, TOURNEY_PLAYER_ID, {
    fightEquivalents: fe,
  });

describe('evaluateTournamentAdvice — FE classes', () => {
  it('reports the warrior\'s classId + FE + breakpoint gap from the frozen cycle when present', () => {
    const warrior = w('a', 4);
    const state = makeTournamentBaseState(9);
    state.roster = [warrior];
    state.tournamentCycle = {
      forWeek: 10,
      season: 'Spring',
      frozenAtAbsWeek: 8,
      feByWarrior: { [warrior.id]: 4 } as never,
      invited: { apprentices: [warrior.id] } as never,
      declared: {},
      scratched: [],
      elevated: [],
    };
    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.classId).toBe('apprentices');
    expect(advice.fe).toBe(4);
    expect(advice.breakpointGap).toBe(1); // one bout from Initiates
    expect(advice.entered).toBe(true);
  });

  it('falls back to live FE classes pre-freeze', () => {
    const warrior = w('b', 6);
    const state = makeTournamentBaseState(5);
    state.roster = [warrior];
    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.classId).toBe('initiates');
    expect(advice.fe).toBe(6);
  });

  it('flags breakpoint-edge warriors to keep fighting through the freeze window', () => {
    const warrior = w('c', 4); // one bout under Initiates — classic sandbag spot
    const state = makeTournamentBaseState(9); // frozen at 8, tourney at 10
    state.roster = [warrior];
    state.tournamentCycle = {
      forWeek: 10,
      season: 'Spring',
      frozenAtAbsWeek: 8,
      feByWarrior: { [warrior.id]: 4 } as never,
      invited: { apprentices: [warrior.id] } as never,
      declared: {},
      scratched: [],
      elevated: [],
    };
    const advice = evaluateTournamentAdvice(warrior, state);
    // Post-freeze the warrior can gain real bouts WITHOUT changing class —
    // the advice must push "keep fighting", not taper.
    expect(advice.details + ' ' + advice.headline).toMatch(/fight|run|breakpoint|edge/i);
  });

  it('marks declared-but-scratched warriors as not entered', () => {
    const warrior = w('d', 0);
    const state = makeTournamentBaseState(9);
    state.roster = [warrior];
    state.tournamentCycle = {
      forWeek: 10,
      season: 'Spring',
      frozenAtAbsWeek: 8,
      feByWarrior: { [warrior.id]: 0 } as never,
      invited: { rookies: [warrior.id] } as never,
      declared: {},
      scratched: [warrior.id],
      elevated: [],
    };
    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.entered).toBe(false);
  });

  it('warns when a pending grudge bout (+1 FE) would tip the next-freeze breakpoint', () => {
    const warrior = w('g', 4); // live FE 4 — one bout under Initiates
    const state = makeTournamentBaseState(9);
    state.roster = [warrior];
    state.tournamentCycle = {
      forWeek: 10,
      season: 'Spring',
      frozenAtAbsWeek: 8,
      feByWarrior: { [warrior.id]: 3 } as never, // frozen 3 — safe inside Apprentices
      invited: { apprentices: [warrior.id] } as never,
      declared: {},
      scratched: [],
      elevated: [],
    };
    state.boutOffers = {
      grudge_1: {
        id: 'grudge_1',
        warriorIds: [warrior.id, 'opp_1'],
        grudgeOfTournamentId: 't-apprentices',
        status: 'Proposed',
      } as never,
    } as never;
    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.grudgeWarning).toMatch(/initiates|breakpoint|next/i);
  });

  it('no grudge warning when the +1 stays inside the class', () => {
    const warrior = w('h', 2); // live FE 2 — grudge +1 lands at 3, still Apprentices
    const state = makeTournamentBaseState(9);
    state.roster = [warrior];
    state.boutOffers = {
      grudge_1: {
        id: 'grudge_1',
        warriorIds: [warrior.id, 'opp_1'],
        grudgeOfTournamentId: 't-apprentices',
        status: 'Proposed',
      } as never,
    } as never;
    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.grudgeWarning).toBeUndefined();
  });

  it('live tournament week: participant detected inside its OWN class bracket', () => {
    const warrior = w('e', 2);
    const state = makeTournamentBaseState(10);
    state.roster = [warrior];
    state.isTournamentWeek = true;
    const bracket = makeTournament({
      id: 't-apprentices' as never,
      week: 10,
      classId: 'apprentices' as never,
      participants: [warrior],
    });
    state.tournaments = [bracket];
    const advice = evaluateTournamentAdvice(warrior, state);
    expect(advice.isParticipant).toBe(true);
  });
});
