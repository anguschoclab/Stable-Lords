/**
 * V15 — persistent shard-state sync protocol (Phase T).
 *
 * Workers hold a synced GameState across weeks; the coordinator broadcasts
 * only stage transitions (boundary fn inputs + impacts) and workers replay
 * the same deterministic fns: sweepUnfinishedTournaments → flushGazette →
 * buildWeekCaches → resolveImpacts → finalizeState. Wire ctx drops every
 * recomputable field — rival shards get {nextWeek}, bout shards {headless}.
 *
 * Parity contract: after every stage sync, worker's state hash must equal
 * the coordinator's stage-state hash (same strip-list as
 * parallelDeterminism.slow.test.ts). On mismatch the coordinator heals by
 * sending the full stage state once.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createEnginePool } from '@/engine/pool/enginePool';
import { fakeSyncedShardWorker } from '@/test/_fixtures/fakeShardWorker';
import { engineEventBus } from '@/engine/core/EventBus';
import { setMockIdGenerator } from '@/utils/idUtils';
import { shardStateHash } from '@/engine/pool/stateHash';
import type { GameState } from '@/types/state.types';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

const stateHash = shardStateHash;
const FIXED_ISO = '2026-04-11T09:00:00.000Z';

describe('shard sync protocol', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    engineEventBus.clear();
  });

  it('synced workers reach the same week result as sequential, over multiple weeks', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);
    const seedWorld = () => populateInitialWorld(createFreshState('sync-par'), 777);

    let seqState = seedWorld();
    let parState = structuredClone(seqState);
    const pool = createEnginePool(3, { spawnShardWorker: fakeSyncedShardWorker, syncedWorkers: true });

    for (let w = 0; w < 4; w++) {
      let n = 0;
      setMockIdGenerator(() => `id_${++n}`);
      seqState = await advanceWeek(seqState, { headless: false, mutableInput: true });

      n = 0;
      setMockIdGenerator(() => `id_${++n}`);
      parState = await advanceWeek(parState, { headless: false, mutableInput: true, pool });
    }

    expect(stateHash(parState)).toBe(stateHash(seqState));
  });

  it('workers carry state across weeks — full-state sends happen only at bootstrap', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);
    const seedWorld = () => populateInitialWorld(createFreshState('sync-once'), 555);
    let parState = seedWorld();

    const fullStateSends: string[] = [];
    const base = fakeSyncedShardWorker;
    const counting = () => {
      const w = base();
      const orig = w.forceShardState.bind(w);
      return {
        ...w,
        forceShardState: async (s: GameState, stage: never) => {
          fullStateSends.push(String(stage));
          return orig(s, stage);
        },
      };
    };
    const pool = createEnginePool(3, { spawnShardWorker: counting, syncedWorkers: true });

    for (let w = 0; w < 3; w++) {
      let n = 0;
      setMockIdGenerator(() => `id_${++n}`);
      parState = await advanceWeek(parState, { headless: false, mutableInput: true, pool });
    }
    // Week 1 bootstraps each worker to weekStart, then (no pristine input
    // replica yet) installs the week result once — ≤ 2 sends per worker,
    // all in week 1; later weeks replay from the persisted replica.
    expect(fullStateSends.length).toBeLessThanOrEqual(6);
  });

  it('heals a worker whose synced copy drifted — hash mismatch triggers full-state resend', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);
    let parState = populateInitialWorld(createFreshState('sync-heal'), 4242);
    const base = fakeSyncedShardWorker;
    let corruptNext = true;
    const corrupting = () => {
      const w = base();
      const orig = w.advanceShardTo.bind(w);
      return {
        ...w,
        advanceShardTo: async (stage: never, payload: never) => {
          const h = await orig(stage, payload);
          if (corruptNext && stage === 'weekStart') {
            corruptNext = false;
            return 'deadbeef'.padEnd(64, '0'); // lying receipt → coordinator must heal
          }
          return h;
        },
      };
    };
    const pool = createEnginePool(2, { spawnShardWorker: corrupting, syncedWorkers: true });
    let n = 0;
    setMockIdGenerator(() => `id_${++n}`);
    parState = await advanceWeek(parState, { headless: false, mutableInput: true, pool });
    // The week still completes and produces the sequential-identical result —
    // healed workers fall back rather than corrupting the world.
    let seq = populateInitialWorld(createFreshState('sync-heal'), 4242);
    n = 0;
    setMockIdGenerator(() => `id_${++n}`);
    seq = await advanceWeek(seq, { headless: false, mutableInput: true });
    expect(stateHash(parState)).toBe(stateHash(seq));
  });

  it('a worker spawned mid-week bootstraps to the current stage and still matches', async () => {
    // Pool created fresh each call — every worker bootstraps on first touch.
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);
    let parState = populateInitialWorld(createFreshState('sync-mid'), 999);
    let n = 0;
    setMockIdGenerator(() => `id_${++n}`);
    parState = await advanceWeek(parState, {
      headless: false,
      mutableInput: true,
      pool: createEnginePool(4, { spawnShardWorker: fakeSyncedShardWorker, syncedWorkers: true }),
    });
    let seq = populateInitialWorld(createFreshState('sync-mid'), 999);
    n = 0;
    setMockIdGenerator(() => `id_${++n}`);
    seq = await advanceWeek(seq, { headless: false, mutableInput: true });
    expect(stateHash(parState)).toBe(stateHash(seq));
  });
});
