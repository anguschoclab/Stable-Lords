/**
 * Isolation sentinels — assert that module-level singletons mutated by one
 * test are restored before the next test runs. These are the preconditions
 * for ever running a cohort with `isolate: false` (shared module state across
 * files), and they also catch within-file leakage today.
 *
 * Each pair works the same way: test A mutates the singleton and does not
 * clean up; test B asserts the mutation is gone — which is only true if the
 * global setup file resets it in an afterEach/beforeEach.
 */
import { describe, it, expect } from 'vitest';
import { engineEventBus } from '@/engine/core/EventBus';
import { setMockIdGenerator, generateId } from '@/utils/idUtils';
import { useGameStore } from '@/state/useGameStore';
import { makeWarrior, resetFixtureIds } from '../_fixtures/factories';
import { registerArena, getAllArenas } from '@/data/arenas';
import { STANDARD_ARENA } from '@/data/arenas';
import { configureEnginePool, getEnginePool } from '@/engine/pool/enginePool';

// Module-level leak probe: persists across tests in this file by design —
// a leaked subscriber pushes into it when the bus emits.
const leakLog: string[] = [];

describe('isolation sentinels', () => {
  describe('engineEventBus', () => {
    it('A: subscribes a listener and abandons it', () => {
      engineEventBus.subscribe((e) => leakLog.push(e.type));
      leakLog.length = 0;
    });

    it('B: abandoned listener does not observe a later emit', () => {
      engineEventBus.emit({
        type: 'SEASON_CHANGED',
        payload: { prevSeason: 'Spring', newSeason: 'Summer', year: 1 },
      });
      expect(leakLog).toHaveLength(0);
    });
  });

  describe('mock id generator', () => {
    it('A: installs a mock generator', () => {
      setMockIdGenerator(() => 'MOCKED_ID');
      expect(generateId()).toBe('MOCKED_ID');
    });

    it('B: generator returns to the default path', () => {
      expect(generateId()).not.toBe('MOCKED_ID');
    });
  });

  describe('useGameStore', () => {
    it('A: mutates the store', () => {
      useGameStore.setState({ week: 999 });
      expect(useGameStore.getState().week).toBe(999);
    });

    it('B: store returns to its initial state', () => {
      expect(useGameStore.getState().week).toBe(useGameStore.getInitialState().week);
    });
  });

  describe('localStorage', () => {
    it('A: writes a key', () => {
      localStorage.setItem('sentinel', '1');
      expect(localStorage.getItem('sentinel')).toBe('1');
    });

    it('B: key is gone', () => {
      expect(localStorage.getItem('sentinel')).toBeNull();
    });
  });

  describe('arena registry', () => {
    it('A: registers a test arena and abandons it', () => {
      registerArena({ ...STANDARD_ARENA, id: 'sentinel_arena' });
      expect(getAllArenas().some((a) => a.id === 'sentinel_arena')).toBe(true);
    });

    it('B: registry returns to the built-in set', () => {
      expect(getAllArenas().some((a) => a.id === 'sentinel_arena')).toBe(false);
    });
  });

  describe('engine pool', () => {
    it('A: configures the shared pool to size 4 and abandons it', () => {
      configureEnginePool(4);
      expect(getEnginePool().size).toBe(4);
    });

    it('B: shared pool returns to size 1 (in-line path)', () => {
      expect(getEnginePool().size).toBe(1);
    });
  });

  describe('fixture id counter', () => {
    it('produces deterministic ids after resetFixtureIds', () => {
      resetFixtureIds();
      expect(makeWarrior().id).toBe('w_1');
      expect(makeWarrior().id).toBe('w_2');
    });
  });
});
