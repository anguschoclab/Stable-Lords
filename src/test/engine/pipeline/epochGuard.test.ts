import { describe, it, expect } from 'vitest';
import {
  engineSession,
  bumpEngineEpoch,
  getEngineEpoch,
  engineQueueDepth,
} from '@/engine/runtime/session';

/**
 * engineSession guarantees:
 *  1. FIFO serialization — queued jobs never overlap.
 *  2. Epoch guard — a job whose enclosing call predates a wholesale state
 *     replacement (loadGame/reset) resolves `undefined` so the caller drops
 *     the stale result instead of committing it.
 *
 * The epoch must be captured when runExclusive is CALLED (the caller has
 * already bound its input state into the job closure) — not when the job
 * starts. A job enqueued before a bump but started after it still computes
 * on superseded state and must be discarded.
 */
describe('engineSession epoch guard', () => {
  it('discards a result computed across a mid-job epoch bump', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));

    const result = engineSession.runExclusive(async () => {
      await gate;
      return 'stale-result';
    });

    bumpEngineEpoch(); // loadGame/reset lands while the job is in flight
    release();

    await expect(result).resolves.toBeUndefined();
  });

  it('discards a job enqueued BEFORE a bump even though it starts after it', async () => {
    // Occupy the queue so `queued` cannot start until after the bump.
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => (releaseFirst = resolve));

    const running = engineSession.runExclusive(async () => {
      await firstGate;
      return 'first';
    });

    // This job binds its (soon-stale) input at enqueue time, then a loadGame
    // lands before it ever starts.
    const queued = engineSession.runExclusive(() => Promise.resolve('stale-queued'));

    bumpEngineEpoch();
    releaseFirst();

    await expect(running).resolves.toBeUndefined();
    await expect(queued).resolves.toBeUndefined();
  });

  it('returns results for jobs whose epoch never moved', async () => {
    const result = await engineSession.runExclusive(() => Promise.resolve(42));
    expect(result).toBe(42);
    expect(getEngineEpoch()).toBeGreaterThan(0);
  });

  it('serializes jobs FIFO without overlap', async () => {
    const order: number[] = [];
    const jobs = [0, 1, 2].map((i) =>
      engineSession.enqueue(
        () =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              order.push(i);
              resolve();
            }, (2 - i) * 10)
          )
      )
    );
    await Promise.all(jobs);
    // Enqueue order wins even though later jobs finish faster.
    expect(order).toEqual([0, 1, 2]);
    expect(engineQueueDepth()).toBe(0);
  });

  it('a rejected job does not poison the queue', async () => {
    await expect(engineSession.enqueue(() => Promise.reject(new Error('boom')))).rejects.toThrow(
      'boom'
    );
    await expect(engineSession.enqueue(() => Promise.resolve('ok'))).resolves.toBe('ok');
  });
});
