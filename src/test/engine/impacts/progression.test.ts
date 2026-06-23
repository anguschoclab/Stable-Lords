import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { resolveImpacts } from '@/engine/impacts';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import type { ProgressionState } from '@/types/state.types';

describe('Progression impact handler', () => {
  it('replaces state.progression', () => {
    const state = createFreshState('test-seed');
    const newProgression: ProgressionState = {
      ...DEFAULT_PROGRESSION,
      stableStanding: 5,
      totalStables: 11,
    };

    const result = resolveImpacts(state, [{ progression: newProgression }]);

    expect(result.progression.stableStanding).toBe(5);
    expect(result.progression.totalStables).toBe(11);
  });

  it('MERGE_CONFIG replace strategy uses last impact', () => {
    const state = createFreshState('test-seed');
    const first: ProgressionState = { ...DEFAULT_PROGRESSION, stableStanding: 3 };
    const second: ProgressionState = { ...DEFAULT_PROGRESSION, stableStanding: 7 };

    const result = resolveImpacts(state, [
      { progression: first },
      { progression: second },
    ]);

    expect(result.progression.stableStanding).toBe(7);
  });

  it('progression handler is registered in impactHandlers', () => {
    const state = createFreshState('test-seed');
    const custom: ProgressionState = {
      ...DEFAULT_PROGRESSION,
      status: 'won',
      wonYear: 5,
      wonWeek: 52,
    };

    const result = resolveImpacts(state, [{ progression: custom }]);

    expect(result.progression.status).toBe('won');
    expect(result.progression.wonYear).toBe(5);
  });
});
