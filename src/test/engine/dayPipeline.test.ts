import { describe, it, expect, vi } from 'vitest';
import { advanceDay } from '@/engine/pipeline/tick/dayAdvance';
import { TickOrchestrator } from '@/engine/tick/TickOrchestrator';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('dayPipeline', () => {
  it('delegates to TickOrchestrator.advanceDay', () => {
    const mockState = createFreshState('test-seed');

    // Spy on TickOrchestrator.advanceDay
    const advanceDaySpy = vi.spyOn(TickOrchestrator, 'advanceDay');

    // Call the function under test
    advanceDay(mockState);

    // Verify it delegated to TickOrchestrator
    expect(advanceDaySpy).toHaveBeenCalledWith(mockState);
    expect(advanceDaySpy).toHaveBeenCalledTimes(1);

    // Clean up spy
    vi.restoreAllMocks();
  });
});
