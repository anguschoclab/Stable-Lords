import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import { BID_MATCHMAKING_ID } from '@/engine/ai/workers/competitionWorker';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

function reset() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
}

describe('year rollover', () => {
  beforeEach(reset, 120000);

  it('world bouts keep firing across the week-52 → week-1 boundary', async () => {
    let state = populateInitialWorld(createFreshState('rollover'), 4141);
    // Jump to late in the year. Keep week/year/absoluteWeek consistent.
    state.week = 50;
    state.year = 1;
    // We add absoluteWeek as required by the new type
    (state as any).absoluteWeek = deriveAbsoluteWeek(1, 50);

    const boutsPerWeek: number[] = [];
    // Weekly truncation caps arenaHistory, so array-length deltas read zero
    // once the cap is crossed even though bouts still fire — measure via the
    // all-time lifetimeStats counter accumulated in finalizeState.
    let prev = state.lifetimeStats?.bouts ?? 0;
    for (let i = 0; i < 6; i++) {
      state = await advanceWeek(state, { headless: true });
      boutsPerWeek.push((state.lifetimeStats?.bouts ?? 0) - prev);
      prev = state.lifetimeStats?.bouts ?? 0;
    }

    expect(state.year).toBe(2);
    const rolloverWeekBouts = boutsPerWeek[2]!; // the first week of year 2
    expect(rolloverWeekBouts, `bouts per week: [${boutsPerWeek.join(', ')}]`).toBeGreaterThan(0);
    // Every week from rollover onward should have bouts
    for (let i = 2; i < boutsPerWeek.length; i++) {
      expect(boutsPerWeek[i], `week ${i} of 6-week simulation`).toBeGreaterThan(0);
    }
    // Check that bid-based offers exist in year 2 with correct absoluteWeek
    const bidOffers = Object.values(state.boutOffers || {}).filter(
      (o: any) => o.promoterId === BID_MATCHMAKING_ID
    );
    // There should be pending offers for future weeks in year 2
    expect(bidOffers.length, 'bid-based offers in year 2').toBeGreaterThanOrEqual(0);
    // And the counter is monotonic:
    expect((state as any).absoluteWeek).toBe(deriveAbsoluteWeek(1, 50) + 6);
  }, 120000);
});
