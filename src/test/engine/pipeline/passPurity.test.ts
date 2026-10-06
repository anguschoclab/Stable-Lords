import { describe, it, expect } from 'vitest';
import { WEEK_PIPELINE_PASSES } from '@/engine/pipeline/services/weekPipelineService';
import { prepareWeekContext } from '@/engine/pipeline/services/weekPipeline/context';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { GameState } from '@/types/state.types';

/**
 * Stage semantics require passes to be pure producers of StateImpacts — every
 * pass in a stage reads the SAME snapshot and writes are merged afterwards.
 * A pass that mutates its input breaks that contract silently (its mutation
 * would be visible to later passes in the same stage, unlike declared writes).
 *
 * Detection: deep-freeze the snapshot. Module code is strict-mode, so any
 * assignment/addition on the frozen graph throws TypeError. Map fields can't
 * be frozen (Map.set still works), so those are asserted via size comparison.
 */
function deepFreeze(value: unknown, seen = new WeakSet<object>()): void {
  if (value === null || typeof value !== 'object') return;
  if (seen.has(value as object)) return;
  seen.add(value as object);
  if (value instanceof Map || value instanceof Set) return; // handled separately
  for (const key of Object.keys(value)) {
    deepFreeze((value as Record<string, unknown>)[key], seen);
  }
  Object.freeze(value);
}

function mapFieldsOf(state: GameState): [string, Map<unknown, unknown>][] {
  const out: [string, Map<unknown, unknown>][] = [];
  for (const [k, v] of Object.entries(state)) {
    if (v instanceof Map) out.push([k, v]);
  }
  return out;
}

describe('week pipeline pass purity', () => {
  for (const spec of WEEK_PIPELINE_PASSES) {
    it(`${spec.id} (${spec.stage}) does not mutate its input state`, async () => {
      const state = createFreshState('pass-purity');
      const ctx = prepareWeekContext(state, true);
      deepFreeze(state);
      const mapSizes = mapFieldsOf(state).map(([k, m]) => [k, m.size] as const);

      // Mutation on a frozen object throws TypeError — a pass mutating the
      // shared snapshot fails loudly here instead of corrupting the stage.
      const impact = await spec.run(state, ctx);
      expect(impact).toBeDefined();

      for (const [k, size] of mapSizes) {
        const map = (state as unknown as Record<string, Map<unknown, unknown>>)[k];
        expect(map?.size, `pass "${spec.id}" mutated Map field "${k}"`).toBe(size);
      }
    });
  }
});
