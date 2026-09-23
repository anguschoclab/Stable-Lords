import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluateStopConditions,
  SoftStopCondition,
  TimeAdvanceService,
} from '@/engine/pipeline/tick/timeAdvance';
import type { GameState } from '@/types/state.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import * as weekPipelineService from '@/engine/pipeline/services/weekPipelineService';

describe('TimeAdvanceService - evaluateStopConditions', () => {
  let mockState: GameState;

  beforeEach(() => {
    mockState = createFreshState('test-seed');
  });

  it('should return shouldStop: false when no conditions are met', () => {
    mockState.roster = [
      {
        id: 'w1',
        name: 'Test',
        status: 'Active',
        fatigue: 0,
        injuries: [],
      } as any,
      {
        id: 'w2',
        name: 'Test2',
        status: 'Active',
        fatigue: 0,
        injuries: [],
      } as any,
    ];

    const conditions: SoftStopCondition[] = [
      { type: 'rosterEmpty' },
      { type: 'noPairings' },
      { type: 'playerDeath' },
    ];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(false);
  });

  it('should stop when roster is empty and rosterEmpty condition is active', () => {
    mockState.roster = [];
    const conditions: SoftStopCondition[] = [{ type: 'rosterEmpty' }];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe('roster_empty');
  });

  it('should stop when unacknowledged death exists', () => {
    mockState.roster = [
      {
        id: 'w1',
        status: 'Active',
        isDead: false,
        injuries: [],
      } as any,
    ];
    mockState.unacknowledgedDeaths = ['w2' as any];
    const conditions: SoftStopCondition[] = [{ type: 'playerDeath' }];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe('player_death');
  });

  it('should stop when no eligible fighters are available (noPairings)', () => {
    mockState.roster = [
      {
        id: 'w1',
        status: 'Injured', // Not 'Active'
        isDead: false,
        injuries: [{ type: 'broken_arm', weeksRemaining: 2 }],
      } as any,
      {
        id: 'w2',
        status: 'Active',
        isDead: true, // Dead
        injuries: [],
      } as any,
    ];

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe('no_pairings');
  });

  it('should NOT stop when rival stables have eligible fighters even if player does not', () => {
    mockState.roster = [
      {
        id: 'w1',
        status: 'Active',
        fatigue: 75, // Too tired to fight (>60 = exhausted, non-tournament)
        injuries: [],
      } as any,
    ];
    mockState.rivals = [
      {
        id: 'rival-1',
        roster: [
          { id: 'w2', status: 'Active', fatigue: 0, injuries: [] } as any,
          { id: 'w3', status: 'Active', fatigue: 0, injuries: [] } as any,
        ],
      } as any,
    ];

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(false);
  });

  it('should stop when total eligible across all stables is fewer than 2', () => {
    mockState.roster = [
      {
        id: 'w1',
        status: 'Active',
        fatigue: 0,
        injuries: [],
      } as any,
    ];
    mockState.rivals = [
      {
        id: 'rival-1',
        roster: [{ id: 'w2', status: 'Active', fatigue: 75, injuries: [] } as any],
      } as any,
    ];

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe('no_pairings');
  });

  it('should NOT stop when exactly 2 eligible warriors exist across all stables', () => {
    mockState.roster = [
      {
        id: 'w1',
        status: 'Active',
        fatigue: 0,
        injuries: [],
      } as any,
    ];
    mockState.rivals = [
      {
        id: 'rival-1',
        roster: [{ id: 'w2', status: 'Active', fatigue: 0, injuries: [] } as any],
      } as any,
    ];

    const conditions: SoftStopCondition[] = [{ type: 'noPairings' }];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(false);
  });

  it('should evaluate custom conditions', () => {
    mockState.roster = [];

    const conditions: SoftStopCondition[] = [
      { type: 'custom', check: (state) => state.week === 1 },
    ];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(true);
    expect(result.reason).toBe('custom_condition');
  });

  it('should return false for custom condition if check is false', () => {
    mockState.roster = [];

    const conditions: SoftStopCondition[] = [
      { type: 'custom', check: (state) => state.week === 999 }, // mockState starts at week 1
    ];

    const result = evaluateStopConditions(mockState, conditions);
    expect(result.shouldStop).toBe(false);
  });
});

describe('TimeAdvanceService methods', () => {
  let mockState: GameState;

  beforeEach(() => {
    mockState = createFreshState('test-seed');

    // Use spyOn instead of vi.mock to avoid bun test vi.mock errors
    vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (state) => {
      return { ...state, week: state.week + 1, arenaHistory: [] };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('advanceQuarter', () => {
    it('should advance exactly 13 weeks when no stop conditions trigger', async () => {
      const startWeek = mockState.week;
      const result = await TimeAdvanceService.advanceQuarter(mockState);

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(13);
      expect(result.weeksCompleted).toBe(13);
      expect(result.stopReason).toBeNull();
      expect(result.state.week).toBe(startWeek + 13);
    });

    it('should stop early if a condition is triggered at a checkpoint', async () => {
      let calls = 0;
      vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (state) => {
        calls++;
        if (calls >= 4) {
          return { ...state, week: state.week + 1, roster: [], arenaHistory: [] };
        }
        return { ...state, week: state.week + 1, arenaHistory: [] };
      });

      const conditions: SoftStopCondition[] = [{ type: 'rosterEmpty' }];
      const result = await TimeAdvanceService.advanceQuarter(mockState, {
        stopConditions: conditions,
      });

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(4);
      expect(result.stopReason).toBe('roster_empty');
      expect(result.weeksCompleted).toBe(4);
    });

    it('evaluates stop conditions EVERY week — not just at checkpoints', async () => {
      let calls = 0;
      vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (state) => {
        calls++;
        // Roster empties on week 1 — the sim must halt at week 1, not continue
        // to a 4-week checkpoint (the old checkpointInterval behavior).
        return { ...state, week: state.week + 1, roster: [], arenaHistory: [] };
      });

      const result = await TimeAdvanceService.advanceQuarter(mockState, {
        stopConditions: [{ type: 'rosterEmpty' }],
      });

      expect(result.weeksCompleted).toBe(1);
      expect(result.stopReason).toBe('roster_empty');
    });

    it('should call onProgress if provided', async () => {
      const onProgress = vi.fn();
      await TimeAdvanceService.advanceQuarter(mockState, { onProgress });

      expect(onProgress).toHaveBeenCalledTimes(13);
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 13);
      expect(onProgress).toHaveBeenNthCalledWith(13, 13, 13);
    });

    it('drains deferredBoutLogs into pendingArchives weekly — the service never performs I/O', async () => {
      let calls = 0;
      vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (state) => {
        calls++;
        return {
          ...state,
          week: state.week + 1,
          arenaHistory: [],
          deferredBoutLogs: [
            { year: 1, season: 0, boutId: `bout_w${calls}`, transcript: ['line'] },
          ],
        };
      });

      const result = await TimeAdvanceService.advanceQuarter(mockState);

      // 13 weeks × 1 log each — drained weekly, not dropped by truncation.
      expect(result.pendingArchives).toHaveLength(13);
      expect(result.pendingArchives[0]?.boutId).toBe('bout_w1');
      expect(result.state.deferredBoutLogs ?? []).toHaveLength(0);
    });
  });

  describe('advanceYear', () => {
    it('should advance exactly 4 quarters (52 weeks) if no stops occur', async () => {
      const startWeek = mockState.week;
      const result = await TimeAdvanceService.advanceYear(mockState);

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(52);
      expect(result.stopReason).toBeNull();
      expect(result.quarterResults).toHaveLength(4);
      expect(result.state.week).toBe(startWeek + 52);
    });

    it('should stop and return early if a quarter triggers a stop condition', async () => {
      let calls = 0;
      vi.spyOn(weekPipelineService, 'advanceWeek').mockImplementation(async (state) => {
        calls++;
        if (calls >= 6) {
          return {
            ...state,
            week: state.week + 1,
            unacknowledgedDeaths: ['w1'] as any,
            arenaHistory: [],
          };
        }
        return { ...state, week: state.week + 1, arenaHistory: [] };
      });

      const conditions: SoftStopCondition[] = [{ type: 'playerDeath' }];
      const result = await TimeAdvanceService.advanceYear(mockState, {
        stopConditions: conditions,
      });

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(6);
      expect(result.stopReason).toBe('player_death');
      expect(result.quarterResults).toHaveLength(1);
    });
  });

  describe('skipToQuarterEnd', () => {
    it('should call advanceQuarter with headless mode', async () => {
      const startWeek = mockState.week;
      const result = await TimeAdvanceService.skipToQuarterEnd(mockState);

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(13);
      expect(result.pendingArchives).toBeDefined();
      expect(result.state.week).toBe(startWeek + 13);
    });
  });

  describe('skipToYearEnd', () => {
    it('should call advanceYear with headless mode', async () => {
      const startWeek = mockState.week;
      const result = await TimeAdvanceService.skipToYearEnd(mockState);

      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(52);
      expect(result.pendingArchives).toBeDefined();
      expect(result.state.week).toBe(startWeek + 52);
    });
  });

  describe('advanceWeek', () => {
    it('should advance a single week', async () => {
      await TimeAdvanceService.advanceWeek(mockState);
      expect(weekPipelineService.advanceWeek).toHaveBeenCalledTimes(1);
    });
  });
});
