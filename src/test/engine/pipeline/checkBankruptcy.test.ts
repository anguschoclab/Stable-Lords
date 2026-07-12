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

  it('large positive then large negative — net below threshold', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = [
      { treasuryDelta: 10000 },
      { treasuryDelta: -10000 },
      { treasuryDelta: -600 },
    ];
    // 0 + 10000 + (-10000) + (-600) = -600 < -500 → true
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });

  it('exact threshold boundary — -500 is not strictly < -500', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = [{ treasuryDelta: -500 }];
    // 0 + (-500) = -500, not strictly < -500 → false
    expect(checkBankruptcy(state, impacts)).toBe(false);
  });

  it('all undefined deltas with treasury already below threshold', () => {
    const state = makeState(-600);
    const impacts: StateImpact[] = [{}, {}, {}];
    // -600 + 0 + 0 + 0 = -600 < -500 → true
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });

  it('zero delta with treasury already below threshold', () => {
    const state = makeState(-600);
    const impacts: StateImpact[] = [{ treasuryDelta: 0 }];
    // -600 + 0 = -600 < -500 → true
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });

  it('50 impacts of -10 each — sum exactly -500, not strictly < -500', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = Array.from({ length: 50 }, () => ({ treasuryDelta: -10 }));
    // 0 + 50 * (-10) = -500, not strictly < -500 → false
    expect(checkBankruptcy(state, impacts)).toBe(false);
  });

  it('51 impacts of -10 each — sum -510 < -500', () => {
    const state = makeState(0);
    const impacts: StateImpact[] = Array.from({ length: 51 }, () => ({ treasuryDelta: -10 }));
    // 0 + 51 * (-10) = -510 < -500 → true
    expect(checkBankruptcy(state, impacts)).toBe(true);
  });
});
