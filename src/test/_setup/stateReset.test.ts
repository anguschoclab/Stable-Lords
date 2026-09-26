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
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { setMockIdGenerator, generateId } from '@/utils/idUtils';
import { useGameStore } from '@/state/useGameStore';
import { makeWarrior, makeFightSummary, resetFixtureIds } from '../_fixtures/factories';

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

  describe('NewsletterFeed', () => {
    it('A: appends a fight card and abandons it', () => {
      NewsletterFeed.appendFightResult({
        summary: makeFightSummary({ id: 'sentinel_fight' as never }),
        transcript: [],
      });
    });

    it('B: feed is empty for the next week close', () => {
      const issue = NewsletterFeed.closeWeekToIssue(1);
      expect(issue.fights).toHaveLength(0);
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

  describe('fixture id counter', () => {
    it('produces deterministic ids after resetFixtureIds', () => {
      resetFixtureIds();
      expect(makeWarrior().id).toBe('w_1');
      expect(makeWarrior().id).toBe('w_2');
    });
  });
});
