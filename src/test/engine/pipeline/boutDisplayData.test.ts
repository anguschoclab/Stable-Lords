import { describe, it, expect } from 'vitest';
import { runBoutSimulationPass } from '@/engine/pipeline/passes/BoutSimulationPass';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { SeededRNG } from '@/utils/random';
import { makeSignedBoutState } from '@/test/_fixtures/signedBout';

describe('BoutSimulationPass returns display data', () => {
  it('runBoutSimulationPass returns { impact, results, summary }', async () => {
    const state = makeSignedBoutState();
    const rng = new SeededRNG(42);
    const result = runBoutSimulationPass(state, rng);

    expect(result).toHaveProperty('impact');
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.summary).toHaveProperty('deathNames');
    expect(result.summary).toHaveProperty('injuryNames');
  });

  it('runBoutPhase stashes lastWeekBoutDisplay on state via advanceWeek', async () => {
    const state = makeSignedBoutState();
    const nextState = await advanceWeek(state);

    expect(nextState.lastWeekBoutDisplay).toBeDefined();
    expect(nextState.lastWeekBoutDisplay!.results).toHaveLength(1);
    expect(Array.isArray(nextState.lastWeekBoutDisplay!.deathNames)).toBe(true);
    expect(Array.isArray(nextState.lastWeekBoutDisplay!.injuryNames)).toBe(true);
  });

  it('lastWeekBoutDisplay is plain serializable data (no Maps)', async () => {
    const state = makeSignedBoutState();
    const nextState = await advanceWeek(state);

    expect(() => JSON.stringify(nextState.lastWeekBoutDisplay)).not.toThrow();
    expect(() => structuredClone(nextState.lastWeekBoutDisplay)).not.toThrow();
  });
});
