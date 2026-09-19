import { describe, it, expect } from 'vitest';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { DeferredBoutLog } from '@/types/state.types';

const log = (boutId: string): DeferredBoutLog => ({
  year: 1,
  season: 1,
  boutId,
  transcript: ['line'],
});

describe('drainDeferredBoutLogs', () => {
  it('returns the queued logs and empties the queue', () => {
    const state = createFreshState('drain-basic');
    const logs = [log('b1'), log('b2')];
    state.deferredBoutLogs = logs;

    const drained = drainDeferredBoutLogs(state);

    expect(drained).toBe(logs);
    expect(drained).toHaveLength(2);
    expect(state.deferredBoutLogs).toEqual([]);
  });

  it('returns an empty array without touching state when the queue is empty', () => {
    const state = createFreshState('drain-empty');
    state.deferredBoutLogs = [];

    expect(drainDeferredBoutLogs(state)).toEqual([]);
    expect(state.deferredBoutLogs).toEqual([]);
  });

  it('returns an empty array when the field is absent', () => {
    const state = createFreshState('drain-absent');
    delete state.deferredBoutLogs;

    expect(drainDeferredBoutLogs(state)).toEqual([]);
    expect(state.deferredBoutLogs).toBeUndefined();
  });
});
