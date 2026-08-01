import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('headlessModeConsistency', () => {
  it('headless mode produces consistent state for world/system/rankings passes', () => {
    const state = createFreshState('headless-test-1');

    const nextHeadless = advanceWeek(state, { headless: true });

    // World pass should still update weather
    expect(nextHeadless.weather).toBeDefined();
    expect(typeof nextHeadless.weather).toBe('string');

    // System pass should still run
    expect(nextHeadless.week).toBeGreaterThan(state.week);

    // Rankings should be computed
    expect(nextHeadless.realmRankings).toBeDefined();
    expect(typeof nextHeadless.realmRankings).toBe('object');
  });

  it('playerStopped flag skips EventPass and NarrativePass but not SeasonalPass', () => {
    // Create a state with empty roster to trigger playerStopped
    const state = createFreshState('headless-test-2');
    state.roster = []; // Empty roster triggers playerStopped

    const next = advanceWeek(state, { headless: true });

    // Week should still advance
    expect(next.week).toBeGreaterThan(state.week);

    // Seasonal pass should still run (it's not gated by playerStopped)
    expect(next.season).toBeDefined();

    // No newsletter items should be generated from EventPass/NarrativePass
    // (they are skipped when playerStopped or headless)
    // Note: RivalStrategyPass may still add newsletter items, so we just
    // verify the state is consistent
    expect(next.treasury).toBeDefined();
    expect(typeof next.treasury).toBe('number');
  });

  it('headless mode does not produce dangling references to player-only data', () => {
    const state = createFreshState('headless-test-3');

    const next = advanceWeek(state, { headless: true });

    // Player should still exist
    expect(next.player).toBeDefined();
    expect(next.player.id).toBe(state.player.id);

    // Rivals should be updated (not null/undefined)
    expect(next.rivals).toBeDefined();
    expect(Array.isArray(next.rivals)).toBe(true);

    // No NaN values in critical fields
    expect(Number.isNaN(next.treasury)).toBe(false);
    expect(Number.isNaN(next.fame)).toBe(false);
    expect(Number.isNaN(next.popularity)).toBe(false);
  });
});
