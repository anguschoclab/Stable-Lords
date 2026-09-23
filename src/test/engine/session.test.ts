import { describe, it, expect } from 'vitest';
import { engineSession, bumpEngineEpoch, engineQueueDepth } from '@/engine/session';

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

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
