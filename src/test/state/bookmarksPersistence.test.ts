import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { stripNonSerializable, reconstructGameState } from '@/state/serialization';
import type { Bookmark } from '@/types/bookmark.types';

describe('Bookmarks Persistence', () => {
  it('createFreshState initializes with empty bookmarks', () => {
    const state = createFreshState('test-seed');
    expect(state.bookmarks).toEqual([]);
  });

  it('bookmarks survive stripNonSerializable', () => {
    const state = createFreshState('test-seed');
    const bookmarks: Bookmark[] = [
      { entityType: 'warrior', entityId: 'w1', createdAt: '2026-01-01T00:00:00.000Z' },
      { entityType: 'promoter', entityId: 'p1', createdAt: '2026-01-02T00:00:00.000Z' },
    ];
    state.bookmarks = bookmarks;

    const stripped = stripNonSerializable(state);
    expect(stripped.bookmarks).toEqual(bookmarks);
  });

  it('bookmarks survive JSON round-trip', () => {
    const state = createFreshState('test-seed');
    state.bookmarks = [
      { entityType: 'rival', entityId: 'r1', createdAt: '2026-06-14T12:00:00.000Z' },
      { entityType: 'tournament', entityId: 'tr1', createdAt: '2026-06-15T12:00:00.000Z' },
    ];

    const serialized = JSON.stringify(stripNonSerializable(state));
    const deserialized = JSON.parse(serialized);

    expect(deserialized.bookmarks).toHaveLength(2);
    expect(deserialized.bookmarks[0]).toMatchObject({
      entityType: 'rival',
      entityId: 'r1',
      createdAt: '2026-06-14T12:00:00.000Z',
    });
    expect(deserialized.bookmarks[1]).toMatchObject({
      entityType: 'tournament',
      entityId: 'tr1',
    });
  });

  it('reconstructGameState preserves bookmarks', () => {
    const mockStore = {
      treasury: 500,
      ledger: [],
      roster: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      insightTokens: 0,
      arenaHistory: [],
      player: { id: 'p1', name: 'Player', stableName: 'Test', fame: 0, renown: 0, titles: 0 },
      week: 1,
      day: 1,
      season: 'Spring',
      weather: 'Clear',
      promoters: {},
      boutOffers: {},
      rivals: [],
      gazettes: [],
      scoutReports: [],
      unacknowledgedDeaths: [],
      rosterBonus: 0,
      tournaments: [],
      isTournamentWeek: false,
      activeTournamentId: undefined,
      year: 1,
      popularity: 0,
      fame: 0,
      realmRankings: {},
      awards: [],
      trainers: [],
      hiringPool: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      restStates: [],
      crowdMood: 'Neutral',
      moodHistory: [],
      newsletter: [],
      hallOfFame: [],
      isFTUE: false,
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
      bookmarks: [
        { entityType: 'warrior', entityId: 'w1', createdAt: '2026-01-01' },
        { entityType: 'scoutReport', entityId: 'sr1', createdAt: '2026-01-02' },
      ],
      atTitleScreen: false,
      lastSavedAt: null,
      activeSlotId: null,
      isSimulating: false,
      isInitialized: true,
      eventLogOpen: false,
    } as any;

    const reconstructed = reconstructGameState(mockStore);
    expect(reconstructed.bookmarks).toHaveLength(2);
    expect(reconstructed.bookmarks[0]).toMatchObject({
      entityType: 'warrior',
      entityId: 'w1',
    });
    expect(reconstructed.bookmarks[1]).toMatchObject({
      entityType: 'scoutReport',
      entityId: 'sr1',
    });
  });

  it('handles empty bookmarks array in reconstructGameState', () => {
    const mockStore = {
      bookmarks: [],
      treasury: 0,
      ledger: [],
      roster: [],
      graveyard: [],
      retired: [],
      recruitPool: [],
      insightTokens: 0,
      arenaHistory: [],
      player: { id: 'p1', name: 'Player', stableName: 'Test', fame: 0, renown: 0, titles: 0 },
      week: 1,
      day: 1,
      season: 'Spring',
      weather: 'Clear',
      promoters: {},
      boutOffers: {},
      rivals: [],
      gazettes: [],
      scoutReports: [],
      unacknowledgedDeaths: [],
      rosterBonus: 0,
      tournaments: [],
      isTournamentWeek: false,
      activeTournamentId: undefined,
      year: 1,
      popularity: 0,
      fame: 0,
      realmRankings: {},
      awards: [],
      trainers: [],
      hiringPool: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      restStates: [],
      crowdMood: 'Neutral',
      moodHistory: [],
      newsletter: [],
      hallOfFame: [],
      isFTUE: false,
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
      atTitleScreen: false,
      lastSavedAt: null,
      activeSlotId: null,
      isSimulating: false,
      isInitialized: true,
      eventLogOpen: false,
    } as any;

    const reconstructed = reconstructGameState(mockStore);
    expect(reconstructed.bookmarks).toEqual([]);
  });
});
