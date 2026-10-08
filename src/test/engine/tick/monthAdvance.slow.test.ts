import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeAdvanceService } from '@/engine/pipeline/tick/timeAdvance';
import { TickOrchestrator } from '@/engine/pipeline/tick/TickOrchestrator';
import * as weekPipelineService from '@/engine/pipeline/services/weekPipelineService';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { truncateState } from '@/engine/storage/truncation';
import { sweepUnfinishedTournaments } from '@/engine/matchmaking/tournamentSelection/resolution';
import type { GameState } from '@/types/state.types';
import type { SoftStopCondition } from '@/engine/pipeline/tick/timeAdvance';

/**
 * advanceMonth: a 4-week stride on the canonical week pipeline — same
 * teardown as advanceQuarter (tournament sweep → archive drain → truncate),
 * per-week stop conditions, and telemetry. Composition target for callers
 * that want a coarser-than-week but finer-than-quarter step.
 */
describe('TimeAdvanceService.advanceMonth', () => {
  describe('mechanics (week pipeline mocked)', () => {
    let mockState: GameState;

    beforeEach(() => {
      mockState = createFreshState('month-mechanics');
      vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (state) => {
        return { ...state, week: state.week + 1, arenaHistory: [] };
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('advances exactly 4 weeks when no stop conditions trigger', async () => {
      const startWeek = mockState.week;
      const result = await TimeAdvanceService.advanceMonth(mockState);

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(4);
      expect(result.weeksCompleted).toBe(4);
      expect(result.stopReason).toBeNull();
      expect(result.state.week).toBe(startWeek + 4);
    });

    it('produces 4 week summaries and a month summary spanning the stride', async () => {
      const result = await TimeAdvanceService.advanceMonth(mockState);
      expect(result.summaries).toHaveLength(4);
      expect(result.monthSummary.weekSummaries).toHaveLength(4);
      expect(result.monthSummary.startWeek).toBe(mockState.week);
      expect(result.monthSummary.endWeek).toBe(mockState.week + 4);
    });

    it('evaluates stop conditions EVERY week, not just at the month boundary', async () => {
      const conditions: SoftStopCondition[] = [
        { type: 'custom', check: (s) => s.week === mockState.week + 2 },
      ];
      const result = await TimeAdvanceService.advanceMonth(mockState, { stopConditions: conditions });
      expect(result.stopReason).toBe('custom_condition');
      expect(result.weeksCompleted).toBe(2);
      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(2);
    });

    it('drains deferredBoutLogs weekly into pendingArchives — never performs I/O itself', async () => {
      vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (state) => ({
        ...state,
        week: state.week + 1,
        deferredBoutLogs: [
          { year: state.year, season: 0, boutId: `b-${state.week}`, transcript: ['x'] },
        ],
      }));
      const result = await TimeAdvanceService.advanceMonth(mockState, { headless: true });
      expect(result.pendingArchives.length).toBe(4);
      expect(result.state.deferredBoutLogs ?? []).toEqual([]);
    });

    it('calls onProgress per week with the 4-week total', async () => {
      const calls: [number, number][] = [];
      await TimeAdvanceService.advanceMonth(mockState, {
        onProgress: (done, total) => calls.push([done, total]),
      });
      expect(calls).toEqual([
        [1, 4],
        [2, 4],
        [3, 4],
        [4, 4],
      ]);
    });

    it('skipToMonthEnd runs the month stride headless', async () => {
      const result = await TimeAdvanceService.skipToMonthEnd(mockState);
      const firstCall = vi.mocked(weekPipelineService.advanceWeek).mock.calls[0];
      expect(firstCall?.[1]?.headless).toBe(true);
      expect(result.weeksCompleted).toBe(4);
    });
  });

  describe('equivalence (real pipeline)', () => {
    it('matches 4 sequential advanceWeek calls at an ordinary week', async () => {
      const FIXED_ISO = '2026-04-11T09:00:00.000Z';
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

      const batch = createFreshState('month-equiv', '2026-04-11T09:00:00Z');
      const seq = createFreshState('month-equiv', '2026-04-11T09:00:00Z');

      const result = await TimeAdvanceService.advanceMonth(batch, { headless: true });

      let sequential = seq;
      for (let i = 0; i < 4; i++) sequential = await advanceWeek(sequential, { headless: true });
      // Batch teardown runs a terminal tournament sweep then truncates —
      // mirror the same cadence for a fair comparison.
      sequential = truncateState(sweepUnfinishedTournaments(sequential, true));

      expect(result.state.week).toBe(sequential.week);
      expect(result.state.year).toBe(sequential.year);
      expect(result.state.treasury).toBe(sequential.treasury);
      expect(result.state.roster.length).toBe(sequential.roster.length);
      expect(result.state.arenaHistory.length).toBe(sequential.arenaHistory.length);
      vi.restoreAllMocks();
    });

    it('crosses the year boundary correctly (week 51 + 4 → year+1, week 3)', async () => {
      const state = createFreshState('month-year-boundary', '2026-04-11T09:00:00Z');
      state.week = 51;
      state.year = 1;

      const result = await TimeAdvanceService.advanceMonth(state, { headless: true });
      expect(result.weeksCompleted).toBe(4);
      expect(result.state.week).toBe(3);
      expect(result.state.year).toBe(2);
      expect(result.monthSummary.endYear).toBe(2);
    });
  });

  describe('TickOrchestrator', () => {
    afterEach(() => vi.restoreAllMocks());

    it('delegates advanceMonth to TimeAdvanceService', async () => {
      const spy = vi
        .spyOn(TimeAdvanceService, 'advanceMonth')
        .mockResolvedValue({ marker: true } as never);
      const state = createFreshState('month-orch');
      await TickOrchestrator.advanceMonth(state, { headless: true });
      expect(spy).toHaveBeenCalledWith(state, { headless: true });
    });

    it('delegates skipToMonthEnd to TimeAdvanceService', async () => {
      const spy = vi
        .spyOn(TimeAdvanceService, 'skipToMonthEnd')
        .mockResolvedValue({ marker: true } as never);
      const state = createFreshState('month-orch-skip');
      await TickOrchestrator.skipToMonthEnd(state, {});
      expect(spy).toHaveBeenCalledWith(state, {});
    });
  });
});
