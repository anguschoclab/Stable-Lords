/**
 * Stable Lords — Sim Cancellation
 *
 * Worker-local cooperative cancellation. AbortSignal cannot cross postMessage,
 * so cancellation is a module flag inside the worker's realm: `cancelSim`
 * (exposed unqueued by the engine worker) sets it, and long-running loops
 * (autosim weeks, quarter/year week strides) poll it at week boundaries and
 * exit early with stopReason 'cancelled'.
 *
 * The flag is cleared when each sim job starts — a cancel applies to the job
 * in flight, never to whatever is queued behind it.
 */
let requested = false;

/** Request cancellation of the currently-running sim job. */
export function requestSimCancellation(): void {
  requested = true;
}

/** Clear a pending request — called at the start of every new sim job. */
export function clearSimCancellation(): void {
  requested = false;
}

/** Whether a cancellation is pending — polled at week boundaries. */
export function isSimCancellationRequested(): boolean {
  return requested;
}
