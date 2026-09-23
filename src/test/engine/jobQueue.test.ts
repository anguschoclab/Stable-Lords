import { describe, it, expect, vi } from 'vitest';
import { createJobQueue } from '@/engine/jobQueue';

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('jobQueue', () => {
  it('serializes jobs FIFO — a second job cannot interleave with a running one', async () => {
    const queue = createJobQueue();
    const order: string[] = [];
    const gate = deferred<null>();

    const p1 = queue.enqueue(async () => {
      order.push('job1-start');
      await gate.promise;
      order.push('job1-end');
      return 'a';
    });
    const p2 = queue.enqueue(async () => {
      order.push('job2');
      return 'b';
    });

    // Job 2 must not start while job 1 is suspended at its await.
    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual(['job1-start']);

    gate.resolve(null);
    await expect(p1).resolves.toBe('a');
    await expect(p2).resolves.toBe('b');
    expect(order).toEqual(['job1-start', 'job1-end', 'job2']);
  });

  it('a rejected job does not poison the queue', async () => {
    const queue = createJobQueue();
    const err = new Error('boom');

    const p1 = queue.enqueue(async () => {
      throw err;
    });
    const p2 = queue.enqueue(async () => 'ok');

    await expect(p1).rejects.toBe(err);
    await expect(p2).resolves.toBe('ok');
  });

  it('supports synchronous job functions', async () => {
    const queue = createJobQueue();
    await expect(queue.enqueue(() => 42)).resolves.toBe(42);
  });

  it('tracks pending depth', async () => {
    const queue = createJobQueue();
    const gate = deferred<null>();

    const p1 = queue.enqueue(() => gate.promise);
    const p2 = queue.enqueue(async () => 'x');
    expect(queue.pending).toBe(2);

    gate.resolve(null);
    await Promise.all([p1, p2]);
    expect(queue.pending).toBe(0);
  });

  it('forwards arguments to the job', async () => {
    const queue = createJobQueue();
    const spy = vi.fn((a: number, b: string) => `${a}-${b}`);
    await expect(queue.enqueue(spy, 7, 'x')).resolves.toBe('7-x');
    expect(spy).toHaveBeenCalledWith(7, 'x');
  });
});
