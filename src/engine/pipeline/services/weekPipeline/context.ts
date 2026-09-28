import type { GameState } from '@/types/state.types';
import { SeededRNGService } from '@/utils/random';
import type { WeekPipelineContext } from '@/engine/pipeline/pipelineStages';
import { telemetry, TelemetryEvents, isTelemetryEnabled } from '@/engine/core/telemetry';

/** Pipeline context threaded through every pass — extends the shared
 * WeekPipelineContext with the headless flag and shard pool. */
export interface WeekContext extends WeekPipelineContext {
  headless?: boolean;
}

/** Computes next week/year (52-week rollover) and seeds the week RNG. */
export function prepareWeekContext(state: GameState, headless?: boolean): WeekContext {
  const currentWeek = state.week;
  let nextWeek = currentWeek + 1;
  let nextYear = state.year || 1;
  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear++;
  }
  return {
    currentWeek,
    nextWeek,
    nextYear,
    headless,
    rootRng: new SeededRNGService(nextYear * 52 + nextWeek * 7919 + 101),
  };
}

/**
 * Per-week lookup caches live on the state object but are NOT serializable
 * (Maps) — strip them before cloning so the worker path never pays to clone
 * maps that get rebuilt anyway.
 */
export function stripWeekCaches(state: GameState): GameState {
  const {
    warriorMap: _wm,
    cachedMetaDrift: _cmd,
    warriorToStableMap: _wts,
    rivalMap: _rm,
    rivalryMap: _rvm,
    grudgeMap: _gm,
    warriorToOfferIds: _wto,
    ...rest
  } = state;
  return rest as GameState;
}

/**
 * Creates a mutable copy of the game state for the week pipeline.
 * Uses structuredClone for deep cloning, allowing passes to mutate freely —
 * unless the caller grants ownership via `mutableInput`.
 */
export function createMutableWeekContext(state: GameState, mutableInput?: boolean): GameState {
  if (mutableInput) return stripWeekCaches(state);
  const stripped = stripWeekCaches(state);
  if (isTelemetryEnabled()) {
    const t0 = performance.now();
    const cloned = structuredClone(stripped);
    telemetry.timing(TelemetryEvents.SERIALIZATION_CLONE_MS, performance.now() - t0);
    return cloned;
  }
  return structuredClone(stripped);
}
