import { describe, it, expect } from 'vitest';
import { resolveEffectiveTactics, applyAggressionBias } from '@/engine/combat/resolution/tactics';
import type { FightPlan } from '@/types/combat.types';
import { FightingStyle } from '@/types/shared.types';

describe('Tactics Mechanics', () => {
  describe('resolveEffectiveTactics', () => {
    it('uses phase tactics if provided', () => {
      const plan: FightPlan = {
        style: FightingStyle.StrikingAttack,
        OE: 1,
        AL: 1,
        offensiveTactic: 'Bash',
        defensiveTactic: 'Dodge',
        target: 'Head',
        protect: 'Head',
        phases: {
          opening: {
            OE: 1,
            AL: 1,
            killDesire: 5,
            offensiveTactic: 'none',
            defensiveTactic: 'none',
            target: 'Chest',
          },
          mid: {
            OE: 1,
            AL: 1,
            killDesire: 5,
            offensiveTactic: 'Decisiveness',
            defensiveTactic: 'Parry',
            target: 'Right Arm',
          },
          late: {
            OE: 1,
            AL: 1,
            killDesire: 5,
            offensiveTactic: 'Bash',
            defensiveTactic: 'Dodge',
            target: 'Right Leg',
          },
        },
      };

      const result = resolveEffectiveTactics(plan, 'mid');
      expect(result.offTactic).toBe('Decisiveness');
      expect(result.defTactic).toBe('Parry');
      expect(result.target).toBe('Right Arm');
    });

    it('falls back to default plan tactics if phase not provided', () => {
      const plan: FightPlan = {
        style: FightingStyle.StrikingAttack,
        OE: 1,
        AL: 1,
        offensiveTactic: 'Bash',
        defensiveTactic: 'Dodge',
        target: 'Head',
        protect: 'Head',
      };

      const result = resolveEffectiveTactics(plan, 'opening');
      expect(result.offTactic).toBe('Bash');
      expect(result.defTactic).toBe('Dodge');
      expect(result.target).toBe('Head');
    });

    it('falls back to none/Any if neither plan nor phase tactics exist', () => {
      const plan: FightPlan = {
        style: FightingStyle.StrikingAttack,
        OE: 1,
        AL: 1,
        target: 'Head',
        protect: 'Head',
      } as any;

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
