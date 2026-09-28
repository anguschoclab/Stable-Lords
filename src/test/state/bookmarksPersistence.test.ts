import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { stripNonSerializable, reconstructGameState } from '@/state/serialization';
import type { Bookmark } from '@/types/bookmark.types';
import { makeGameState } from '@/test/_fixtures/factories';

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
    const mockStore: any = makeGameState({
      treasury: 500,
      recruitPool: [],
      insightTokens: 0,
      player: { id: 'p1', name: 'Player', stableName: 'Test', fame: 0, renown: 0, titles: 0 },
      day: 1,
      rivals: [],
      activeTournamentId: undefined,
      crowdMood: 'Neutral',
      isFTUE: false,
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
    });

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
    const mockStore: any = makeGameState({
      treasury: 0,
      recruitPool: [],
      insightTokens: 0,
      player: { id: 'p1', name: 'Player', stableName: 'Test', fame: 0, renown: 0, titles: 0 },
      day: 1,
      rivals: [],
      activeTournamentId: undefined,
      crowdMood: 'Neutral',
      isFTUE: false,
      lastSimulationReport: undefined,
      atTitleScreen: false,
      lastSavedAt: null,
      activeSlotId: null,
      isSimulating: false,
      isInitialized: true,
      eventLogOpen: false,
    });

    const reconstructed = reconstructGameState(mockStore);
    expect(reconstructed.bookmarks).toEqual([]);
  });
});
