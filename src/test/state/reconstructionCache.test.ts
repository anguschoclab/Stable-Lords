import { describe, it, expect } from 'vitest';
import { clearReconstructionCache, reconstructGameState } from '@/state/serialization';
import { makeGameState } from '@/test/_fixtures/factories';

describe('#8c clearReconstructionCache invalidates cached result', () => {
  it('returns a fresh result after cache is cleared', () => {
    const mockStore: any = makeGameState({
      recruitPool: [],
      player: { id: 'p1', name: 'Test', stableName: 'Test', crest: {}, generation: 0 },
      rivals: [],
      activeTournamentId: null,
      crowdMood: 'Neutral',
      isFTUE: false,
      lastSavedAt: null,
    });

    const result1 = reconstructGameState(mockStore);
    clearReconstructionCache();
    mockStore.treasury = 2000;
    const result2 = reconstructGameState(mockStore);

    expect(result2.treasury).toBe(2000);
    expect(result1).not.toBe(result2);
  });

  it('deferredBoutLogs survives the store → GameState reconstruction roundtrip', () => {
    const logs = [{ year: 2, season: 1, boutId: 'bout-x', transcript: ['l1'] }];
    const mockStore: any = makeGameState({
      recruitPool: [],
      player: { id: 'p1', name: 'Test', stableName: 'Test', crest: {}, generation: 0 },
      rivals: [],
      activeTournamentId: null,
      crowdMood: 'Neutral',
      isFTUE: false,
      lastSavedAt: null,
      deferredBoutLogs: logs,
    });

    clearReconstructionCache();
    const result = reconstructGameState(mockStore);
    expect(result.deferredBoutLogs).toEqual(logs);

    // And a mutation to the store field must invalidate the cache.
    mockStore.deferredBoutLogs = [...logs, { year: 2, season: 1, boutId: 'b2', transcript: [] }];
    const result2 = reconstructGameState(mockStore);
    expect(result2.deferredBoutLogs).toHaveLength(2);
  });
});
