import { describe, it, expect, vi, afterEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createEnginePool, type ShardWorkerApi } from '@/engine/pool/enginePool';
import { runRivalShardChunk } from '@/engine/pipeline/passes/rivalStableShard';
import { runBoutShardChunk } from '@/engine/pool/enginePool';
import { engineEventBus, type EngineEvent } from '@/engine/core/EventBus';
import { setMockIdGenerator } from '@/utils/idUtils';
import { createHash } from 'crypto';
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

/**
 * In-process shard worker: runs the real chunk functions on structured
 * clones, exactly reproducing the postMessage serialization boundary —
 * shared references are broken and non-serializable payloads would throw.
 */
function fakeShardWorker(): ShardWorkerApi {
  return {
    runRivalShardChunk: async (inputs, ctx) =>
      runRivalShardChunk(structuredClone(inputs), structuredClone(ctx)),
    runBoutShardChunk: async (inputs, ctx) =>
      runBoutShardChunk(structuredClone(inputs), structuredClone(ctx)),
  };
}

function stateHash(state: GameState): string {
  const { warriorMap: _wm, warriorToStableMap: _ws, rivalMap: _rm, rivalryMap: _rv,
    grudgeMap: _gm, warriorToOfferIds: _wo, cachedMetaDrift: _md,
    lastWeekBoutDisplay: _bd, ...serializable } = state as unknown as Record<string, unknown>;
  return createHash('sha256')
    .update(
      JSON.stringify(serializable, (_k, v) =>
        v instanceof Map ? { __map: [...v.entries()] } : v instanceof Set ? [...v] : v
      )
    )
    .digest('hex');
}

describe('parallel determinism (shard pool)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    engineEventBus.clear();
  });

  it('pool sizes 1 vs 4 produce identical state over 8 weeks', async () => {
    const FIXED_ISO = '2026-04-11T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    const seedWorld = () => populateInitialWorld(createFreshState('par-det'), 31415);

    let seqState = seedWorld();
    let parState = structuredClone(seqState);
    const pool = createEnginePool(4, { spawnShardWorker: fakeShardWorker });

    const seqEvents: EngineEvent[] = [];
    const parEvents: EngineEvent[] = [];

    for (let w = 0; w < 8; w++) {
      let n = 0;
      setMockIdGenerator(() => `id_${++n}`);
      engineEventBus.clear();
      const unsubSeq = engineEventBus.subscribe((e) => seqEvents.push(e));
      seqState = await advanceWeek(seqState, { headless: false, mutableInput: true });
      unsubSeq();

      n = 0;
      setMockIdGenerator(() => `id_${++n}`);
      engineEventBus.clear();
      const unsubPar = engineEventBus.subscribe((e) => parEvents.push(e));
      parState = await advanceWeek(parState, {
        headless: false,
        mutableInput: true,
        pool,
      });
      unsubPar();
    }

    expect(stateHash(parState)).toBe(stateHash(seqState));
    // Event streams: distributed emissions are collected per-chunk and
    // re-emitted by the coordinator — same types in the same pairing order.
    expect(parEvents.map((e) => e.type)).toEqual(seqEvents.map((e) => e.type));
  }, 120000);
});
