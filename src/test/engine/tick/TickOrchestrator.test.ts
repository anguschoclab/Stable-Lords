import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TickOrchestrator } from '@/engine/tick/TickOrchestrator';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { TimeAdvanceService } from '@/engine/tick/TimeAdvanceService';

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: vi.fn(),
}));

vi.mock('@/engine/matchmaking/tournamentSelection', () => ({
  TournamentSelectionService: {
    resolveRound: vi.fn(),
  },
}));

vi.mock('@/engine/tick/TimeAdvanceService', () => ({
  TimeAdvanceService: {
    advanceQuarter: vi.fn(),
    skipToQuarterEnd: vi.fn(),
    advanceYear: vi.fn(),
    skipToYearEnd: vi.fn(),
  },
}));

describe('TickOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('advanceDay', () => {
    it('advances a normal day without a tournament', () => {
      const initialState = createFreshState('test-seed');
      initialState.day = 1;
      initialState.isTournamentWeek = false;

      const nextState = TickOrchestrator.advanceDay(initialState);

      expect(nextState.day).toBe(2);
      expect(advanceWeek).not.toHaveBeenCalled();
      expect(TournamentSelectionService.resolveRound).not.toHaveBeenCalled();
    });

    it('advances a tournament day and appends newsletter items', () => {
      const initialState = createFreshState('test-seed');
      initialState.day = 2;
      initialState.isTournamentWeek = true;
      initialState.activeTournamentId = 'test-tournament';

      const mockUpdatedState = { ...initialState, testMutated: true };
      vi.mocked(TournamentSelectionService.resolveRound).mockReturnValue({
        updatedState: mockUpdatedState as any,
        roundResults: ['Bout 1 result', 'Bout 2 result'],
      });

      const nextState = TickOrchestrator.advanceDay(initialState);

      expect(TournamentSelectionService.resolveRound).toHaveBeenCalledWith(
        initialState,
        'test-tournament',
        expect.any(Number)
      );

      expect(nextState.day).toBe(3);
      expect(nextState.newsletter).toBeDefined();
      expect(nextState.newsletter!.length).toBeGreaterThan(0);
      expect(nextState.newsletter![0].items).toEqual(['Bout 1 result', 'Bout 2 result']);
      expect((nextState as any).testMutated).toBe(true);
    });

    it('triggers advanceWeek when day transitions from 6 to 7', () => {
      const initialState = createFreshState('test-seed');
      initialState.day = 6;

      const mockWeekState = { ...initialState, week: initialState.week + 1 };
      vi.mocked(advanceWeek).mockReturnValue(mockWeekState as any);

      const nextState = TickOrchestrator.advanceDay(initialState);

      expect(advanceWeek).toHaveBeenCalledWith(initialState);
      expect(nextState.day).toBe(0);
      expect(nextState.isTournamentWeek).toBe(false);
      expect(nextState.activeTournamentId).toBeUndefined();
      expect(nextState.week).toBe(initialState.week + 1);
    });
  });

  describe('skipToWeekEnd', () => {
    it('skips a normal week, directly calling advanceWeek', () => {
      const initialState = createFreshState('test-seed');
      initialState.day = 2;
      initialState.isTournamentWeek = false;

      const mockWeekState = { ...initialState, week: initialState.week + 1 };
      vi.mocked(advanceWeek).mockReturnValue(mockWeekState as any);

      const nextState = TickOrchestrator.skipToWeekEnd(initialState);

      expect(TournamentSelectionService.resolveRound).not.toHaveBeenCalled();
      expect(advanceWeek).toHaveBeenCalled();
      expect(nextState.day).toBe(0);
      expect(nextState.week).toBe(initialState.week + 1);
    });

    it('batches tournament days and summarizes in newsletter before calling advanceWeek', () => {
      const initialState = createFreshState('test-seed');
      initialState.day = 4; // Should resolve day 5 and 6
      initialState.isTournamentWeek = true;
      initialState.activeTournamentId = 'test-tournament';

      vi.mocked(TournamentSelectionService.resolveRound).mockImplementation((state: any) => ({
        updatedState: state,
        roundResults: ['Result'],
      }));

      const mockWeekState = { ...initialState, week: initialState.week + 1 };
      vi.mocked(advanceWeek).mockImplementation((state: any) => ({
        ...state,
        week: state.week + 1,
      }));

      const nextState = TickOrchestrator.skipToWeekEnd(initialState);

      // Should be called for day 5 and 6
      expect(TournamentSelectionService.resolveRound).toHaveBeenCalledTimes(2);
      expect(advanceWeek).toHaveBeenCalled();

      expect(nextState.day).toBe(0);
      expect(nextState.isTournamentWeek).toBe(false);
      expect(nextState.newsletter).toBeDefined();
      expect(nextState.newsletter![0].title).toContain('Tournament Week');
      expect(nextState.newsletter![0].items).toHaveLength(2); // One from day 5, one from day 6
    });
  });

  describe('TimeAdvanceService delegations', () => {
    it('delegates advanceQuarter', async () => {
      const state = createFreshState('test-seed');
      vi.mocked(TimeAdvanceService.advanceQuarter).mockResolvedValue(
        'advanceQuarter-result' as any
      );

      const res = await TickOrchestrator.advanceQuarter(state);
      expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledWith(state, undefined);
      expect(res).toBe('advanceQuarter-result');
    });

    it('delegates skipToQuarterEnd', async () => {
      const state = createFreshState('test-seed');
      vi.mocked(TimeAdvanceService.skipToQuarterEnd).mockResolvedValue('skipQuarter-result' as any);

      const res = await TickOrchestrator.skipToQuarterEnd(state);
      expect(TimeAdvanceService.skipToQuarterEnd).toHaveBeenCalledWith(state, undefined);
      expect(res).toBe('skipQuarter-result');
    });

    it('delegates advanceYear', async () => {
      const state = createFreshState('test-seed');
      vi.mocked(TimeAdvanceService.advanceYear).mockResolvedValue('advanceYear-result' as any);

      const res = await TickOrchestrator.advanceYear(state);
      expect(TimeAdvanceService.advanceYear).toHaveBeenCalledWith(state, undefined);
      expect(res).toBe('advanceYear-result');
    });

    it('delegates skipToYearEnd', async () => {
      const state = createFreshState('test-seed');
      vi.mocked(TimeAdvanceService.skipToYearEnd).mockResolvedValue('skipYear-result' as any);

      const res = await TickOrchestrator.skipToYearEnd(state);
      expect(TimeAdvanceService.skipToYearEnd).toHaveBeenCalledWith(state, undefined);
      expect(res).toBe('skipYear-result');
    });
  });
});
