/**
 * Stable Lords — Engine Session Facade (main thread)
 *
 * Single owner of every `engineProxy` call. Two guarantees:
 *
 * 1. Serialization — all engine work funnels through one FIFO queue, so a
 *    caller can never overlap two engine jobs (e.g. admin skip vs. an
 *    in-flight week advance).
 * 2. Epoch guard — `loadEpochBump()` must be invoked whenever the store is
 *    replaced (loadGame/reset). If the epoch changed while a job was in
 *    flight, its result is stale and `runExclusive` resolves `undefined`
 *    instead of letting the caller apply it.
 */
import { createJobQueue, type JobQueue } from './jobQueue';

let epoch = 0;
let queue: JobQueue | null = null;

function getQueue(): JobQueue {
  if (!queue) queue = createJobQueue();
  return queue;
}

/** Bump the session epoch — call whenever game state is wholesale replaced. */
export function bumpEngineEpoch(): number {
  return ++epoch;
}

/**
 * Current session epoch — bumps on every wholesale state replacement.
 */
export function getEngineEpoch(): number {
  return epoch;
}

/** Pending engine jobs queued behind the currently running one. */
export function engineQueueDepth(): number {
  return queue?.pending ?? 0;
}

export const engineSession = {
  /**
   * Run `job` exclusively. The epoch is captured when the job actually starts
   * (not at enqueue time), and resolves `undefined` when the epoch moved while
   * the job ran — the caller MUST treat that as "discard the result".
   */
  async runExclusive<T>(job: () => Promise<T>): Promise<T | undefined> {
    return getQueue().enqueue(async () => {
      const startEpoch = epoch;
      const result = await job();
      return epoch === startEpoch ? result : undefined;
    });
  },

  /** Queue a fire-and-forget engine job whose result is handled internally. */
  enqueue<T>(job: () => Promise<T>): Promise<T> {
    return getQueue().enqueue(job);
  },
};
