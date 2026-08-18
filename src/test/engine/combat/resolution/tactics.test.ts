import { describe, it, expect } from 'vitest';
import { resolveEffectiveTactics, applyAggressionBias } from '@/engine/combat/resolution/tactics';
import type { FightPlan } from '@/types/combat.types';

describe('Tactics Mechanics', () => {
  describe('resolveEffectiveTactics', () => {
    it('uses phase tactics if provided', () => {
      const plan: FightPlan = {
        OE: 1, AL: 1,
        offensiveTactic: 'Aggressive',
        defensiveTactic: 'Evasive',
        target: 'Head',
        protect: 'Head',
        phases: {
          opening: { offensiveTactic: 'None', defensiveTactic: 'None', target: 'Chest', protect: 'Chest' },
          mid: { offensiveTactic: 'Precision', defensiveTactic: 'Brace', target: 'Arms', protect: 'Arms' },
          late: { offensiveTactic: 'Aggressive', defensiveTactic: 'Evasive', target: 'Legs', protect: 'Legs' }
        }
      };

      const result = resolveEffectiveTactics(plan, 'mid');
      expect(result.offTactic).toBe('Precision');
      expect(result.defTactic).toBe('Brace');
      expect(result.target).toBe('Arms');
    });

    it('falls back to default plan tactics if phase not provided', () => {
      const plan: FightPlan = {
        OE: 1, AL: 1,
        offensiveTactic: 'Aggressive',
        defensiveTactic: 'Evasive',
        target: 'Head',
        protect: 'Head',
      };

      const result = resolveEffectiveTactics(plan, 'opening');
      expect(result.offTactic).toBe('Aggressive');
      expect(result.defTactic).toBe('Evasive');
      expect(result.target).toBe('Head');
    });

    it('falls back to none/Any if neither plan nor phase tactics exist', () => {
      const plan: FightPlan = { OE: 1, AL: 1, target: 'Head', protect: 'Head' } as any;

      const result = resolveEffectiveTactics(plan, 'late');
      expect(result.offTactic).toBe('none');
      expect(result.defTactic).toBe('none');
      expect(result.target).toBe('Head');
    });
  });

  describe('applyAggressionBias', () => {
    it('returns positive att offset and negative def offset for high aggression', () => {
      const [attOffset, defOffset] = applyAggressionBias(8);
      expect(attOffset).toBe(1.5); // (8 - 5) * 0.5 = 1.5
      expect(defOffset).toBe(-1.5); // -(8 - 5) * 0.5 = -1.5
    });

    it('returns negative att offset and positive def offset for low aggression', () => {
      const [attOffset, defOffset] = applyAggressionBias(2);
      expect(attOffset).toBe(-1.5); // (2 - 5) * 0.5 = -1.5
      expect(defOffset).toBe(1.5); // (5 - 2) * 0.5 = 1.5
    });

    it('returns zeroes for neutral aggression (5)', () => {
      const [attOffset, defOffset] = applyAggressionBias(5);
      expect(attOffset).toBe(0);
      expect(defOffset).toBe(0);
    });
  });
});
