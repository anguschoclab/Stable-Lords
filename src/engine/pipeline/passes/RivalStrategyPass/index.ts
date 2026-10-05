import { GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import {
  buildSuccessorIndex,
  runRivalShardChunk,
  type RivalShardContext,
  type RivalShardOutput,
} from '../rivalStableShard';
import type { EnginePool } from '@/engine/pool/enginePool';
import { finishRivalPass } from './finish';

// Re-exported for existing importers (tests, docs).
export { buildSuccessorIndex, handleOwnerLifecycle } from '../rivalStableShard';

/**
 * Stable Lords — Rival Strategy Pipeline Pass
 *
 * The per-rival stage-1 loop runs through `rivalStableShard.processRivalStable`
 * — in-line by default, or distributed across the engine pool's shard workers
 * when `pool.size > 1`. Shard output is order-preserving, so both paths merge
 * identically.
 */
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService,
  headless?: boolean
): StateImpact;
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng: IRNGService | undefined,
  headless: boolean | undefined,
  pool: EnginePool | undefined
): StateImpact | Promise<StateImpact>;
export function runRivalStrategyPass(
  state: GameState,
  nextWeek: number,
  rootRng?: IRNGService,
  headless?: boolean,
  pool?: EnginePool
): StateImpact | Promise<StateImpact> {
  const rng = resolveRng(rootRng, state.absoluteWeek * 7919 + 13);

  // 0. Build successor index: maps stableId → first famous retired warrior (fame > 200)
  const successorByStable = buildSuccessorIndex(state.retired);

  // 0.5 Shared perception — built once per tick, consumed by every rival's
  // agent context so per-rival memory work never re-scans the world (B.1).
  const perception = buildPerceptionSnapshot(state);

  const shardCtx: RivalShardContext = { state, perception, successorByStable, nextWeek };
  const inputs = (state.rivals || []).map((rival, index) => ({ rival, index }));
  const finish = (shardOutputs: RivalShardOutput[]) =>
    finishRivalPass(shardOutputs, state, nextWeek, rng, headless);

  // In-line by default; distributed across shard workers when a pool is
  // configured. Both paths run the same processRivalStable shard function
  // and merge in declaration order — output is identical by construction.
  return pool && pool.size > 1
    ? pool.mapRivalShards(inputs, shardCtx).then(finish)
    : finish(runRivalShardChunk(inputs, shardCtx));
}
