import { describe, it, expect, vi, afterEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { validateStateInvariants } from '@/engine/validate/stateInvariants';
import { createEnginePool } from '@/engine/pool/enginePool';
import { fakeShardWorker } from '@/test/_fixtures/fakeShardWorker';
import { engineEventBus } from '@/engine/core/EventBus';
import { setMockIdGenerator } from '@/utils/idUtils';
import type { GameState } from '@/types/state.types';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));


const validate = (state: GameState, week: number) => {
  const violations = validateStateInvariants(state);
  expect(
    violations,
    `week ${week} invariant violations: ${violations.map((v) => `${v.id}: ${v.message}`).join('; ')}`
  ).toEqual([]);
};

describe('state invariants (slow)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    engineEventBus.clear();
    setMockIdGenerator(null);
  });

  it('holds over 13 sequential weeks', async () => {
    let state = populateInitialWorld(createFreshState('inv-seq'), 31415);
    for (let w = 0; w < 13; w++) {
      setMockIdGenerator((() => {
        let n = 0;
        return () => `id_${++n}`;
      })());
      state = await advanceWeek(state, { headless: true, mutableInput: true });
      validate(state, w + 1);
    }
  }, 120000);

  it('holds over 13 shard-parallel weeks', async () => {
    const pool = createEnginePool(4, { spawnShardWorker: fakeShardWorker });
    let state = populateInitialWorld(createFreshState('inv-par'), 31415);
    for (let w = 0; w < 13; w++) {
      setMockIdGenerator((() => {
        let n = 0;
        return () => `id_${++n}`;
      })());
      state = await advanceWeek(state, { headless: true, mutableInput: true, pool });
      validate(state, w + 1);
    }
    pool.terminate();
  }, 120000);
});
