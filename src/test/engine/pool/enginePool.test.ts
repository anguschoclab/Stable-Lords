import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEnginePool,
  configureEnginePool,
  getEnginePool,
  shutdownEnginePool,
  runBoutShardChunk,
  type ShardWorkerApi,
  type BoutShardInput,
  type BoutShardContext,
} from '@/engine/pool/enginePool';
import {
  runRivalShardChunk,
  buildSuccessorIndex,
  type RivalShardContext,
  type RivalShardInput,
} from '@/engine/pipeline/passes/rivalStableShard';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { getMoodModifiers } from '@/engine/crowdMood';
import { buildActiveWarriorMap } from '@/utils/roster';
import type { RivalStableData, GameState } from '@/types/state.types';

/**
 * A shard worker that runs the REAL chunk functions on structured clones —
 * faithful stand-in for the postMessage boundary: shared references are
 * broken and only serializable data crosses, exactly like a real Worker.
 */
function fakeShardWorker(): ShardWorkerApi {
  return {
    runRivalShardChunk: async (inputs, ctx) =>
      runRivalShardChunk(structuredClone(inputs), structuredClone(ctx)),
    runBoutShardChunk: async (inputs, ctx) =>
      runBoutShardChunk(structuredClone(inputs), structuredClone(ctx)),
  };
}

function seededWorld(seed = 4242): GameState {
  return populateInitialWorld(createFreshState(`pool-test-${seed}`), seed);
}

function rivalInputs(state: GameState): RivalShardInput[] {
  return (state.rivals ?? []).map((rival, index) => ({ rival, index }));
}

function rivalShardCtx(state: GameState): RivalShardContext {
  return {
    state,
    perception: buildPerceptionSnapshot(state),
    successorByStable: buildSuccessorIndex(state.retired),
    nextWeek: state.week + 1,
  };
}

describe('createEnginePool — in-line fallback', () => {
  it('size 1 runs shards in-line with identical output to direct execution', async () => {
    const state = seededWorld();
    const ctx = rivalShardCtx(state);
    const inputs = rivalInputs(state);
    expect(inputs.length).toBeGreaterThan(0);

    const expected = runRivalShardChunk(structuredClone(inputs), structuredClone(ctx));
    const pool = createEnginePool(1);
    const actual = await pool.mapRivalShards(inputs, ctx);

    expect(pool.size).toBe(1);
    expect(actual).toEqual(expected);
  });
});

describe('createEnginePool — distributed path', () => {
  it('order-preserving merge: pool(size 4) output is identical to sequential chunk output', async () => {
    const state = seededWorld(777);
    const ctx = rivalShardCtx(state);
    const inputs = rivalInputs(state);
    expect(inputs.length).toBeGreaterThan(3); // ensure multiple chunks

    const expected = runRivalShardChunk(structuredClone(inputs), structuredClone(ctx));
    const pool = createEnginePool(4, { spawnShardWorker: fakeShardWorker });
    const actual = await pool.mapRivalShards(inputs, ctx);

    expect(actual.length).toBe(inputs.length);
    expect(actual).toEqual(expected);
  });

  it('spawns at most `size` workers and reuses them across calls', async () => {
    const spawn = vi.fn(fakeShardWorker);
    const pool = createEnginePool(3, { spawnShardWorker: spawn });
    const state = seededWorld(99);
    const ctx = rivalShardCtx(state);
    const inputs = rivalInputs(state);
    expect(inputs.length).toBeGreaterThan(1);

    await pool.mapRivalShards(inputs, ctx);
    const afterFirst = spawn.mock.calls.length;
    expect(afterFirst).toBeGreaterThan(0);
    expect(afterFirst).toBeLessThanOrEqual(3);

    await pool.mapRivalShards(inputs, ctx);
    expect(spawn.mock.calls.length).toBe(afterFirst); // reused, not respawned
  });

  it('terminate() drops workers and falls back to in-line execution', async () => {
    const spawn = vi.fn(fakeShardWorker);
    const pool = createEnginePool(4, { spawnShardWorker: spawn });
    const state = seededWorld(7);
    const ctx = rivalShardCtx(state);
    const inputs = rivalInputs(state);

    await pool.mapRivalShards(inputs, ctx);
    expect(spawn.mock.calls.length).toBeGreaterThan(0);

    pool.terminate();
    const callsAtTerminate = spawn.mock.calls.length;
    const out = await pool.mapRivalShards(inputs, ctx);
    expect(spawn.mock.calls.length).toBe(callsAtTerminate); // no new workers
    expect(out).toEqual(runRivalShardChunk(structuredClone(inputs), structuredClone(ctx)));
  });
});

describe('bout shard chunking', () => {
  it('runBoutShardChunk output order matches input order', () => {
    const state = seededWorld(5);
    // Fabricate pairings from rival rosters — bout validity is resolveBout's
    // concern; ordering is what this test asserts.
    const warriors = (state.rivals as RivalStableData[]).flatMap((r) => r.roster);
    expect(warriors.length).toBeGreaterThanOrEqual(2);
    const inputs: BoutShardInput[] = [];
    for (let i = 0; i + 1 < warriors.length && inputs.length < 6; i += 2) {
      const a = warriors[i];
      const d = warriors[i + 1];
      if (a && d) inputs.push({ pairing: { a, d, isRivalry: false } });
    }
    const ctx: BoutShardContext = {
      state,
      warriorMap: (state.warriorMap ??
        buildActiveWarriorMap(state)) as BoutShardContext['warriorMap'],
      moodMods: getMoodModifiers(state.crowdMood),
      headless: true,
    };
    const outputs = runBoutShardChunk(inputs, ctx);
    expect(outputs.length).toBe(inputs.length);
    outputs.forEach((o, i) => {
      const input = inputs[i];
      expect(input).toBeDefined();
      if (!input) return;
      expect(o.bout.result.a.id).toBe(input.pairing.a.id);
      expect(o.bout.result.d.id).toBe(input.pairing.d.id);
    });
  });
});

describe('shared pool registry', () => {
  beforeEach(() => {
    shutdownEnginePool();
    configureEnginePool(1);
  });

  it('defaults to size 1 (in-line) and is lazy', () => {
    const pool = getEnginePool();
    expect(pool.size).toBe(1);
  });

  it('configureEnginePool + shutdown resets the shared instance', () => {
    const a = getEnginePool();
    configureEnginePool(2);
    shutdownEnginePool();
    const b = getEnginePool();
    expect(a).not.toBe(b);
  });
});
