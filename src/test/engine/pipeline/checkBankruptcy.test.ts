import { describe, it, expect } from 'vitest';
import { checkBankruptcy } from '@/engine/pipeline/services/weekPipelineService';
import type { GameState } from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts';

function makeState(treasury: number): GameState {
  return { treasury } as GameState;
}

describe('checkBankruptcy', () => {
  it('returns false when single treasuryDelta keeps treasury above threshold', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = [{ treasuryDelta: -300 }];
    expect(checkBankruptcy(state, impacts)).toBe(false);
  });

  it('returns true when single treasuryDelta pushes treasury below threshold', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = [{ treasuryDelta: -600 }];
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });

  it('returns false when no impacts have treasuryDelta', () => {
    const state = makeState(100);
    const impacts: StateImpact[] = [{}, {}, {}];
    expect(checkBankruptcy(state, impacts)).toBe(false);
  });

  it('sums multiple treasuryDeltas — returns true when combined drops below threshold', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = [
      { treasuryDelta: -200 },
      { treasuryDelta: -400 },
    ];
    // 0 + (-200) + (-400) = -600 < -500 → true
    // Old .find() would only see first -200, giving -200 → false (bug)
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });

  it('sums mixed positive and negative treasuryDeltas', () => {
    const state = makeState(100);
    const impacts: StateImpact[] = [
      { treasuryDelta: 100 },
      { treasuryDelta: -700 },
    ];
    // 100 + 100 + (-700) = -500, not strictly < -500 → false
    expect(checkBankruptcy(state, impacts)).toBe(false);
  });

  it('returns false when impacts array is empty', () => {
    const state = makeState(-400);
    const impacts: StateImpact[] = [];
    // -400 + 0 = -400 >= -500 → false
    expect(checkBankruptcy(state, impacts)).toBe(false);
  });

  it('returns true when treasury is already below threshold with no deltas', () => {
    const state = makeState(-600);
    const impacts: StateImpact[] = [];
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });

  it('handles undefined treasuryDelta fields in impacts', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = [
      { fameDelta: 10 },
      { treasuryDelta: -550 },
      { rosterUpdates: new Map() },
    ];
    // 0 + 0 + (-550) + 0 = -550 < -500 → true
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });
});
