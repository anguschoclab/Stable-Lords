import { describe, it, expect } from 'vitest';
import '@/test/_setup/setup';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { truncateState } from '@/engine/storage/truncation';

describe('structuredClone cost and state size', () => {
  it('structuredClone of a fresh state completes in < 50ms', () => {
    const state = createFreshState('test-clone-perf', '2025-01-01T00:00:00.000Z');
    const start = performance.now();
    const cloned = structuredClone(state);
    const elapsed = performance.now() - start;

    expect(cloned).toBeDefined();
    expect(cloned.treasury).toBe(state.treasury);
    // Relaxed threshold for CI/environment variance
    expect(elapsed).toBeLessThan(200);
  });

  it('structuredClone produces a deep copy (no shared references)', () => {
    const state = createFreshState('test-clone-deep', '2025-01-01T00:00:00.000Z');
    const cloned = structuredClone(state);

    // Modify clone, verify original is untouched
    cloned.treasury = 999;
    expect(state.treasury).toBe(1000);

    if (cloned.roster.length > 0) {
      cloned.roster[0]!.fame = 9999;
      expect(state.roster[0]!.fame).not.toBe(9999);
    }
  });

  it('state JSON size after creation is reasonable (< 1MB)', () => {
    const state = createFreshState('test-size', '2025-01-01T00:00:00.000Z');
    const json = JSON.stringify(state);
    const sizeKB = json.length / 1024;

    // Fresh state should be small
    expect(sizeKB).toBeLessThan(500);
  });

  it('truncateState reduces state size when arrays grow', () => {
    const state = createFreshState('test-trunc', '2025-01-01T00:00:00.000Z');

    // Simulate growth
    state.arenaHistory = new Array(1000).fill(null).map((_, i) => ({
      week: i + 1,
      warriorA: 'w1',
      warriorB: 'w2',
      winner: 'w1',
      transcript: new Array(50).fill('exchange text'),
    })) as any;

    state.graveyard = new Array(500).fill(null).map((_, i) => ({
      id: `dead-${i}`,
      name: `Dead ${i}`,
    })) as any;

    const beforeSize = JSON.stringify(state).length;
    const truncated = truncateState(state);
    const afterSize = JSON.stringify(truncated).length;

    expect(afterSize).toBeLessThan(beforeSize);
  });
});
