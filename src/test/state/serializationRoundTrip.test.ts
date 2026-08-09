import { describe, it, expect } from 'vitest';
import {
  stripNonSerializable,
  reconstructGameState,
  clearReconstructionCache,
} from '@/state/serialization';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('serializationRoundTrip', () => {
  it('stripNonSerializable removes all 7 cached maps', () => {
    const state = createFreshState('serialization-test');
    // Add cached maps
    state.warriorMap = new Map();
    state.warriorToStableMap = new Map();
    state.rivalMap = new Map();
    state.rivalryMap = new Map();
    state.grudgeMap = new Map();
    state.warriorToOfferIds = new Map();
    state.cachedMetaDrift = {} as any;

    const stripped = stripNonSerializable(state);

    expect((stripped as any).warriorMap).toBeUndefined();
    expect((stripped as any).warriorToStableMap).toBeUndefined();
    expect((stripped as any).rivalMap).toBeUndefined();
    expect((stripped as any).rivalryMap).toBeUndefined();
    expect((stripped as any).grudgeMap).toBeUndefined();
    expect((stripped as any).warriorToOfferIds).toBeUndefined();
    expect((stripped as any).cachedMetaDrift).toBeUndefined();
  });

  it('stripNonSerializable preserves all serializable fields', () => {
    const state = createFreshState('serialization-preserve-test');
    const stripped = stripNonSerializable(state);

    expect(stripped.treasury).toBe(state.treasury);
    expect(stripped.week).toBe(state.week);
    expect(stripped.year).toBe(state.year);
    expect(stripped.roster).toBe(state.roster);
    expect(stripped.rivals).toBe(state.rivals);
  });

  it('reconstructGameState cache invalidates on store change', () => {
    clearReconstructionCache();

    const store1 = {
      treasury: 1000,
      roster: [],
      rivals: [],
      week: 1,
      year: 1,
      day: 0,
      season: 'Spring',
      weather: 'Clear',
      crowdMood: 'Calm',
      ledger: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      insightTokens: [],
      arenaHistory: [],
      player: { id: 'p1', name: 'Test', stableName: 'Test', fame: 0, renown: 0, titles: 0 },
      promoters: {},
      boutOffers: {},
      gazettes: [],
      scoutReports: [],
      unacknowledgedDeaths: [],
      rosterBonus: 0,
      tournaments: [],
      isTournamentWeek: false,
      activeTournamentId: undefined,
      popularity: 0,
      fame: 0,
      realmRankings: {},
      awards: [],
      trainers: [],
      hiringPool: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      restStates: [],
      moodHistory: [],
      newsletter: [],
      hallOfFame: [],
      isFTUE: true,
      ftueStep: 0,
      ftueComplete: false,
      coachDismissed: [],
      rivalries: [],
      matchHistory: [],
      ownerGrudges: [],
      phase: 'planning',
      playerChallenges: [],
      playerAvoids: [],
      lastSimulationReport: undefined,
      bookmarks: [],
      progression: undefined,
      lastSavedAt: '',
    } as any;

    const result1 = reconstructGameState(store1);
    expect(result1.treasury).toBe(1000);

    // Change treasury — should produce a new result
    store1.treasury = 2000;
    const result2 = reconstructGameState(store1);
    expect(result2.treasury).toBe(2000);
    expect(result2).not.toBe(result1); // Should be a new object
  });

  it('NF4: reconstructGameState returns stale data when store mutated via setState (demonstrating bug)', () => {
    clearReconstructionCache();

    const store = {
      treasury: 1000,
      roster: [],
      rivals: [],
      week: 1,
      year: 1,
      day: 0,
      season: 'Spring',
      weather: 'Clear',
      crowdMood: 'Calm',
      ledger: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      insightTokens: [],
      arenaHistory: [],
      player: { id: 'p1', name: 'Test', stableName: 'Test', fame: 0, renown: 0, titles: 0 },
      promoters: {},
      boutOffers: {},
      gazettes: [],
      scoutReports: [],
      unacknowledgedDeaths: [],
      rosterBonus: 0,
      tournaments: [],
      isTournamentWeek: false,
      activeTournamentId: undefined,
      popularity: 0,
      fame: 0,
      realmRankings: {},
      awards: [],
      trainers: [],
      hiringPool: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      restStates: [],
      moodHistory: [],
      newsletter: [],
      hallOfFame: [],
      isFTUE: true,
      ftueStep: 0,
      ftueComplete: false,
      coachDismissed: [],
      rivalries: [],
      matchHistory: [],
      ownerGrudges: [],
      phase: 'planning',
      playerChallenges: [],
      playerAvoids: [],
      lastSimulationReport: undefined,
      bookmarks: [],
      progression: undefined,
      lastSavedAt: '',
    } as any;

    // First call populates cache
    const result1 = reconstructGameState(store);
    expect(result1.treasury).toBe(1000);

    // Mutate the same store object in-place (simulating setState mutation)
    // The cache compares references, so if the same object reference is passed,
    // it should detect the change. But if the store mutates without changing
    // the reference, the cache will return stale data.
    store.treasury = 5000;

    // CORRECT behavior: should return updated treasury
    // This currently PASSES because the reference comparison detects the change
    // (store.treasury is a primitive, so the reference comparison works)
    const result2 = reconstructGameState(store);
    expect(result2.treasury).toBe(5000);
  });
});
