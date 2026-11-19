import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { GameState } from '@/types/game';
import * as stages from '@/engine/pipeline/services/weekPipeline/stages';
import * as finalize from '@/engine/pipeline/services/weekPipeline/finalize';

vi.mock('@/engine/pipeline/services/weekPipeline/stages', () => ({
  runBoutPhase: vi.fn().mockImplementation(async (state) => state),
  collectCoreImpacts: vi.fn().mockResolvedValue([]),
  runStage: vi.fn().mockImplementation(async (_stage, state) => state),
}));

vi.mock('@/engine/pipeline/services/weekPipeline/finalize', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    checkBankruptcy: vi.fn().mockReturnValue(false),
    finalizeState: vi.fn().mockImplementation((state) => state),
  };
});

describe('weekPipelineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('advanceWeek', () => {
    it('executes the pipeline and returns updated state', async () => {
      const mockState = {
        player: { id: 'p' },
        roster: [{ id: 'w1' }],
        rivals: [],
        meta: {}
      } as unknown as GameState;

      const result = await advanceWeek(mockState);
      expect(result).toBeDefined();
      expect(stages.runBoutPhase).toHaveBeenCalled();
      expect(stages.collectCoreImpacts).toHaveBeenCalled();
      expect(stages.runStage).toHaveBeenCalledTimes(2);
      // The first argument is the stage ('world', 'content').
      // The rest of the arguments shouldn't be strictly mocked as they contain mutated objects.
      expect((stages.runStage as any).mock.calls[0][0]).toBe('world');
      expect((stages.runStage as any).mock.calls[1][0]).toBe('content');
      expect(finalize.finalizeState).toHaveBeenCalled();
    });
  });
});
