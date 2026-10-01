import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { makeSignedBoutState } from '@/test/_fixtures/signedBout';

describe('Bout Simulation Integration - getFromArchive function issue', () => {
  it('should simulate a signed bout and update state accordingly', async () => {
    const initialState = makeSignedBoutState();

    // 2. Advance the week (which should trigger the simulation)
    const nextState = await advanceWeek(initialState);

    // 3. Verifications
    // - Should have 1 fight in history (if bout was processed)
    expect(nextState.arenaHistory.length).toBe(1);

    // - lastWeekBoutDisplay should be stashed with results and summary data
    expect(nextState.lastWeekBoutDisplay).toBeDefined();
    expect(nextState.lastWeekBoutDisplay!.results).toHaveLength(1);
    // Casualty lists are stashed for the bout screen. Whether this particular
    // seeded bout produces an injury is combat tuning, not pipeline behavior —
    // assert the shape, not the outcome.
    expect(Array.isArray(nextState.lastWeekBoutDisplay!.deathNames)).toBe(true);
    expect(Array.isArray(nextState.lastWeekBoutDisplay!.injuryNames)).toBe(true);

    // - The offer should be removed from boutOffers (assuming processWeekBouts prunes it)
    expect((nextState.boutOffers as any)['offer-1']).toBeUndefined();

    // - Treasury should have changed (purse or show fee)
    expect(nextState.treasury).not.toBe(1000);
  });
});
