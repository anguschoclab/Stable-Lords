import { describe, it, expect, beforeEach } from 'vitest';
import { findWarriorById, clearWarriorCache } from '@/engine/core/warriorLookup';
import { buildWeekCaches } from '@/engine/pipeline/services/weekPipeline/caches';
import { makeGameState } from '@/test/_fixtures/factories';
import type { GameState, TournamentEntry, Warrior } from '@/types/state.types';

describe('Warrior Lookup Utilities', () => {
  beforeEach(() => {
    clearWarriorCache();
  });

  it('finds a warrior in the tournament participants first', () => {
    const tournamentWarrior = { id: 'w-tourney', attributes: {} } as Warrior;
    const rosterWarrior = { id: 'w-roster' } as Warrior;

    const tournament = { participants: [tournamentWarrior] } as TournamentEntry;
    const state = { roster: [rosterWarrior], rivals: [] } as unknown as GameState;

    expect(findWarriorById(state, 'w-tourney', tournament)).toBe(tournamentWarrior);
    expect(findWarriorById(state, 'w-roster', tournament)).toBe(rosterWarrior);
  });

  it('skips a tournament participant whose snapshot is stamped Dead', () => {
    // Participant snapshots are historical records, not liveness sources —
    // a dead-stamped participant must never resolve for live combat/awards.
    const deadParticipant = { id: 'w-dead', status: 'Dead', attributes: {} } as Warrior;
    const tournament = { participants: [deadParticipant] } as TournamentEntry;
    const state = { roster: [], rivals: [] } as unknown as GameState;

    expect(findWarriorById(state, 'w-dead', tournament)).toBeUndefined();
  });

  it('skips a stale Active participant whose id is registered dead', () => {
    // Snapshots are taken pre-death and stay 'Active' forever — the
    // persistent dead registry is the authority, not the snapshot's status.
    const staleParticipant = { id: 'w-stale', status: 'Active', attributes: {} } as Warrior;
    const tournament = { participants: [staleParticipant] } as TournamentEntry;
    const state = {
      roster: [],
      rivals: [],
      deadWarriorIds: ['w-stale'],
    } as unknown as GameState;

    expect(findWarriorById(state, 'w-stale', tournament)).toBeUndefined();
  });

  it('skips a stale Active participant whose id sits in the graveyard', () => {
    const staleParticipant = { id: 'w-gy', status: 'Active', attributes: {} } as Warrior;
    const graveyardEntry = { id: 'w-gy', status: 'Dead' } as Warrior;
    const tournament = { participants: [staleParticipant] } as TournamentEntry;
    const state = {
      roster: [],
      rivals: [],
      graveyard: [graveyardEntry],
    } as unknown as GameState;

    expect(findWarriorById(state, 'w-gy', tournament)).toBeUndefined();
  });

  it('falls through a dead participant to the live roster entry', () => {
    // A dead-stamped snapshot must not shadow a live roster object of the
    // same id — the roster copy is authoritative when the warrior is alive.
    const deadSnapshot = { id: 'w-live', status: 'Dead', attributes: {} } as Warrior;
    const liveRosterWarrior = { id: 'w-live', status: 'Active' } as Warrior;
    const tournament = { participants: [deadSnapshot] } as TournamentEntry;
    const state = { roster: [liveRosterWarrior], rivals: [] } as unknown as GameState;

    expect(findWarriorById(state, 'w-live', tournament)).toBe(liveRosterWarrior);
  });

  it('finds a warrior in the player roster', () => {
    const warrior = { id: 'w-1' } as Warrior;
    const state = { roster: [warrior], rivals: [] } as unknown as GameState;

    expect(findWarriorById(state, 'w-1')).toBe(warrior);
  });

  it('finds a warrior in rival rosters', () => {
    const warrior = { id: 'w-rival' } as Warrior;
    const state = {
      roster: [],
      rivals: [{ id: 'rival-1', roster: [warrior] }],
    } as unknown as GameState;

    expect(findWarriorById(state, 'w-rival')).toBe(warrior);
  });

  it('returns undefined if warrior not found', () => {
    const state = { roster: [], rivals: [] } as unknown as GameState;
    expect(findWarriorById(state, 'nonexistent')).toBeUndefined();
  });

  it('caches the lookup map', () => {
    const warrior = { id: 'w-cached' } as Warrior;
    const state = { roster: [warrior], rivals: [] } as unknown as GameState;

    // First call builds the cache
    expect(findWarriorById(state, 'w-cached')).toBe(warrior);

    // Modifying the state directly without clearing cache shouldn't affect the result
    // if cache is working properly
    state.roster = [];
    expect(findWarriorById(state, 'w-cached')).toBe(warrior);

    // After clearing cache, the modified state should be used
    clearWarriorCache();
    expect(findWarriorById(state, 'w-cached')).toBeUndefined();
  });

  it('handles state without rivals', () => {
    const warrior = { id: 'w-1' } as Warrior;
    const state = { roster: [warrior] } as unknown as GameState;

    expect(findWarriorById(state, 'w-1')).toBe(warrior);
  });

  it('buildWeekCaches invalidates the lookup map at the stage boundary', () => {
    // Mid-tick removal: a roster edit applied between impact-resolution
    // boundaries must not leave findWarriorById serving pre-impact answers.
    const gone = { id: 'w-gone' } as Warrior;
    const state = makeGameState({ rivals: [{ id: 'r1', roster: [gone] }] as any });

    expect(findWarriorById(state, 'w-gone')).toBe(gone); // builds the cache

    state.rivals = [];
    buildWeekCaches(state); // same state object — caches rebuilt for the next stage

    expect(findWarriorById(state, 'w-gone')).toBeUndefined();
  });
});
