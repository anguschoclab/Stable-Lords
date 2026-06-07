import { describe, it, expect, beforeEach } from 'vitest';
import { collectPulse, formatPulseTable, SimPulse } from '@/engine/stats/simulationMetrics';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightSummary } from '@/types/combat.types';

describe('simulationMetrics', () => {
  let mockState: GameState;

  beforeEach(() => {
    mockState = createFreshState('test-seed-123');
    // Ensure controlled initial state for tests
    mockState.week = 5;
    mockState.treasury = 2500;
    mockState.roster = [{ id: 'w1' } as Warrior, { id: 'w2' } as Warrior];
    mockState.graveyard = [{ id: 'd1' } as Warrior];
    mockState.retired = [{ id: 'r1' } as Warrior, { id: 'r2' } as Warrior, { id: 'r3' } as Warrior];
    mockState.arenaHistory = [{} as FightSummary, {} as FightSummary];
  });

  describe('collectPulse', () => {
    it('should correctly aggregate basic metrics', () => {
      // Mock rivals to specific controlled values
      mockState.rivals = [
        { treasury: 1000 } as RivalStableData,
        { treasury: 2000 } as RivalStableData,
        { treasury: 3000 } as RivalStableData,
      ];

      const pulse = collectPulse(mockState);

      expect(pulse).toEqual({
        week: 5,
        playerTreasury: 2500,
        rosterSize: 2,
        deadCount: 1,
        retiredCount: 3,
        rivalCount: 3,
        avgRivalTreasury: 2000,
        totalBouts: 2,
      });
    });

    it('should handle empty rivals array correctly', () => {
      mockState.rivals = [];

      const pulse = collectPulse(mockState);

      expect(pulse.rivalCount).toBe(0);
      expect(pulse.avgRivalTreasury).toBe(0);
    });

    it('should gracefully handle undefined rivals array', () => {
      // @ts-expect-error - testing defense against runtime undefined
      mockState.rivals = undefined;

      const pulse = collectPulse(mockState);

      expect(pulse.rivalCount).toBe(0);
      expect(pulse.avgRivalTreasury).toBe(0);
    });

    it('should correctly round average rival treasury', () => {
      mockState.rivals = [
        { treasury: 1000 } as RivalStableData,
        { treasury: 1500 } as RivalStableData,
        { treasury: 1000 } as RivalStableData,
      ];
      // 3500 / 3 = 1166.66...

      const pulse = collectPulse(mockState);

      expect(pulse.avgRivalTreasury).toBe(1167);
    });
  });

  describe('formatPulseTable', () => {
    it('should return "No data" for empty array', () => {
      expect(formatPulseTable([])).toBe('No data');
    });

    it('should correctly format a single pulse', () => {
      const pulse: SimPulse = {
        week: 10,
        playerTreasury: 5000,
        rosterSize: 4,
        deadCount: 0,
        retiredCount: 1,
        rivalCount: 2,
        avgRivalTreasury: 3000,
        totalBouts: 5,
      };

      const result = formatPulseTable([pulse]);

      const expectedLines = [
        'Week | Treasury | Roster | Dead | Rivals | Avg Rival Treas',
        '---- | -------- | ------ | ---- | ------ | --------------',
        '10   | 5000     | 4      | 0    | 2      | 3000',
      ];

      expect(result).toBe(expectedLines.join('\n'));
    });

    it('should correctly format multiple pulses with varied padding needs', () => {
      const pulses: SimPulse[] = [
        {
          week: 1,
          playerTreasury: 100,
          rosterSize: 1,
          deadCount: 0,
          retiredCount: 0,
          rivalCount: 4,
          avgRivalTreasury: 1500,
          totalBouts: 0,
        },
        {
          week: 100,
          playerTreasury: 12500,
          rosterSize: 10,
          deadCount: 5,
          retiredCount: 2,
          rivalCount: 3,
          avgRivalTreasury: 4200,
          totalBouts: 50,
        },
      ];

      const result = formatPulseTable(pulses);

      const expectedLines = [
        'Week | Treasury | Roster | Dead | Rivals | Avg Rival Treas',
        '---- | -------- | ------ | ---- | ------ | --------------',
        '1    | 100      | 1      | 0    | 4      | 1500',
        '100  | 12500    | 10     | 5    | 3      | 4200',
      ];

      expect(result).toBe(expectedLines.join('\n'));
    });
  });
});
