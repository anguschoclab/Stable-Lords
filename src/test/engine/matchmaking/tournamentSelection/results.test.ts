import { describe, it, expect, vi } from 'vitest';
import type { Warrior } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';
import {
  TOURNEY_PLAYER_ID,
  TOURNEY_RIVAL_ID,
  makeTournamentBaseState,
  makeTournamentWarrior,
  makeTournamentRival,
  makeTournamentWithR1,
  makeFightOutcome,
} from '@/test/_fixtures/tournamentState';
import { simulateFight } from '@/engine/simulate';

vi.mock('@/engine/simulate', () => ({ ...__SHARED_MOCKS.tournamentSimulate }));
vi.mock('@/engine', () => ({ ...__SHARED_MOCKS.tournamentEngine }));
vi.mock('@/engine/tokens/patronTokenService', () => ({ ...__SHARED_MOCKS.patronTokenService }));
vi.mock('@/engine/core/warriorLookup', () => ({ ...__SHARED_MOCKS.tournamentWarriorLookup }));

import { applyBoutResults } from '@/engine/matchmaking/tournamentSelection/resolution';

const PLAYER_ID = TOURNEY_PLAYER_ID;
const RIVAL_ID = TOURNEY_RIVAL_ID;

describe('applyBoutResults — kill lifecycle bookkeeping', () => {
  it('records the death once: graveyard entry, dead registry, kill event, participant stamp', () => {
    const wA = makeTournamentWarrior('k1', 'Killer', FightingStyle.StrikingAttack, PLAYER_ID);
    const wD = makeTournamentWarrior('k2', 'Victim', FightingStyle.StrikingAttack, RIVAL_ID);
    const tournament = makeTournamentWithR1([wA, wD]);

    const state = makeTournamentBaseState(1);
    state.roster = [wA];
    state.rivals = [makeTournamentRival([wD])];
    state.tournaments = [tournament];

    const rng = new SeededRNG(7);
    const next = applyBoutResults({
      state: state,
      wA: wA,
      wD: wD,
      outcome: makeFightOutcome('A', 'Kill'),
      tId: tournament.id,
      tName: tournament.name,
      rng: rng,
    });

    // Unique death recorded exactly once per store.
    expect((next.graveyard ?? []).filter((g) => g.id === 'k2')).toHaveLength(1);
    expect((next.deadWarriorIds ?? []).filter((id) => id === 'k2')).toHaveLength(1);
    expect(next.killEvents ?? []).toHaveLength(1);
    expect(next.killEvents![0]).toMatchObject({ victimId: 'k2', tournamentId: tournament.id });
    // The victim's participant snapshot is stamped dead — self-describing.
    const stamped = next.tournaments![0]!.participants.find((p) => p.id === 'k2');
    expect(stamped!.status).toBe('Dead');
    // And off every live roster.
    expect(next.rivals[0]!.roster.find((w) => w.id === 'k2')).toBeUndefined();
  });

  it('does not append a duplicate graveyard entry when a dead id is killed again', () => {
    const wA = makeTournamentWarrior('k3', 'Killer', FightingStyle.StrikingAttack, PLAYER_ID);
    const wD = makeTournamentWarrior('k4', 'Already Dead', FightingStyle.StrikingAttack, RIVAL_ID);
    const tournament = makeTournamentWithR1([wA, wD]);

    const state = makeTournamentBaseState(1);
    state.roster = [wA];
    state.rivals = [makeTournamentRival([])];
    state.tournaments = [tournament];
    // Victim already registered dead (e.g. a stale snapshot slipped through).
    state.deadWarriorIds = [wD.id];
    state.graveyard = [{ ...wD, status: 'Dead', isDead: true } as Warrior];

    const rng = new SeededRNG(9);
    const next = applyBoutResults({
      state: state,
      wA: wA,
      wD: wD,
      outcome: makeFightOutcome('A', 'Kill'),
      tId: tournament.id,
      tName: tournament.name,
      rng: rng,
    });

    // The repeat outcome still surfaces as a kill event — the oracle's
    // divergence tripwire depends on seeing it — but the graveyard does not
    // grow a duplicate entry for the same warrior id.
    expect((next.graveyard ?? []).filter((g) => g.id === 'k4')).toHaveLength(1);
    expect(next.killEvents).toHaveLength(1);
    expect((next.deadWarriorIds ?? []).filter((id) => id === 'k4')).toHaveLength(1);
  });

  it('does not inline-cap arenaHistory — truncateState owns the retention policy', () => {
    const wA = makeTournamentWarrior('h1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const wD = makeTournamentWarrior('h2', 'D', FightingStyle.StrikingAttack, RIVAL_ID);
    const tournament = makeTournamentWithR1([wA, wD]);

    const state = makeTournamentBaseState(1);
    state.roster = [wA];
    state.rivals = [makeTournamentRival([wD])];
    state.tournaments = [tournament];
    state.arenaHistory = Array.from({ length: 500 }, (_, i) => ({
      id: `old-${i}`,
      week: 1,
      warriorIdA: 'x',
      warriorIdD: 'y',
      winner: 'A',
      by: 'KO',
      styleA: 'S',
      styleD: 'S',
      createdAt: '',
    })) as never;

    const rng = new SeededRNG(3);
    const next = applyBoutResults({
      state: state,
      wA: wA,
      wD: wD,
      outcome: makeFightOutcome('A', 'Stoppage'),
      tId: tournament.id,
      tName: tournament.name,
      rng: rng,
    });

    // Mid-week appends must not drop head entries — the cumulative tracker
    // dedups by bout id but can only see entries that still exist.
    expect(next.arenaHistory).toHaveLength(501);
  });
});

describe('applyBoutResults', () => {
  it('creates fight summary and appends to arena history', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults({
      state: state,
      wA: w1,
      wD: w2,
      outcome: outcome,
      tId: 't-gold-spring-1',
      tName: 'Test Cup',
      rng: rng,
    });

    expect(updated.arenaHistory.length).toBeGreaterThan(0);
    expect(updated.arenaHistory[0]!.tournamentId).toBe('t-gold-spring-1');
  });

  it('updates fatigue for both warriors', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID, {
      fatigue: 0,
    });
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID, {
      fatigue: 0,
    });

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults({
      state: state,
      wA: w1,
      wD: w2,
      outcome: outcome,
      tId: 't1',
      tName: 'Test',
      rng: rng,
    });

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedW2 = updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2');

    expect(updatedW1!.fatigue).toBeGreaterThan(0);
    expect(updatedW2!.fatigue).toBeGreaterThan(0);
  });

  it('skips fatigue when isTournamentWeek is true', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID, {
      fatigue: 10,
    });
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID, {
      fatigue: 10,
    });

    const state = makeTournamentBaseState(1);
    state.isTournamentWeek = true;
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults({
      state: state,
      wA: w1,
      wD: w2,
      outcome: outcome,
      tId: 't1',
      tName: 'Test',
      rng: rng,
    });

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedW2 = updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2');

    expect(updatedW1!.fatigue).toBe(10);
    expect(updatedW2!.fatigue).toBe(10);
  });

  it('handles death by adding victim to graveyard and removing from rosters', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Kill');
    const updated = applyBoutResults({
      state: state,
      wA: w1,
      wD: w2,
      outcome: outcome,
      tId: 't1',
      tName: 'Test',
      rng: rng,
    });

    expect(updated.graveyard.length).toBe(1);
    expect(updated.graveyard[0]!.id).toBe('w2');
    expect(updated.graveyard[0]!.status).toBe('Dead');
    expect(updated.roster.some((w) => w.id === 'w2')).toBe(false);
    expect(updated.rivals[0]!.roster.some((w: Warrior) => w.id === 'w2')).toBe(false);
  });

  it('updates career stats for winner and loser', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Stoppage');
    const updated = applyBoutResults({
      state: state,
      wA: w1,
      wD: w2,
      outcome: outcome,
      tId: 't1',
      tName: 'Test',
      rng: rng,
    });

    const updatedW1 = updated.roster.find((w) => w.id === 'w1');
    const updatedW2 = updated.rivals[0]!.roster.find((w: Warrior) => w.id === 'w2');

    expect(updatedW1!.career.wins).toBe(1);
    expect(updatedW2!.career.losses).toBe(1);
  });
});

describe('applyBoutResults — deathWeek at year boundary', () => {
  it('should set deathWeek to absoluteWeek (not display week) for tournament kills', () => {
    const w1 = makeTournamentWarrior('w1', 'A', FightingStyle.StrikingAttack, PLAYER_ID);
    const w2 = makeTournamentWarrior('w2', 'B', FightingStyle.StrikingAttack, RIVAL_ID);

    const state = makeTournamentBaseState(1);
    state.week = 1;
    state.year = 2;
    state.absoluteWeek = 53;
    state.roster = [w1];
    state.rivals = [makeTournamentRival([w2])];

    vi.mocked(simulateFight).mockReturnValue({
      winner: 'A',
      by: 'Kill',
      minutes: 1,
      log: [],
      exchangeLog: [],
      post: { tags: [] },
    } as any);

    const rng = new SeededRNG(42);
    const outcome = makeFightOutcome('A', 'Kill');
    const updated = applyBoutResults({
      state: state,
      wA: w1,
      wD: w2,
      outcome: outcome,
      tId: 't1',
      tName: 'Test',
      rng: rng,
    });

    expect(updated.graveyard.length).toBe(1);
    expect(updated.graveyard[0]!.deathWeek).toBe(53);
  });
});
