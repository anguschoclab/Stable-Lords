import { describe, it, expect, vi } from 'vitest';
import { buildWeekOffers } from '@/engine/pipeline/passes/RivalStrategyPass/offers';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeRival, makeWarrior } from '@/test/_fixtures/factories';
import { SeededRNG } from '@/utils/random';
import { rollWeather } from '@/engine/weather/seasonalWeather';
import { computeNextSeason } from '@/engine/pipeline/passes/WorldPass';
import { generateBoutBids } from '@/engine/ai/workers/competitionWorker/boutBidding';

vi.mock('@/engine/ai/workers/competitionWorker/boutBidding', async (importActual) => ({
  ...(await importActual<typeof import('@/engine/ai/workers/competitionWorker/boutBidding')>()),
  generateBoutBids: vi.fn(() => ({ bids: [] })),
}));

/**
 * V16-A11: bid priority must use the bout-resolution week's weather, not the
 * current week's `state.weather`. WorldPass rolls next week's weather via
 * `rollWeather(resolveRng(rng, nextWeek*13), computeNextSeason(nextWeek))` —
 * offers.ts must derive the same bout-week weather instead of reading the
 * stale current-week field.
 */
describe('V16-A11: bout bids are priced for the bout-resolution week weather', () => {
  function stateAt(week: number) {
    const state = createFreshState('seed-a11');
    state.week = week;
    state.absoluteWeek = week;
    state.year = 1;
    state.season = 'Spring';
    state.weather = 'Chaos Storm'; // deliberately pathological current week
    state.roster = [];
    state.rivals = [
      makeRival({
        roster: Array.from({ length: 5 }, () => makeWarrior()),
      }),
    ];
    return state;
  }

  it('generateBoutBids is invoked with next-week weather, not state.weather', () => {
    const state = stateAt(10);
    buildWeekOffers(state, state.rivals, new SeededRNG(1));

    expect(generateBoutBids).toHaveBeenCalled();
    const weatherArg = vi.mocked(generateBoutBids).mock.calls[0]?.[0]?.weather;
    // Next-week weather derived on an independent seeded stream — the same
    // derivation WorldPass uses, decoupled from the shared rng chain.
    const expected = rollWeather(new SeededRNG(11 * 13), computeNextSeason(11));
    expect(weatherArg).toBe(expected);
  });
});
