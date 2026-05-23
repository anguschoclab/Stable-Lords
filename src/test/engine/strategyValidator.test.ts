/**
 * Strategy Validator Tests
 * Comprehensive test coverage for validateStrategy and estimateStaminaCurve
 */
import { describe, it, expect } from 'vitest';
import { validateStrategy, estimateStaminaCurve } from '@/engine/strategyValidator';
import { FightingStyle, type FightPlan } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import crypto from 'crypto';

// Helper function to create mock warrior
function createMockWarrior(style: FightingStyle, wt: number = 10): Warrior {
  return {
    id: crypto.randomUUID() as any,
    name: 'Test Warrior',
    style,
    attributes: {
      ST: 10,
      CN: 10,
      SZ: 10,
      WT: wt,
      WL: 10,
      SP: 10,
      DF: 10,
    },
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    traits: [],
  };
}

// Helper function to create mock fight plan
function createMockFightPlan(style: FightingStyle, oe: number = 5, al: number = 5, killDesire: number = 5): FightPlan {
  return {
    style,
    OE: oe,
    AL: al,
    killDesire,
    target: 'Any',
    protect: 'Any',
  };
}

describe('validateStrategy', () => {
  describe('Global Effort Balance', () => {
    describe('OVER_EXERTION warning', () => {
      it('warns when OE >= 8 AND AL >= 8 (boundary)', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 8);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('OVER_EXERTION');
        expect(warnings[0]?.severity).toBe('warn');
      });

      it('does not warn when OE = 7 AND AL = 8', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 7, 8);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('does not warn when OE = 8 AND AL = 7', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 7);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('warns when OE = 10 AND AL = 10 (extreme)', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('OVER_EXERTION');
      });
    });

    describe('PASSIVE_PLAN warning', () => {
      it('warns when OE <= 3 AND AL <= 3 (boundary)', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 3, 3);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('PASSIVE_PLAN');
        expect(warnings[0]?.severity).toBe('warn');
      });

      it('does not warn when OE = 4 AND AL = 3', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 4, 3);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('does not warn when OE = 3 AND AL = 4', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 3, 4);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('warns when OE = 1 AND AL = 1 (extreme)', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 1, 1);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('PASSIVE_PLAN');
      });
    });

    describe('LETHAL_UNDEFENDED warning', () => {
      it('warns when KD >= 9 AND AL <= 3 (boundary)', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 3, 9);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('LETHAL_UNDEFENDED');
        expect(warnings[0]?.severity).toBe('warn');
      });

      it('does not warn when KD = 8 AND AL = 3', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 3, 8);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('does not warn when KD = 9 AND AL = 4', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 4, 9);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('warns when KD = 10 AND AL = 1 (extreme)', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 1, 10);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('LETHAL_UNDEFENDED');
      });
    });

    describe('Balanced plans (no warnings)', () => {
      it('returns no warnings for OE=5, AL=5, KD=5', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5, 5);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('returns no warnings for OE=7, AL=5, KD=7', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 7, 5, 7);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });
  });

  describe('Style vs Posture Sanity', () => {
    describe('STYLE_MISMATCH_OE warning', () => {
      it('warns for TotalParry with OE >= 8', () => {
        const plan = createMockFightPlan(FightingStyle.TotalParry, 8, 5);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('STYLE_MISMATCH_OE');
        expect(warnings[0]?.severity).toBe('warn');
      });

      it('does not warn for TotalParry with OE = 7', () => {
        const plan = createMockFightPlan(FightingStyle.TotalParry, 7, 5);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('warns for WallOfSteel with OE >= 8', () => {
        const plan = createMockFightPlan(FightingStyle.WallOfSteel, 8, 5);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('STYLE_MISMATCH_OE');
      });

      it('does not warn for WallOfSteel with OE = 7', () => {
        const plan = createMockFightPlan(FightingStyle.WallOfSteel, 7, 5);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('does not warn for other styles with OE = 8', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 5);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('STYLE_MISMATCH_AL info', () => {
      it('returns info for BashingAttack with AL >= 8', () => {
        const plan = createMockFightPlan(FightingStyle.BashingAttack, 5, 8);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('STYLE_MISMATCH_AL');
        expect(warnings[0]?.severity).toBe('info');
      });

      it('does not warn for BashingAttack with AL = 7', () => {
        const plan = createMockFightPlan(FightingStyle.BashingAttack, 5, 7);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('does not warn for other styles with AL = 8', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 8);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('Compatible style/effort combinations', () => {
      it('no STYLE_MISMATCH warning for TotalParry with OE=2, AL=2', () => {
        const plan = createMockFightPlan(FightingStyle.TotalParry, 2, 2);
        const warnings = validateStrategy(plan);
        // Will have PASSIVE_PLAN warning but not STYLE_MISMATCH
        const codes = warnings.map((w) => w.code);
        expect(codes).not.toContain('STYLE_MISMATCH_OE');
      });

      it('no warning for BashingAttack with OE=7, AL=3', () => {
        const plan = createMockFightPlan(FightingStyle.BashingAttack, 7, 3);
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });
  });

  describe('Attribute Fit (requires warrior parameter)', () => {
    describe('WT_TOO_LOW_FOR_EFFORT warning', () => {
      it('warns when WT < 10 AND OE + AL >= 16', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 9);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 8);
        const warnings = validateStrategy(plan, warrior);
        // Will have both OVER_EXERTION and WT_TOO_LOW_FOR_EFFORT
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('WT_TOO_LOW_FOR_EFFORT');
        expect(codes).toContain('OVER_EXERTION');
      });

      it('warns when WT=9, OE=7, AL=9', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 9);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 7, 9);
        const warnings = validateStrategy(plan, warrior);
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('WT_TOO_LOW_FOR_EFFORT');
      });

      it('does not warn when WT=9, OE=5, AL=5', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 9);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
        const warnings = validateStrategy(plan, warrior);
        expect(warnings).toHaveLength(0);
      });

      it('does not warn WT when WT=10, OE=8, AL=8 (boundary)', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 10);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 8);
        const warnings = validateStrategy(plan, warrior);
        // Will have OVER_EXERTION but not WT_TOO_LOW_FOR_EFFORT
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('OVER_EXERTION');
        expect(codes).not.toContain('WT_TOO_LOW_FOR_EFFORT');
      });

      it('warns when WT=8, OE=8, AL=8', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 8);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 8);
        const warnings = validateStrategy(plan, warrior);
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('WT_TOO_LOW_FOR_EFFORT');
        expect(codes).toContain('OVER_EXERTION');
      });

      it('warns when WT=3, OE=10, AL=10', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 3);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
        const warnings = validateStrategy(plan, warrior);
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('WT_TOO_LOW_FOR_EFFORT');
        expect(codes).toContain('OVER_EXERTION');
      });
    });

    describe('High WT warriors with high effort', () => {
      it('no WT warning when WT=15, OE=8, AL=8', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 15);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 8);
        const warnings = validateStrategy(plan, warrior);
        // Will have OVER_EXERTION but not WT_TOO_LOW_FOR_EFFORT
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('OVER_EXERTION');
        expect(codes).not.toContain('WT_TOO_LOW_FOR_EFFORT');
      });

      it('no WT warning when WT=25, OE=10, AL=10', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 25);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
        const warnings = validateStrategy(plan, warrior);
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('OVER_EXERTION');
        expect(codes).not.toContain('WT_TOO_LOW_FOR_EFFORT');
      });
    });

    describe('Low WT warriors with low effort', () => {
      it('no WT warning when WT=5, OE=3, AL=3', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 5);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 3, 3);
        const warnings = validateStrategy(plan, warrior);
        // Will have PASSIVE_PLAN but not WT_TOO_LOW_FOR_EFFORT
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('PASSIVE_PLAN');
        expect(codes).not.toContain('WT_TOO_LOW_FOR_EFFORT');
      });

      it('no WT warning when WT=3, OE=1, AL=1', () => {
        const warrior = createMockWarrior(FightingStyle.StrikingAttack, 3);
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 1, 1);
        const warnings = validateStrategy(plan, warrior);
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('PASSIVE_PLAN');
        expect(codes).not.toContain('WT_TOO_LOW_FOR_EFFORT');
      });
    });

    describe('Without warrior parameter', () => {
      it('no WT warning when warrior not provided', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
        const warnings = validateStrategy(plan);
        // Will have OVER_EXERTION but not WT_TOO_LOW_FOR_EFFORT
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('OVER_EXERTION');
        expect(codes).not.toContain('WT_TOO_LOW_FOR_EFFORT');
      });
    });

    describe('Warrior without attributes', () => {
      it('no WT warning when warrior has no attributes', () => {
        const warrior: Partial<Warrior> = {
          id: crypto.randomUUID() as any,
          name: 'Test Warrior',
          style: FightingStyle.StrikingAttack,
          fame: 0,
          popularity: 0,
          titles: [],
          injuries: [],
          flair: [],
          career: { wins: 0, losses: 0, kills: 0 },
          champion: false,
          status: 'Active',
          traits: [],
        };
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
        const warnings = validateStrategy(plan, warrior as Warrior);
        // Will have OVER_EXERTION but not WT_TOO_LOW_FOR_EFFORT (skipped due to no attributes)
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('OVER_EXERTION');
        expect(codes).not.toContain('WT_TOO_LOW_FOR_EFFORT');
      });
    });
  });

  describe('Per-Phase Saturation', () => {
    describe('PHASE_OPENING_SATURATED warning', () => {
      it('warns when opening phase OE >= 10 AND AL >= 10', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            opening: { OE: 10, AL: 10, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('PHASE_OPENING_SATURATED');
      });

      it('does not warn when opening phase OE=9, AL=10', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            opening: { OE: 9, AL: 10, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('does not warn when opening phase OE=10, AL=9', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            opening: { OE: 10, AL: 9, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('PHASE_MID_SATURATED warning', () => {
      it('warns when mid phase OE >= 10 AND AL >= 10', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            mid: { OE: 10, AL: 10, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('PHASE_MID_SATURATED');
      });

      it('does not warn when mid phase OE=9, AL=10', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            mid: { OE: 9, AL: 10, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('PHASE_LATE_SATURATED warning', () => {
      it('warns when late phase OE >= 10 AND AL >= 10', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            late: { OE: 10, AL: 10, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]?.code).toBe('PHASE_LATE_SATURATED');
      });

      it('does not warn when late phase OE=10, AL=9', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            late: { OE: 10, AL: 9, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('Valid phase configurations', () => {
      it('no warning for opening phase OE=5, AL=5', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            opening: { OE: 5, AL: 5, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('no warning for mid phase OE=7, AL=7', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            mid: { OE: 7, AL: 7, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('no warning for late phase OE=8, AL=8', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            late: { OE: 8, AL: 8, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('Missing phases', () => {
      it('no warning when only opening phase defined', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            opening: { OE: 5, AL: 5, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });

      it('no warning for empty phases object', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {},
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('Multiple phase warnings', () => {
      it('warns when all three phases are saturated', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {
            opening: { OE: 10, AL: 10, killDesire: 5 },
            mid: { OE: 10, AL: 10, killDesire: 5 },
            late: { OE: 10, AL: 10, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(3);
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('PHASE_OPENING_SATURATED');
        expect(codes).toContain('PHASE_MID_SATURATED');
        expect(codes).toContain('PHASE_LATE_SATURATED');
      });
    });
  });

  describe('Edge Cases', () => {
    describe('Missing optional fields', () => {
      it('defaults OE to 5 when not provided', () => {
        const plan: Partial<FightPlan> = {
          style: FightingStyle.StrikingAttack,
          AL: 5,
        };
        const warnings = validateStrategy(plan as FightPlan);
        expect(warnings).toHaveLength(0);
      });

      it('defaults AL to 5 when not provided', () => {
        const plan: Partial<FightPlan> = {
          style: FightingStyle.StrikingAttack,
          OE: 5,
        };
        const warnings = validateStrategy(plan as FightPlan);
        expect(warnings).toHaveLength(0);
      });

      it('defaults killDesire to 5 when not provided', () => {
        const plan: Partial<FightPlan> = {
          style: FightingStyle.StrikingAttack,
          OE: 5,
          AL: 5,
        };
        const warnings = validateStrategy(plan as FightPlan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('Empty phases object', () => {
      it('no warnings for empty phases object', () => {
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
          phases: {},
        };
        const warnings = validateStrategy(plan);
        expect(warnings).toHaveLength(0);
      });
    });

    describe('Multiple warnings from same plan', () => {
      it('returns multiple warnings when plan has multiple issues', () => {
        const warrior = createMockWarrior(FightingStyle.TotalParry, 8);
        const plan: FightPlan = {
          ...createMockFightPlan(FightingStyle.TotalParry, 8, 8),
          phases: {
            opening: { OE: 10, AL: 10, killDesire: 5 },
          },
        };
        const warnings = validateStrategy(plan, warrior);
        expect(warnings.length).toBeGreaterThan(1);
        const codes = warnings.map((w) => w.code);
        expect(codes).toContain('OVER_EXERTION');
        expect(codes).toContain('STYLE_MISMATCH_OE');
        expect(codes).toContain('WT_TOO_LOW_FOR_EFFORT');
        expect(codes).toContain('PHASE_OPENING_SATURATED');
      });
    });

    describe('Return type validation', () => {
      it('returns array of StrategyWarning objects', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 8, 8);
        const warnings = validateStrategy(plan);
        expect(Array.isArray(warnings)).toBe(true);
        if (warnings.length > 0) {
          expect(warnings[0]).toHaveProperty('code');
          expect(warnings[0]).toHaveProperty('severity');
          expect(warnings[0]).toHaveProperty('message');
        }
      });

      it('returns empty array when no warnings', () => {
        const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
        const warnings = validateStrategy(plan);
        expect(warnings).toEqual([]);
      });
    });
  });
});

describe('estimateStaminaCurve', () => {
  describe('Basic Functionality', () => {
    it('returns array of length minutes + 1', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan);
      expect(curve).toHaveLength(21); // 20 minutes + initial value
    });

    it('initial value = 50 + WT * 2', () => {
      const warrior = createMockWarrior(FightingStyle.StrikingAttack, 10);
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan, warrior);
      expect(curve[0]).toBe(70); // 50 + 10 * 2
    });

    it('values never go below 0', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
      const curve = estimateStaminaCurve(plan);
      curve.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('WT (Wit) Impact', () => {
    it('WT=3: max = 56', () => {
      const warrior = createMockWarrior(FightingStyle.StrikingAttack, 3);
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan, warrior);
      expect(curve[0]).toBe(56); // 50 + 3 * 2
    });

    it('WT=10: max = 70', () => {
      const warrior = createMockWarrior(FightingStyle.StrikingAttack, 10);
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan, warrior);
      expect(curve[0]).toBe(70); // 50 + 10 * 2
    });

    it('WT=25: max = 100', () => {
      const warrior = createMockWarrior(FightingStyle.StrikingAttack, 25);
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan, warrior);
      expect(curve[0]).toBe(100); // 50 + 25 * 2
    });

    it('higher WT reduces burn rate', () => {
      const warriorLow = createMockWarrior(FightingStyle.StrikingAttack, 5);
      const warriorHigh = createMockWarrior(FightingStyle.StrikingAttack, 15);
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curveLow = estimateStaminaCurve(plan, warriorLow);
      const curveHigh = estimateStaminaCurve(plan, warriorHigh);
      // Higher WT should have higher final stamina (slower burn)
      expect(curveHigh[curveHigh.length - 1] ?? 0).toBeGreaterThan(curveLow[curveLow.length - 1] ?? 0);
    });
  });

  describe('Effort Impact', () => {
    it('higher effort = faster stamina depletion', () => {
      const planLow = createMockFightPlan(FightingStyle.StrikingAttack, 1, 1);
      const planHigh = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
      const curveLow = estimateStaminaCurve(planLow);
      const curveHigh = estimateStaminaCurve(planHigh);
      // Higher effort should have lower final stamina
      expect(curveHigh[curveHigh.length - 1] ?? 0).toBeLessThan(curveLow[curveLow.length - 1] ?? 0);
    });

    it('OE=5, AL=5: baseline burn', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan);
      expect(curve[0]).toBe(70); // default WT=10
      expect(curve[curve.length - 1]).toBeGreaterThan(0);
    });

    it('OE=10, AL=10: maximum burn', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
      const curve = estimateStaminaCurve(plan);
      expect(curve[0]).toBe(70); // default WT=10
      // Should deplete faster than baseline
      const baseline = estimateStaminaCurve(createMockFightPlan(FightingStyle.StrikingAttack, 5, 5));
      expect(curve[curve.length - 1] ?? 0).toBeLessThan(baseline[baseline.length - 1] ?? 0);
    });

    it('OE=1, AL=1: minimum burn', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 1, 1);
      const curve = estimateStaminaCurve(plan);
      expect(curve[0]).toBe(70); // default WT=10
      // Should deplete slower than baseline
      const baseline = estimateStaminaCurve(createMockFightPlan(FightingStyle.StrikingAttack, 5, 5));
      expect(curve[curve.length - 1] ?? 0).toBeGreaterThan(baseline[baseline.length - 1] ?? 0);
    });
  });

  describe('Phase Overrides', () => {
    it('opening phase (minutes 1-5) uses phase OE/AL if defined', () => {
      const plan: FightPlan = {
        ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
        phases: {
          opening: { OE: 10, AL: 10, killDesire: 5 },
        },
      };
      const curve = estimateStaminaCurve(plan);
      // First few minutes should deplete faster due to high opening phase effort
      const baseline = estimateStaminaCurve(createMockFightPlan(FightingStyle.StrikingAttack, 5, 5));
      expect(curve[5] ?? 0).toBeLessThan(baseline[5] ?? 0);
    });

    it('mid phase (minutes 6-14) uses phase OE/AL if defined', () => {
      const plan: FightPlan = {
        ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
        phases: {
          mid: { OE: 10, AL: 10, killDesire: 5 },
        },
      };
      const curve = estimateStaminaCurve(plan);
      // Minutes 6-14 should deplete faster
      const baseline = estimateStaminaCurve(createMockFightPlan(FightingStyle.StrikingAttack, 5, 5));
      expect(curve[14] ?? 0).toBeLessThan(baseline[14] ?? 0);
    });

    it('late phase (minutes 15-20) uses phase OE/AL if defined', () => {
      const plan: FightPlan = {
        ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
        phases: {
          late: { OE: 10, AL: 10, killDesire: 5 },
        },
      };
      const curve = estimateStaminaCurve(plan);
      // Minutes 15-20 should deplete faster
      const baseline = estimateStaminaCurve(createMockFightPlan(FightingStyle.StrikingAttack, 5, 5));
      expect(curve[20] ?? 0).toBeLessThan(baseline[20] ?? 0);
    });

    it('falls back to plan OE/AL if phase not defined', () => {
      const plan: FightPlan = {
        ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
        phases: {
          opening: { OE: 10, AL: 10, killDesire: 5 },
        },
      };
      const curve = estimateStaminaCurve(plan);
      // After opening phase, should use plan OE/AL (5, 5) - depletion rate slows but continues
      // The curve should continue decreasing, just at a slower rate
      expect(curve[6] ?? 0).toBeLessThan(curve[5] ?? 0); // Still depleting
      // But the depletion from minute 5 to 6 should be less than from minute 4 to 5
      const drop5to6 = (curve[5] ?? 0) - (curve[6] ?? 0);
      const drop4to5 = (curve[4] ?? 0) - (curve[5] ?? 0);
      expect(drop5to6).toBeLessThan(drop4to5);
    });

    it('all three phases with different values', () => {
      const plan: FightPlan = {
        ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
        phases: {
          opening: { OE: 10, AL: 10, killDesire: 5 },
          mid: { OE: 1, AL: 1, killDesire: 5 },
          late: { OE: 5, AL: 5, killDesire: 5 },
        },
      };
      const curve = estimateStaminaCurve(plan);
      // Should have different depletion rates in each phase
      expect(curve[5] ?? 0).toBeLessThan(curve[0] ?? 0); // Opening depletes fast
      // Mid phase depletes very slowly, so the drop from minute 5 to 14 should be small
      const drop5to14 = (curve[5] ?? 0) - (curve[14] ?? 0);
      const drop0to5 = (curve[0] ?? 0) - (curve[5] ?? 0);
      expect(drop5to14).toBeLessThan(drop0to5); // Mid depletes slower than opening
    });
  });

  describe('Edge Cases', () => {
    it('no warrior parameter (WT defaults to 10)', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan);
      expect(curve[0]).toBe(70); // 50 + 10 * 2
    });

    it('warrior without attributes (WT defaults to 10)', () => {
      const warrior: Partial<Warrior> = {
        id: crypto.randomUUID() as any,
        name: 'Test Warrior',
        style: FightingStyle.StrikingAttack,
        fame: 0,
        popularity: 0,
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: 0, losses: 0, kills: 0 },
        champion: false,
        status: 'Active',
        traits: [],
      };
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan, warrior as Warrior);
      expect(curve[0]).toBe(70); // 50 + 10 * 2
    });

    it('empty phases object (uses plan OE/AL)', () => {
      const plan: FightPlan = {
        ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
        phases: {},
      };
      const curve = estimateStaminaCurve(plan);
      const baseline = estimateStaminaCurve(createMockFightPlan(FightingStyle.StrikingAttack, 5, 5));
      expect(curve).toEqual(baseline);
    });

    it('partial phases (only some phases defined)', () => {
      const plan: FightPlan = {
        ...createMockFightPlan(FightingStyle.StrikingAttack, 5, 5),
        phases: {
          opening: { OE: 10, AL: 10, killDesire: 5 },
        },
      };
      const curve = estimateStaminaCurve(plan);
      // Should not throw error
      expect(curve).toHaveLength(21);
    });

    it('custom minutes parameter', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve = estimateStaminaCurve(plan, undefined, 10);
      expect(curve).toHaveLength(11); // 10 minutes + initial value
    });

    it('stamina reaches 0 before end (clamped at 0)', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 10, 10);
      const curve = estimateStaminaCurve(plan);
      // With max effort, stamina should hit 0
      const min = Math.min(...curve);
      expect(min).toBe(0);
    });
  });

  describe('Determinism', () => {
    it('same inputs always produce same output', () => {
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve1 = estimateStaminaCurve(plan);
      const curve2 = estimateStaminaCurve(plan);
      expect(curve1).toEqual(curve2);
    });

    it('same inputs with warrior always produce same output', () => {
      const warrior = createMockWarrior(FightingStyle.StrikingAttack, 15);
      const plan = createMockFightPlan(FightingStyle.StrikingAttack, 5, 5);
      const curve1 = estimateStaminaCurve(plan, warrior);
      const curve2 = estimateStaminaCurve(plan, warrior);
      expect(curve1).toEqual(curve2);
    });
  });
});
