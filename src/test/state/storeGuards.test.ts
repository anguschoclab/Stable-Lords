import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/engine/runtime/workerProxy', async () => await import('@/test/_mocks/engineProxy'));

vi.mock('@/engine/storage/opfsArchive', async () => await import('@/test/_mocks/opfsArchive'));

import '@/test/_setup/setup';
import { useGameStore } from '@/state/createStore';
import { clearReconstructionCache, reconstructGameState } from '@/state/serialization';
import { StyleRollups } from '@/engine/stats/styleRollups';
import { engineProxy } from '@/engine/runtime/workerProxy';
import type { GameState } from '@/types/state.types';
import { makeGameState } from '@/test/_fixtures/factories';

function makeMinimalState(overrides: Partial<GameState> = {/* empty */}): GameState {
  return makeGameState({
    meta: { gameName: 'Test', version: 'test', createdAt: '2024-01-01' },
    recruitPool: [],
    player: {
      id: 'p1',
      name: 'Test',
      stableName: 'Test',
      crest: {/* empty */} as any,
      generation: 0,
    },
    promoters: {/* empty */},
    boutOffers: {/* empty */},
    rivals: [],
    activeTournamentId: null,
    realmRankings: {/* empty */},
    crowdMood: 'Neutral',
    isFTUE: false,
    deferredBoutLogs: [],
    ...overrides,
  });
}

describe('store guards — behavioral tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().setSimulating(false);
    useGameStore.getState().setState((s) => {
      s.atTitleScreen = true;
      s.activeSlotId = null;
      s.week = 1;
      s.treasury = 1000;
    });
    clearReconstructionCache();
    StyleRollups._clearCaches();
  });

  describe('#3 doAdvanceWeek isSimulating guard', () => {
    it('returns early without calling engineProxy when isSimulating is true', async () => {
      useGameStore.getState().setSimulating(true);
      const weekBefore = useGameStore.getState().week;
      await useGameStore.getState().doAdvanceWeek();
      expect(engineProxy.advanceWeek).not.toHaveBeenCalled();
      expect(useGameStore.getState().week).toBe(weekBefore);
    });

    it('returns early without calling engineProxy when isSimulating is true (doAdvanceDay)', async () => {
      useGameStore.getState().setSimulating(true);
      await useGameStore.getState().doAdvanceDay();
      expect(engineProxy.advanceDay).not.toHaveBeenCalled();
    });
  });

  describe('#7 returnToTitle awaits saveCurrentState', () => {
    it('sets atTitleScreen=true and clears activeSlotId after save completes', async () => {
      useGameStore.getState().setState((s) => {
        s.activeSlotId = 'test-slot';
        s.atTitleScreen = false;
      });
      await useGameStore.getState().returnToTitle();
      expect(useGameStore.getState().atTitleScreen).toBe(true);
      expect(useGameStore.getState().activeSlotId).toBe(null);
    });
  });

  describe('#8a/#8b reconstruction cache invalidation', () => {
    it('loadGame invalidates the reconstruction cache so stale data is not returned', () => {
      const storeState = useGameStore.getState();
      reconstructGameState(storeState);
      const state = makeMinimalState({ week: 5, treasury: 2000 });
      useGameStore.getState().loadGame('test-slot', state);
      const result = reconstructGameState(useGameStore.getState());
      expect(result.week).toBe(5);
      expect(result.treasury).toBe(2000);
    });

    it('doReset invalidates the reconstruction cache', () => {
      const storeState = useGameStore.getState();
      reconstructGameState(storeState);
      useGameStore.getState().doReset();
      const result = reconstructGameState(useGameStore.getState());
      expect(result.week).toBe(1);
    });

    it('loadGame syncs absoluteWeek so flat-field consumers do not read a stale counter', () => {
      const state = makeMinimalState({ week: 31, year: 1, absoluteWeek: 31 });
      useGameStore.getState().loadGame('test-slot', state);
      expect(useGameStore.getState().absoluteWeek).toBe(31);
    });
  });

  describe('#9 doAdvanceWeek timeout cleanup', () => {
    it('does not leave dangling timers after successful advancement', async () => {
      vi.useFakeTimers();
      const state = makeMinimalState({ week: 1 });
      useGameStore.getState().loadGame('test-slot', state);
      const promise = useGameStore.getState().doAdvanceWeek();
      await vi.runAllTimersAsync();
      try {
        await promise;
      } catch (_e) {
        /* ignore */
      }
      vi.useRealTimers();
      expect(useGameStore.getState().isSimulating).toBe(false);
    });
  });

  describe('#11a/#11b StyleRollups cache invalidation', () => {
    it('loadGame clears StyleRollups weekCache so stale data is not returned', () => {
      localStorage.clear();
      StyleRollups._clearCaches();
      StyleRollups.addFight({
        week: 99,
        styleA: 'Gladiator',
        styleD: 'Retiarius',
        winner: 'A',
        by: 'Kill',
      });
      const week99 = StyleRollups.getWeekRollup(99);
      expect(week99['Gladiator']).toBeDefined();
      // loadGame clears caches; also clear localStorage so data is truly gone
      localStorage.clear();
      const state = makeMinimalState({ week: 5 });
      useGameStore.getState().loadGame('test-slot', state);
      const week99After = StyleRollups.getWeekRollup(99);
      expect(week99After['Gladiator']).toBeUndefined();
    });

    it('doReset clears StyleRollups caches', () => {
      localStorage.clear();
      StyleRollups._clearCaches();
      StyleRollups.addFight({
        week: 99,
        styleA: 'Gladiator',
        styleD: 'Retiarius',
        winner: 'A',
        by: 'Kill',
      });
      const week99 = StyleRollups.getWeekRollup(99);
      expect(week99['Gladiator']).toBeDefined();
      localStorage.clear();
      useGameStore.getState().doReset();
      const week99After = StyleRollups.getWeekRollup(99);
      expect(week99After['Gladiator']).toBeUndefined();
    });
  });

  describe('#13 doAdvanceDay worker timeout', () => {
    it('resets isSimulating when worker stalls beyond 15s timeout', async () => {
      vi.useFakeTimers();
      vi.mocked(engineProxy.advanceDay).mockImplementation(
        () =>
          new Promise(() => {
            /* intentionally empty to simulate hang */
          })
      );
      const state = makeMinimalState({ week: 1 });
      useGameStore.getState().loadGame('test-slot', state);
      const promise = useGameStore.getState().doAdvanceDay();
      vi.advanceTimersByTime(16000);
      try {
        await promise;
      } catch (_e) {
        /* ignore */
      }
      // The timeout fires and isSimulating is reset even on failure
      expect(useGameStore.getState().isSimulating).toBe(false);
      vi.useRealTimers();
      vi.mocked(engineProxy.advanceDay).mockResolvedValue({
        week: 1,
        day: 1,
        phase: 'planning',
      } as any);
    });
  });
});
