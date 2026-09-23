import { describe, it, expect, vi, afterEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { validateStateInvariants } from '@/engine/validate/stateInvariants';
import { createEnginePool, type ShardWorkerApi } from '@/engine/pool/enginePool';
import { runRivalShardChunk } from '@/engine/pipeline/passes/rivalStableShard';
import { runBoutShardChunk } from '@/engine/pool/enginePool';
import { engineEventBus } from '@/engine/core/EventBus';
import { setMockIdGenerator } from '@/utils/idUtils';
import type { GameState } from '@/types/state.types';

vi.mock('@/engine/storage/opfsArchive', () => {
  const m = {
    archiveBoutLog: vi.fn().mockResolvedValue(undefined),
    retrieveBoutLog: vi.fn().mockResolvedValue(null),
    archiveGazette: vi.fn().mockResolvedValue(undefined),
    retrieveGazette: vi.fn().mockResolvedValue(null),
    archiveHotState: vi.fn().mockResolvedValue(undefined),
    retrieveHotState: vi.fn().mockResolvedValue(null),
    getArchivedBoutIdsForSeason: vi.fn().mockResolvedValue([]),
  };
  return {
    OPFSArchiveService: class {
      isSupported = () => true;
      archiveBoutLog = m.archiveBoutLog;
      retrieveBoutLog = m.retrieveBoutLog;
      archiveGazette = m.archiveGazette;
      retrieveGazette = m.retrieveGazette;
      archiveHotState = m.archiveHotState;
      retrieveHotState = m.retrieveHotState;
      getArchivedBoutIdsForSeason = m.getArchivedBoutIdsForSeason;
    },
    opfsArchive: m,
    ArchiveConflictError: class extends Error {},
    assertSafeFileNamePart: vi.fn(),
  };
});

function fakeShardWorker(): ShardWorkerApi {
  return {
    runRivalShardChunk: async (inputs, ctx) =>
      runRivalShardChunk(structuredClone(inputs), structuredClone(ctx)),
    runBoutShardChunk: async (inputs, ctx) =>
      runBoutShardChunk(structuredClone(inputs), structuredClone(ctx)),
  };
}

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
