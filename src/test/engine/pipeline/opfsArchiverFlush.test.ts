/**
 * flushDeferredArchivesOffThread — durability of deferred bout logs.
 *
 * The state copy drops `deferredBoutLogs` immediately (the transcripts were
 * already detached at finalizeState). If the archive worker fails, the logs
 * must not be lost: a direct-archive fallback through `archiveService` must
 * still attempt every log (F-arch2).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const flushLogs = vi.fn();
const archiveBoutLog = vi.fn();

vi.mock('@/engine/storage/archiveWorkerProxy', () => ({
  archiveWorkerProxy: { flushLogs: (...args: unknown[]) => flushLogs(...args) },
}));

vi.mock('@/engine/storage/archiveService', () => ({
  archiveService: {
    isSupported: () => true,
    archiveBoutLog: (...args: unknown[]) => archiveBoutLog(...args),
  },
}));

import {
  flushDeferredArchivesOffThread,
  getPendingArchiveRetries,
  onArchiveRetry,
} from '@/engine/pipeline/adapters/opfsArchiver';
import type { GameState } from '@/types/state.types';

function stateWithLogs(n: number): GameState {
  const deferredBoutLogs = Array.from({ length: n }, (_, i) => ({
    year: 1,
    season: 0,
    boutId: `bout_${i}`,
    transcript: [`line ${i}`],
  }));
  return { deferredBoutLogs } as unknown as GameState;
}

beforeEach(() => {
  flushLogs.mockReset().mockResolvedValue(undefined);
  archiveBoutLog.mockReset().mockResolvedValue(undefined);
});

describe('flushDeferredArchivesOffThread', () => {
  it('clears deferred logs from state and hands them to the worker', () => {
    const state = stateWithLogs(3);
    const out = flushDeferredArchivesOffThread(state);
    expect(out.deferredBoutLogs).toEqual([]);
    expect(flushLogs).toHaveBeenCalledTimes(1);
    expect(flushLogs.mock.calls[0]?.[0]).toHaveLength(3);
  });

  it('is a no-op when there are no deferred logs', () => {
    const out = flushDeferredArchivesOffThread(stateWithLogs(0));
    expect(out.deferredBoutLogs).toEqual([]);
    expect(flushLogs).not.toHaveBeenCalled();
  });

  it('falls back to direct archiving when the worker flush fails', async () => {
    flushLogs.mockRejectedValue(new Error('worker died'));
    const state = stateWithLogs(2);
    flushDeferredArchivesOffThread(state);
    // The fallback runs in the catch of the worker promise — let it settle.
    await vi.waitFor(() => {
      expect(archiveBoutLog).toHaveBeenCalledTimes(2);
    });
    expect(archiveBoutLog).toHaveBeenCalledWith(1, 0, 'bout_0', ['line 0'], true);
    expect(archiveBoutLog).toHaveBeenCalledWith(1, 0, 'bout_1', ['line 1'], true);
  });

  it('parks failed logs in the retry registry (not the returned state) and retries on the next flush', async () => {
    flushLogs.mockRejectedValue(new Error('worker died'));
    archiveBoutLog.mockImplementation((_y: number, _s: number, boutId: string) =>
      boutId === 'bout_1' ? Promise.reject(new Error('disk full')) : Promise.resolve(undefined)
    );
    const state = stateWithLogs(3);
    flushDeferredArchivesOffThread(state);
    await vi.waitFor(() => {
      expect(archiveBoutLog).toHaveBeenCalledTimes(3);
    });
    // The failed log lands in the module-level retry registry — never pushed
    // back onto a state array that may already be detached from the store.
    await vi.waitFor(() => {
      expect(getPendingArchiveRetries()).toHaveLength(1);
    });
    expect(getPendingArchiveRetries()[0]?.boutId).toBe('bout_1');
    expect(state.deferredBoutLogs).toEqual([]);

    // The next flush re-attempts the parked log even with no new logs.
    flushLogs.mockReset().mockResolvedValue(undefined);
    flushDeferredArchivesOffThread(stateWithLogs(0));
    await vi.waitFor(() => {
      expect(flushLogs).toHaveBeenCalledTimes(1);
    });
    expect(flushLogs.mock.calls[0]?.[0]).toHaveLength(1);
    expect(flushLogs.mock.calls[0]?.[0]?.[0]?.boutId).toBe('bout_1');
    await vi.waitFor(() => {
      expect(getPendingArchiveRetries()).toHaveLength(0);
    });
  });

  it('notifies retry subscribers so the store can re-queue onto live state', async () => {
    const listener = vi.fn();
    const unsubscribe = onArchiveRetry(listener);
    try {
      flushLogs.mockRejectedValue(new Error('worker died'));
      archiveBoutLog.mockRejectedValue(new Error('disk full'));
      flushDeferredArchivesOffThread(stateWithLogs(2));
      await vi.waitFor(() => {
        expect(listener).toHaveBeenCalledTimes(2);
      });
      expect(listener.mock.calls[0]?.[0]?.boutId).toBe('bout_0');
      expect(listener.mock.calls[1]?.[0]?.boutId).toBe('bout_1');
    } finally {
      unsubscribe();
    }
  });
});
