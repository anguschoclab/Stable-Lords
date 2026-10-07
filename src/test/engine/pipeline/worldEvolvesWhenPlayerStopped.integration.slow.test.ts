import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';
import type { GameState } from '@/types/state.types';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

function reset() {
  let n = 0;
  setMockIdGenerator(() => `id_${++n}`);
  engineEventBus.clear();
}

const totalRivalWarriors = (s: GameState) => s.rivals.reduce((acc, r) => acc + r.roster.length, 0);

describe('world evolves while the player is stopped', () => {
  beforeEach(reset, 120000);

  it('keeps running rival bouts after the player goes bankrupt', async () => {
    let state = populateInitialWorld(createFreshState('freeze-fix'), 777);
    state.treasury = -10000; // force the player permanently below BANKRUPTCY_THRESHOLD

    // advance one week so any in-flight offers settle, then measure the baseline
    state = await advanceWeek(state, { headless: true });
    const boutsAfterWarmup = state.arenaHistory.length;

    for (let i = 0; i < 8; i++) state = await advanceWeek(state, { headless: true });

    // Rival-vs-rival world bouts keep firing while the player is bankrupt,
    // so the bout count must grow.
    expect(state.treasury).toBeLessThan(0); // still in debt (emergency loans may lift above -500)
    expect(state.arenaHistory.length).toBeGreaterThan(boutsAfterWarmup);
  }, 120000);

  it('keeps rival rosters alive when the player roster is empty', async () => {
    let state = populateInitialWorld(createFreshState('empty-roster'), 778);
    state.roster = []; // player has no warriors

    for (let i = 0; i < 8; i++) state = await advanceWeek(state, { headless: true });

    // World keeps churning: rivals must still exist and have non-empty rosters.
    expect(state.rivals.length).toBeGreaterThan(0);
    expect(state.rivals.every((r) => r.roster.length > 0)).toBe(true);
    // Rival population should not have collapsed to nothing.
    expect(totalRivalWarriors(state)).toBeGreaterThan(0);
  }, 120000);
});
