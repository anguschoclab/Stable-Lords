import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/engine/matchmaking/tournamentSelection', () => ({
  TournamentSelectionService: {
    resolveRound: vi.fn(() => ({
      updatedState: { ...mockState, treasury: 500 },
      roundResults: ['Fighter A beat Fighter B'],
    })),
  },
}));

vi.mock('@/engine/pipeline/services/weekPipelineService', () => ({
  advanceWeek: vi.fn((state) => ({ ...state, treasury: 999 })),
}));

vi.mock('@/engine/tick/TimeAdvanceService', () => ({
  TimeAdvanceService: {
    advanceQuarter: vi.fn(async () => ({})),
    skipToQuarterEnd: vi.fn(async () => ({})),
    advanceYear: vi.fn(async () => ({})),
    skipToYearEnd: vi.fn(async () => ({})),
  },
}));

import { TickOrchestrator } from '@/engine/tick/TickOrchestrator';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { GameState } from '@/types/state.types';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import * as weekPipelineService from '@/engine/pipeline/services/weekPipelineService';
import { TimeAdvanceService } from '@/engine/tick/TimeAdvanceService';

let mockState: GameState;

describe('TickOrchestrator', () => {
  beforeEach(() => {
    mockState = createFreshState('test-seed');
    vi.clearAllMocks();
  });

  describe('advanceDay', () => {
    it('should advance to the next day when not day 6 and not tournament', () => {
      mockState.day = 0;
      mockState.isTournamentWeek = false;

      const nextState = TickOrchestrator.advanceDay(mockState);

      expect(nextState.day).toBe(1);
      expect(nextState.isTournamentWeek).toBe(false);
      expect(weekPipelineService.advanceWeek).not.toHaveBeenCalled();
      expect(TournamentSelectionService.resolveRound).not.toHaveBeenCalled();
    });

    it('should trigger advanceWeek when advancing past day 6', () => {
      mockState.day = 6;
      mockState.isTournamentWeek = false;

      const nextState = TickOrchestrator.advanceDay(mockState);

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledWith(mockState);
      expect(nextState.day).toBe(0);
      expect(nextState.isTournamentWeek).toBe(false);
      expect(nextState.activeTournamentId).toBeUndefined();
      expect(nextState.treasury).toBe(999);
    });

    it('should resolve tournament round when isTournamentWeek and activeTournamentId are set', () => {
      mockState.day = 2;
      mockState.isTournamentWeek = true;
      mockState.activeTournamentId = 'test-tournament';

      const nextState = TickOrchestrator.advanceDay(mockState);

      expect(TournamentSelectionService.resolveRound).toHaveBeenCalledWith(
        mockState,
        'test-tournament',
        expect.any(Number) // the seed
      );

      expect(nextState.day).toBe(3);
      expect(nextState.treasury).toBe(500);

      // Should have appended a newsletter item
      expect(nextState.newsletter).toBeDefined();
      expect(nextState.newsletter!.length).toBeGreaterThan(0);
      expect(nextState.newsletter![0].items).toContain('Fighter A beat Fighter B');
    });
  });

  describe('skipToWeekEnd', () => {
    it('should advance week immediately for standard week', () => {
      mockState.day = 1;
      mockState.isTournamentWeek = false;

      const nextState = TickOrchestrator.skipToWeekEnd(mockState);

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledWith(mockState);
      expect(nextState.day).toBe(0);
      expect(nextState.treasury).toBe(999);
      expect(TournamentSelectionService.resolveRound).not.toHaveBeenCalled();
    });

    it('should resolve remaining tournament rounds before advancing week', () => {
      mockState.day = 3;
      mockState.isTournamentWeek = true;
      mockState.activeTournamentId = 'test-tournament';

      // Setup mock to return incremental changes
      vi.mocked(TournamentSelectionService.resolveRound).mockImplementation(
        (state: any, tId: any, seed: any) => {
          return {
            updatedState: { ...state, fame: (state.fame || 0) + 10 },
            roundResults: [`Result for seed ${seed}`],
          };
        }
      );

      vi.mocked(weekPipelineService.advanceWeek).mockImplementation((state: any) => state);

      const nextState = TickOrchestrator.skipToWeekEnd(mockState);

      // Should loop from currentDay + 1 (4) to 6 -> 3 iterations
      expect(TournamentSelectionService.resolveRound).toHaveBeenCalledTimes(3);

      // Advance week should be called with the state accumulated from tournament rounds
      expect(weekPipelineService.advanceWeek).toHaveBeenCalled();

      expect(nextState.day).toBe(0);
      expect(nextState.isTournamentWeek).toBe(false);
      expect(nextState.activeTournamentId).toBeUndefined();

      // Should combine news items
      const newsletter = nextState.newsletter || [];
      expect(newsletter.length).toBeGreaterThan(0);
      const latestNews = newsletter[newsletter.length - 1];
      expect(latestNews.title).toContain('Recap');
      expect(latestNews.items.length).toBe(3);
    });
  });

  describe('Time Advance Delegation', () => {
    it('advanceQuarter delegates to TimeAdvanceService', async () => {
      await TickOrchestrator.advanceQuarter(mockState, { headless: true });
      expect(TimeAdvanceService.advanceQuarter).toHaveBeenCalledWith(mockState, { headless: true });
    });

    it('skipToQuarterEnd delegates to TimeAdvanceService', async () => {
      await TickOrchestrator.skipToQuarterEnd(mockState, { headless: true });
      expect(TimeAdvanceService.skipToQuarterEnd).toHaveBeenCalledWith(mockState, {
        headless: true,
      });
    });

    it('advanceYear delegates to TimeAdvanceService', async () => {
      await TickOrchestrator.advanceYear(mockState, { headless: true });
      expect(TimeAdvanceService.advanceYear).toHaveBeenCalledWith(mockState, { headless: true });
    });

    it('skipToYearEnd delegates to TimeAdvanceService', async () => {
      await TickOrchestrator.skipToYearEnd(mockState, { headless: true });
      expect(TimeAdvanceService.skipToYearEnd).toHaveBeenCalledWith(mockState, { headless: true });
    });
  });
});
