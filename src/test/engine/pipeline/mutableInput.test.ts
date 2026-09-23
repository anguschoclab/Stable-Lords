import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';

/**
 * mutableInput ownership contract:
 *  - default: advanceWeek clones its input; the caller's state is untouched.
 *  - mutableInput: true: the caller grants ownership — the input may be
 *    mutated in place and must not be reused. Callers that still need the
 *    input (store commit paths, save games) must NOT pass it.
 */
describe('advanceWeek mutableInput contract', () => {
  it('default path leaves the input state untouched (deep equality)', async () => {
    const state = populateInitialWorld(createFreshState('mutable-input'), 777);
    const snapshot = structuredClone(state);

    const next = await advanceWeek(state, { headless: true });

    expect(next.week).toBe(state.week + 1);
    // Serializable fields are unchanged — the pipeline worked on a clone.
    expect(state).toEqual(snapshot);
    // And it is a different object, not the input returned.
    expect(next).not.toBe(state);
  });

  it('mutableInput path advances the week without cloning (input may be mutated)', async () => {
    const state = populateInitialWorld(createFreshState('mutable-input'), 777);

    const next = await advanceWeek(state, { headless: true, mutableInput: true });

    expect(next.week).toBe(2);
  });
});
