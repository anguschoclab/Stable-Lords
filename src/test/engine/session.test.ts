import { describe, it, expect, vi, beforeEach } from 'vitest';

// engineProxy is only touched inside runGuarded's timeout path — mocking it
// here lets cancelSim failure modes be exercised without a real worker.
vi.mock('@/engine/runtime/workerProxy', () => ({
  engineProxy: { cancelSim: vi.fn() },
}));

import { engineSession, bumpEngineEpoch, engineQueueDepth } from '@/engine/runtime/session';
import { engineProxy } from '@/engine/runtime/workerProxy';
import { deferred } from '@/test/_helpers/deferred';

describe('engineSession', () => {
  it('serializes jobs — overlapping callers cannot interleave', async () => {
    const order: string[] = [];
    const gate = deferred<null>();

    const p1 = engineSession.runExclusive(async () => {
      order.push('a-start');
      await gate.promise;
      order.push('a-end');
      return 'a';
    });
    const p2 = engineSession.runExclusive(async () => {
      order.push('b');
      return 'b';
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual(['a-start']);

    gate.resolve(null);
    expect(await p1).toBe('a');
    expect(await p2).toBe('b');
    expect(order).toEqual(['a-start', 'a-end', 'b']);
    expect(engineQueueDepth()).toBe(0);
  });

  it('discards results when the epoch moved while the job ran (stale-result guard)', async () => {
    const gate = deferred<string>();
    let started = false;
    const p = engineSession.runExclusive(async () => {
      started = true;
      return gate.promise;
    });

    // Let the job actually start (it is queued behind a microtask), then
    // simulate a loadGame/reset landing mid-flight.
    while (!started) await Promise.resolve();
    bumpEngineEpoch();
    gate.resolve('stale-result');

    // The job resolved, but the epoch moved → caller must see undefined and
    // NOT apply the result over newer state.
    await expect(p).resolves.toBeUndefined();
  });

  it('returns the result when the epoch is unchanged', async () => {
    const result = await engineSession.runExclusive(async () => 'fresh');
    expect(result).toBe('fresh');
  });

  it('propagates job rejections', async () => {
    const err = new Error('engine blew up');
    await expect(
      engineSession.runExclusive(async () => {
        throw err;
      })
    ).rejects.toBe(err);
  });
});

describe('engineSession.runGuarded', () => {
  const neverResolves = () => new Promise<never>(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(engineProxy.cancelSim!).mockResolvedValue(undefined as never);
  });

  it('resolves the job result when it completes before the timeout', async () => {
    const result = await engineSession.runGuarded(async () => 'ok', 1000);
    expect(result).toBe('ok');
    expect(engineProxy.cancelSim).not.toHaveBeenCalled();
  });

  it('rejects with a worker-timeout error and asks the worker to cancel when the job outlives the timeout', async () => {
    await expect(engineSession.runGuarded(neverResolves, 10)).rejects.toThrow(
      'Worker timeout after 10ms'
    );
    expect(engineProxy.cancelSim).toHaveBeenCalledTimes(1);
  });

  it('still rejects with the timeout error when cancelSim throws synchronously', async () => {
    vi.mocked(engineProxy.cancelSim!).mockImplementation(() => {
      throw new Error('worker gone');
    });
    await expect(engineSession.runGuarded(neverResolves, 10)).rejects.toThrow(
      'Worker timeout after 10ms'
    );
  });

  it('still rejects with the timeout error when cancelSim rejects', async () => {
    vi.mocked(engineProxy.cancelSim!).mockRejectedValue(new Error('cancel failed'));
    await expect(engineSession.runGuarded(neverResolves, 10)).rejects.toThrow(
      'Worker timeout after 10ms'
    );
  });

  it('propagates job rejections through the guard', async () => {
    const err = new Error('job exploded');
    await expect(
      engineSession.runGuarded(async () => {
        throw err;
      }, 1000)
    ).rejects.toBe(err);
    expect(engineProxy.cancelSim).not.toHaveBeenCalled();
  });
});
