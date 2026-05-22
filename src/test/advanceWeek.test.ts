/**
 * advanceWeek pipeline tests — verifies orchestration of the weekly pipeline
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import * as Training from '@/engine/training';
import * as Economy from '@/engine/economy';
import * as Aging from '@/engine/aging';
import * as Health from '@/engine/health';
import * as Impacts from '@/engine/impacts';
import * as Recruitment from '@/engine/recruitment';
import * as Gazette from '@/engine/gazette/gazetteNarrative';

describe('advanceWeek pipeline orchestration', () => {
  beforeEach(() => {
    // Use scoped mocks instead of hoisted mocks to prevent module cache pollution
    vi.spyOn(Training, 'computeTrainingImpact').mockReturnValue({
      updatedRoster: [],
      updatedSeasonalGrowth: [],
      results: [],
    });
    vi.spyOn(Training, 'trainingImpactToStateImpact').mockReturnValue({
      impact: {},
      seasonalGrowth: [],
      results: [],
    });
    vi.spyOn(Economy, 'computeEconomyImpact').mockReturnValue({});
    vi.spyOn(Aging, 'computeAgingImpact').mockReturnValue({});
    vi.spyOn(Health, 'computeHealthImpact').mockReturnValue({});
    vi.spyOn(Health, 'applyHealthUpdates').mockImplementation((state) => state);
    vi.spyOn(Impacts, 'resolveImpacts').mockImplementation((state) => ({ ...state }));
    vi.spyOn(Impacts, 'mergeImpacts').mockImplementation((impacts) => impacts);
    vi.spyOn(Recruitment, 'partialRefreshPool').mockImplementation((pool) => pool);
    vi.spyOn(Recruitment, 'aiDraftFromPool').mockReturnValue({
      updatedPool: [],
      updatedRivals: [],
      gazetteItems: [],
    });
    vi.spyOn(Gazette, 'generateWeeklyGazette').mockReturnValue({
      title: 'Test',
      regions: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls all impact computation functions', () => {
    const state = createFreshState('test-seed-week');
    advanceWeek(state);

    expect(Training.computeTrainingImpact).toHaveBeenCalled();
    expect(Economy.computeEconomyImpact).toHaveBeenCalled();
    expect(Aging.computeAgingImpact).toHaveBeenCalled();
    expect(Health.computeHealthImpact).toHaveBeenCalled();
  });

  it('resolves collected impacts using resolveImpacts', () => {
    const state = createFreshState('test-seed-week');
    advanceWeek(state);

    expect(Impacts.resolveImpacts).toHaveBeenCalled();
  });

  it('advances the week counter and returns a new state', () => {
    const state = createFreshState('test-seed');
    const originalWeek = state.week;

    // We mock resolveImpacts to return the state it received
    (Impacts.resolveImpacts as any).mockImplementation((s: any) => ({ ...s }));

    const next = advanceWeek(state);

    expect(next.week).toBe(originalWeek + 1);
    expect(next).not.toBe(state);
  });
});
