// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { handleTournamentFreeze } from '@/engine/matchmaking/tournamentSelection/freeze';
import { SeededRNG } from '@/utils/random';
import {
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeTournamentRival,
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
} from '@/test/_fixtures/tournamentState';
import type { RankingEntry } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';

const ranked = (overallRank: number, compositeScore: number): RankingEntry => ({
  overallRank,
  classRank: overallRank,
  compositeScore,
});

const w = (id: string, fe: number, stableId = TOURNEY_PLAYER_ID) =>
  makeTournamentWarrior(id, `Warrior ${id}`, undefined, stableId, { fightEquivalents: fe });

function stateWith(warriors: ReturnType<typeof w>[]) {
  const state = makeTournamentBaseState(8);
  state.roster = warriors.filter((x) => x.stableId === TOURNEY_PLAYER_ID);
  state.rivals = [
    makeTournamentRival(warriors.filter((x) => x.stableId === TOURNEY_RIVAL_ID)),
  ];
  state.realmRankings = Object.fromEntries(
    warriors.map((x, i) => [x.id, ranked(i + 1, 1000 - i * 10)])
  );
  return state;
}

describe('handleTournamentFreeze — FE snapshot & class invites', () => {
  it('snapshots every rostered warrior\'s fight-equivalents at freeze', () => {
    const state = stateWith([w('a', 0), w('b', 4, TOURNEY_RIVAL_ID), w('c', 7)]);
    const impact = handleTournamentFreeze(state, 8, new SeededRNG(1));
    const cycle = impact.tournamentCycle!;
    expect(cycle.forWeek).toBe(10);
    expect(cycle.frozenAtAbsWeek).toBe(8);
    expect(cycle.feByWarrior['a' as WarriorId]).toBe(0);
    expect(cycle.feByWarrior['b' as WarriorId]).toBe(4);
    expect(cycle.feByWarrior['c' as WarriorId]).toBe(7);
  });

  it('buckets invites by class from FROZEN FE — not live FE', () => {
    const state = stateWith([w('a', 0), w('b', 4), w('c', 5), w('d', 11), w('e', 21)]);
    const impact = handleTournamentFreeze(state, 8, new SeededRNG(1));
    const { invited } = impact.tournamentCycle!;
    expect(invited.rookies).toContain('a');
    expect(invited.apprentices).toContain('b');
    expect(invited.initiates).toContain('c');
    expect(invited.adepts).toContain('d');
    expect(invited.champions).toContain('e');
  });

  it('caps invites at CLASS_INVITE_COUNT per class, ranked by compositeScore', () => {
    const pool = Array.from({ length: 20 }, (_, i) => w(`r${i}`, 0));
    const state = stateWith(pool);
    const impact = handleTournamentFreeze(state, 8, new SeededRNG(1));
    const { invited } = impact.tournamentCycle!;
    expect(invited.rookies).toHaveLength(16);
    // Sorted by compositeScore descending → the first 16 ranked warriors.
    expect(invited.rookies).toContain('r0');
    expect(invited.rookies).not.toContain('r19');
  });

  it('post-freeze FE growth does NOT move a warrior up a class (sandbagging window)', () => {
    // The freeze records FE; a warrior who fights twice after freeze keeps
    // their frozen class — that is the article's breakpoint exploit.
    const warrior = w('a', 4); // frozen Apprentice
    const state = stateWith([warrior]);
    const impact = handleTournamentFreeze(state, 8, new SeededRNG(1));
    const cycle = impact.tournamentCycle!;
    expect(cycle.feByWarrior['a' as WarriorId]).toBe(4);
    expect(cycle.invited.apprentices).toContain('a');
    expect(cycle.invited.initiates ?? []).not.toContain('a');
  });

  it('initializes declaration/scratch ledgers for the entry window', () => {
    const state = stateWith([w('a', 0)]);
    const impact = handleTournamentFreeze(state, 8, new SeededRNG(1));
    expect(impact.tournamentCycle!.declared).toEqual({});
    expect(impact.tournamentCycle!.scratched).toEqual([]);
  });
});
