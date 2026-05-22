import { describe, it, expect } from 'vitest';
import { collectPulse, formatPulseTable, type SimPulse } from '@/engine/stats/simulationMetrics';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { WarriorId } from '@/types/shared.types';

describe('simulationMetrics', () => {
  describe('collectPulse', () => {
    it('collects metrics correctly from a fresh state', () => {
      const state = createFreshState('test-seed');
      const pulse = collectPulse(state);

      expect(pulse.week).toBe(1);
      expect(pulse.playerTreasury).toBe(1000);
      expect(pulse.rosterSize).toBe(0);
      expect(pulse.deadCount).toBe(0);
      expect(pulse.retiredCount).toBe(0);
      expect(pulse.rivalCount).toBe(4); // from createFreshState
      expect(pulse.totalBouts).toBe(0);
      expect(typeof pulse.avgRivalTreasury).toBe('number');
    });

    it('collects metrics correctly with modified state', () => {
      const state = createFreshState('test-seed');
      state.week = 5;
      state.treasury = 2500;

      // Mock roster, graveyard, retired, and arenaHistory
      state.roster = [{ id: 'w1' as WarriorId } as any, { id: 'w2' as WarriorId } as any];
      state.graveyard = [{ id: 'w3' as WarriorId } as any];
      state.retired = [{ id: 'w4' as WarriorId } as any, { id: 'w5' as WarriorId } as any, { id: 'w6' as WarriorId } as any];
      state.arenaHistory = [{} as any, {} as any];

      // Setup rivals to calculate avg treasury
      state.rivals = [
        { id: 'r1' as any, treasury: 1000 } as any,
        { id: 'r2' as any, treasury: 2000 } as any,
        { id: 'r3' as any, treasury: 3000 } as any,
      ];

      const pulse = collectPulse(state);

      expect(pulse.week).toBe(5);
      expect(pulse.playerTreasury).toBe(2500);
      expect(pulse.rosterSize).toBe(2);
      expect(pulse.deadCount).toBe(1);
      expect(pulse.retiredCount).toBe(3);
      expect(pulse.rivalCount).toBe(3);
      expect(pulse.avgRivalTreasury).toBe(2000); // (1000+2000+3000)/3
      expect(pulse.totalBouts).toBe(2);
    });

    it('handles state with no rivals safely', () => {
      const state = createFreshState('test-seed');
      state.rivals = [];

      const pulse = collectPulse(state);
      expect(pulse.rivalCount).toBe(0);
      expect(pulse.avgRivalTreasury).toBe(0);
    });

    it('handles state where rivals is undefined safely', () => {
      const state = createFreshState('test-seed');
      state.rivals = undefined as any;

      const pulse = collectPulse(state);
      expect(pulse.rivalCount).toBe(0);
      expect(pulse.avgRivalTreasury).toBe(0);
    });
  });

  describe('formatPulseTable', () => {
    it('returns "No data" for empty array', () => {
      expect(formatPulseTable([])).toBe('No data');
    });

    it('formats a single pulse correctly', () => {
      const pulse: SimPulse = {
        week: 1,
        playerTreasury: 1000,
        rosterSize: 5,
        deadCount: 1,
        retiredCount: 2,
        rivalCount: 4,
        avgRivalTreasury: 1500,
        totalBouts: 10
      };

      const table = formatPulseTable([pulse]);

      expect(table).toContain('Week | Treasury | Roster | Dead | Rivals | Avg Rival Treas');
      expect(table).toContain('---- | -------- | ------ | ---- | ------ | --------------');
      expect(table).toContain('1    | 1000     | 5      | 1    | 4      | 1500');
    });

    it('formats multiple pulses correctly', () => {
      const pulses: SimPulse[] = [
        {
          week: 1,
          playerTreasury: 1000,
          rosterSize: 5,
          deadCount: 1,
          retiredCount: 2,
          rivalCount: 4,
          avgRivalTreasury: 1500,
          totalBouts: 10
        },
        {
          week: 2,
          playerTreasury: 1200,
          rosterSize: 6,
          deadCount: 1,
          retiredCount: 2,
          rivalCount: 4,
          avgRivalTreasury: 1600,
          totalBouts: 15
        }
      ];

      const table = formatPulseTable(pulses);
      const lines = table.split('\n');

      expect(lines.length).toBe(4); // header, divider, row1, row2
      expect(lines[0]).toBe('Week | Treasury | Roster | Dead | Rivals | Avg Rival Treas');
      expect(lines[2]).toBe('1    | 1000     | 5      | 1    | 4      | 1500');
      expect(lines[3]).toBe('2    | 1200     | 6      | 1    | 4      | 1600');
    });
  });
});
