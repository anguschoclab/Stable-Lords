import { describe, it, expect, vi } from 'vitest';
import { hasInjuries, countInjuries, getInjurySeverityCounts, hasInjuryOfSeverity, makeInjury } from '@/engine/injuries/utils';
import type { Warrior } from '@/types/warrior.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { InjuryId } from '@/types/shared.types';

describe('Injury Utilities', () => {
  describe('hasInjuries', () => {
    it('returns true if warrior has injuries', () => {
      const warrior = { injuries: [{ id: 'inj-1' as InjuryId, severity: 'Minor' as const }] } as unknown as Warrior;
      expect(hasInjuries(warrior)).toBe(true);
    });

    it('returns false if warrior has no injuries', () => {
      const warrior = { injuries: [] } as unknown as Warrior;
      expect(hasInjuries(warrior)).toBe(false);
    });

    it('returns false if warrior injuries are undefined', () => {
      const warrior = {} as unknown as Warrior;
      expect(hasInjuries(warrior)).toBe(false);
    });
  });

  describe('countInjuries', () => {
    it('returns correct count of injuries', () => {
      const warrior = { injuries: [{ id: 'inj-1' }, { id: 'inj-2' }] } as unknown as Warrior;
      expect(countInjuries(warrior)).toBe(2);
    });

    it('returns 0 if warrior has no injuries', () => {
      const warrior = { injuries: [] } as unknown as Warrior;
      expect(countInjuries(warrior)).toBe(0);
    });

    it('returns 0 if warrior injuries are undefined', () => {
      const warrior = {} as unknown as Warrior;
      expect(countInjuries(warrior)).toBe(0);
    });
  });

  describe('getInjurySeverityCounts', () => {
    it('counts injuries by severity', () => {
      const warrior = {
        injuries: [
          { severity: 'Minor' },
          { severity: 'Major' },
          { severity: 'Minor' },
          { severity: 'Critical' },
        ],
      } as unknown as Warrior;
      const counts = getInjurySeverityCounts(warrior);
      expect(counts).toEqual({ Minor: 2, Major: 1, Critical: 1 });
    });

    it('returns empty object if no injuries', () => {
      const warrior = { injuries: [] } as unknown as Warrior;
      expect(getInjurySeverityCounts(warrior)).toEqual({});
    });

    it('returns empty object if injuries are undefined', () => {
      const warrior = {} as unknown as Warrior;
      expect(getInjurySeverityCounts(warrior)).toEqual({});
    });

    it('handles injuries with missing severity', () => {
      const warrior = { injuries: [{}] } as unknown as Warrior;
      expect(getInjurySeverityCounts(warrior)).toEqual({ Unknown: 1 });
    });
  });

  describe('hasInjuryOfSeverity', () => {
    it('returns true if warrior has injury of given severity', () => {
      const warrior = { injuries: [{ severity: 'Severe' as const }] } as unknown as Warrior;
      expect(hasInjuryOfSeverity(warrior, 'Severe')).toBe(true);
    });

    it('returns false if warrior does not have injury of given severity', () => {
      const warrior = { injuries: [{ severity: 'Minor' as const }] } as unknown as Warrior;
      expect(hasInjuryOfSeverity(warrior, 'Severe')).toBe(false);
    });

    it('returns false if injuries are undefined', () => {
      const warrior = {} as unknown as Warrior;
      expect(hasInjuryOfSeverity(warrior, 'Severe')).toBe(false);
    });
  });

  describe('makeInjury', () => {
    it('creates an injury correctly using RNG', () => {
      const rng = {
        uuid: vi.fn().mockReturnValue('injury-123'),
        next: vi.fn().mockReturnValue(0.5),
      } as unknown as IRNGService;

      const params = {
        name: 'Broken Arm',
        description: 'Arm is broken.',
        severity: 'Severe' as const,
        weeksBase: 2,
        weeksRange: 4,
        penalties: { ST: 10 },
      };

      const injury = makeInjury(rng, params);

      expect(rng.uuid).toHaveBeenCalledWith('injury');
      expect(rng.next).toHaveBeenCalled();

      expect(injury).toEqual({
        id: 'injury-123',
        name: 'Broken Arm',
        description: 'Arm is broken.',
        severity: 'Severe',
        weeksRemaining: 4, // 2 + Math.floor(0.5 * 4) = 4
        penalties: { ST: 10 },
      });
    });
  });
});
