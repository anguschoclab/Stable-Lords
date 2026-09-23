/**
 * Stable Lords — Engine Job Queue
 *
 * Serializes asynchronous engine work. Comlink dispatches every message the
 * moment it arrives, so without a queue two overlapping calls (advanceWeek,
 * autosim, quarter advance) can interleave at `await` points inside the same
 * worker. enqueue() chains jobs FIFO; a rejected job does not poison the
 * queue for the next one.
 */
export interface JobQueue {
  enqueue<A extends unknown[], R>(fn: (...args: A) => Promise<R> | R, ...args: A): Promise<R>;
  /** Number of jobs queued behind the currently running one. */
  readonly pending: number;
}

export function createJobQueue(): JobQueue {
  let tail: Promise<unknown> = Promise.resolve();
  let pending = 0;

  return {
    enqueue<A extends unknown[], R>(fn: (...args: A) => Promise<R> | R, ...args: A): Promise<R> {
      pending++;
      const job = tail.then(() => fn(...args));
      tail = job.catch(() => {});
      return job.finally(() => {
        pending--;
      }) as Promise<R>;
    },
    get pending() {
      return pending;
    },
  };
}
