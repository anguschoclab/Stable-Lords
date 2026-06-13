import { describe, it, expect } from 'vitest';
import { getFatigueBand, isFatigued, isExhausted, FATIGUE_FRESH, FATIGUE_ELEVATED } from '@/utils/fatigueUtils';

describe('fatigueUtils', () => {
  describe('getFatigueBand', () => {
    it('returns fresh for fatigue <= FATIGUE_FRESH', () => {
      expect(getFatigueBand(0)).toBe('fresh');
      expect(getFatigueBand(FATIGUE_FRESH)).toBe('fresh');
    });

    it('returns elevated for fatigue > FATIGUE_FRESH and <= FATIGUE_ELEVATED', () => {
      expect(getFatigueBand(FATIGUE_FRESH + 1)).toBe('elevated');
      expect(getFatigueBand(FATIGUE_ELEVATED)).toBe('elevated');
    });

    it('returns exhausted for fatigue > FATIGUE_ELEVATED', () => {
      expect(getFatigueBand(FATIGUE_ELEVATED + 1)).toBe('exhausted');
      expect(getFatigueBand(100)).toBe('exhausted');
    });
  });

  describe('isFatigued', () => {
    it('returns false when fresh, true otherwise', () => {
      expect(isFatigued(FATIGUE_FRESH)).toBe(false);
      expect(isFatigued(FATIGUE_FRESH + 1)).toBe(true);
      expect(isFatigued(100)).toBe(true);
    });
  });

  describe('isExhausted', () => {
    it('returns false when not exhausted, true otherwise', () => {
      expect(isExhausted(FATIGUE_ELEVATED)).toBe(false);
      expect(isExhausted(FATIGUE_ELEVATED + 1)).toBe(true);
      expect(isExhausted(100)).toBe(true);
    });
  });
});
