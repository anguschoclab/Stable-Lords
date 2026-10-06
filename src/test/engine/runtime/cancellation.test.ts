import { describe, it, expect, afterEach } from 'vitest';
import {
  requestSimCancellation,
  clearSimCancellation,
  isSimCancellationRequested,
} from '@/engine/runtime/cancellation';
import { runAutosim } from '@/engine/autosim/autosim';
import { TimeAdvanceService } from '@/engine/pipeline/tick/timeAdvance';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('sim cancellation flag', () => {
  afterEach(() => clearSimCancellation());

  it('defaults to clear, toggles on request, resets on clear', () => {
    expect(isSimCancellationRequested()).toBe(false);
    requestSimCancellation();
    expect(isSimCancellationRequested()).toBe(true);
    clearSimCancellation();
    expect(isSimCancellationRequested()).toBe(false);
  });
});

describe('runAutosim cancellation', () => {
  afterEach(() => clearSimCancellation());

  it('stops at the next week boundary with stopReason cancelled', async () => {
    const state = createFreshState('cancel-autosim');
    const result = await runAutosim(state, {
      weeksToSim: 20,
      // Cancel from inside the progress callback — this is how a worker-side
      // flag flip surfaces mid-run in production.
      onProgress: () => requestSimCancellation(),
    });
    expect(result.stopReason).toBe('cancelled');
    expect(result.weeksSimmed).toBeLessThan(20);
    expect(result.weeksSimmed).toBeGreaterThanOrEqual(1);
  });

  it('does not run another week once the flag is set before the run', async () => {
    const state = createFreshState('cancel-autosim-pre');
    requestSimCancellation();
    const result = await runAutosim(state, { weeksToSim: 20 });
    expect(result.stopReason).toBe('cancelled');
    expect(result.weeksSimmed).toBe(0);
  });
});

describe('advanceQuarter cancellation', () => {
  afterEach(() => clearSimCancellation());

  it('stops early with stopReason cancelled and partial weeksCompleted', async () => {
    const state = createFreshState('cancel-quarter');
    const result = await TimeAdvanceService.advanceQuarter(state, {
      headless: true,
      onProgress: () => requestSimCancellation(),
    });
    expect(result.stopReason).toBe('cancelled');
    expect(result.weeksCompleted).toBeLessThan(13);
    expect(result.weeksCompleted).toBeGreaterThanOrEqual(1);
    expect(result.pendingArchives).toEqual(expect.any(Array));
  });
});
