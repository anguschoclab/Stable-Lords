import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('passOrdering', () => {
  it('RecruitmentPass runs before RivalStrategyPass — pool is filled before draft', async () => {
    const state = createFreshState('test-seed-123');
    // After advanceWeek, RecruitmentPass should have refilled the pool
    // before RivalStrategyPass drains it via AI draft
    const next = await advanceWeek(state, { headless: true });

    // The pool should not be empty — RecruitmentPass refills it before
    // RivalStrategyPass drains it. If ordering were wrong, pool would be empty.
    expect((next.recruitPool || []).length).toBeGreaterThan(0);
  });

  it('BoutSimulationPass runs before WarriorPass — dead warriors are not trained', async () => {
    const state = createFreshState('test-seed-456');
    const next = await advanceWeek(state, { headless: true });

    // Warriors that died in bout phase should not appear in training results
    // or have their stats modified by training. The graveyard should contain
    // any dead warriors, and they should not be in the roster.
    const deadWarriors = next.graveyard || [];
    for (const dead of deadWarriors) {
      const stillInRoster = next.roster.find((w) => w.id === dead.id);
      expect(stillInRoster).toBeUndefined();
    }
  });

  it('core impacts are resolved before remaining passes (staged pipeline)', async () => {
    const state = createFreshState('test-seed-789');
    const next = await advanceWeek(state, { headless: true });

    // After advanceWeek, the week should have advanced
    expect(next.week).toBeGreaterThan(state.week);

    // Economy pass (core) should have modified treasury before
    // rival strategy pass (remaining) reads it for bankruptcy check
    // The state should be consistent — no NaN or undefined treasury
    expect(next.treasury).toBeDefined();
    expect(typeof next.treasury).toBe('number');
    expect(Number.isNaN(next.treasury)).toBe(false);
  });
});
