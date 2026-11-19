import { describe, it, expect } from 'vitest';
import { prepareWeekContext, createMutableWeekContext } from '@/engine/pipeline/services/weekPipeline/context';
import { GameState } from '@/types/game';

describe('weekPipeline/context', () => {
  describe('createMutableWeekContext', () => {
    it('returns a new object stripped of caches when mutableInput is true', () => {
      const state = { season: 'Spring', week: 1 } as GameState;
      const result = createMutableWeekContext(state, true);
      expect(result).not.toBe(state);
      expect(result).toEqual(state);
    });

    it('returns a structuredClone when mutableInput is false or undefined', () => {
      const state = { season: 'Spring', week: 1 } as GameState;
      const result = createMutableWeekContext(state, false);
      expect(result).not.toBe(state);
      expect(result).toEqual(state);
    });
  });

  describe('prepareWeekContext', () => {
    it('calculates the correct next week and year', () => {
      const state = { season: 'Spring', week: 1, year: 1 } as GameState;
      const ctx = prepareWeekContext(state, false);
      expect(ctx.currentWeek).toBe(1);
      expect(ctx.nextWeek).toBe(2);
      expect(ctx.nextYear).toBe(1);
      expect(ctx.headless).toBe(false);
      expect(ctx.rootRng).toBeDefined();
    });

    it('rolls over the year when week is 52', () => {
      const state = { season: 'Winter', week: 52, year: 1 } as GameState;
      const ctx = prepareWeekContext(state, false);
      expect(ctx.currentWeek).toBe(52);
      expect(ctx.nextWeek).toBe(1);
      expect(ctx.nextYear).toBe(2);
    });
  });
});
