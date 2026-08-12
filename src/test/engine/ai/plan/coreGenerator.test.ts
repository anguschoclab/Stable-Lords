import { describe, it, expect, vi } from 'vitest';
import { aiPlanForWarrior } from '@/engine/ai/plan/coreGenerator';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { OwnerPersonality } from '@/types/state.types';

// Mocking strategyValidator to avoid full plan validation logic which might alter results
vi.mock('@/engine/ai/plan/strategyValidator', () => ({
  validateAndAdjustPlan: vi.fn((plan) => plan),
}));

describe('coreGenerator', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'w1',
      name: 'Test Warrior',
      style: FightingStyle.StrikingAttack,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      skills: { INI: 10, ATT: 10, DEF: 10, PAR: 10, DMG: 10, DEC: 10, END: 10, HEA: 10 },
      favorites: {},
      ...overrides,
    }) as unknown as Warrior;

  describe('aiPlanForWarrior', () => {
    it('generates a base plan with personality and philosophy modifiers', () => {
      const w = createMockWarrior();
      // StrikingAttack defaults: OE=7, AL=5, KD=7
      // Personality "Aggressive" -> OE +2, AL +1, KD +3
      // Philosophy "Balanced" -> 0
      // intentOE = 0, intentAL = 0, intentKD = 0
      // styleBias StrikingAttack -> OE +1, AL 0
      // total OE = 7+2+0+0 + 1 = 10
      // total AL = 5+1+0+0 + 0 = 6
      // total KD = 7+3+0+0 = 10
      const plan = aiPlanForWarrior(w, 'Aggressive' as OwnerPersonality, 'Balanced');

      expect(plan.OE).toBe(10);
      expect(plan.AL).toBe(6);
      expect(plan.killDesire).toBe(10);
    });

    it('incorporates intent correctly (RECOVERY)', () => {
      const w = createMockWarrior();
      // StrikingAttack defaults: OE=7, AL=5, KD=7
      // Personality "Pragmatic" -> OE +0, AL +0, KD +0
      // Philosophy "Balanced" -> 0
      // Intent RECOVERY -> OE -2, AL -1, KD -2
      // styleBias StrikingAttack -> OE +1, AL 0
      // total OE = 7+0+0-2 + 1 = 6
      // total AL = 5+0+0-1 + 0 = 4
      // total KD = 7+0+0-2 = 5
      const plan = aiPlanForWarrior(
        w,
        'Pragmatic' as OwnerPersonality,
        'Balanced',
        undefined,
        'RECOVERY'
      );

      expect(plan.OE).toBe(6);
      expect(plan.AL).toBe(4);
      expect(plan.killDesire).toBe(5);
    });

    it('incorporates intent correctly (VENDETTA)', () => {
      const w = createMockWarrior();
      // StrikingAttack defaults: OE=7, AL=5, KD=7
      // Intent VENDETTA -> AL +2, KD +2
      // total AL = 5+2 = 7
      // total KD = 7+2 = 9
      const plan = aiPlanForWarrior(
        w,
        'Pragmatic' as OwnerPersonality,
        'Balanced',
        undefined,
        'VENDETTA'
      );

      expect(plan.AL).toBe(7);
      expect(plan.killDesire).toBe(9);
    });

    it('incorporates grudgeIntensity correctly', () => {
      const w = createMockWarrior();
      // StrikingAttack defaults: OE=7, AL=5, KD=7
      // grudgeIntensity 3 -> AL +1, KD +3
      // total AL = 5+1 = 6
      // total KD = 7+3 = 10
      const plan = aiPlanForWarrior(
        w,
        'Pragmatic' as OwnerPersonality,
        'Balanced',
        undefined,
        undefined,
        3
      );

      expect(plan.AL).toBe(6);
      expect(plan.killDesire).toBe(10);
    });

    it('incorporates per-style matchup heuristics', () => {
      const w = createMockWarrior();
      // StrikingAttack defaults: OE=7, AL=5, KD=7
      // opponent is WallOfSteel -> StrikingAttack vs WallOfSteel gives { oe: 2, al: 0, kd: 1 }
      // styleBias StrikingAttack -> OE +1, AL 0
      // total OE = 7+2+1 = 10
      // total KD = 7+1 = 8
      const plan = aiPlanForWarrior(
        w,
        'Pragmatic' as OwnerPersonality,
        'Balanced',
        FightingStyle.WallOfSteel
      );

      expect(plan.OE).toBe(10);
      expect(plan.killDesire).toBe(8);
    });

    it('clamps values correctly and integrates phase/desperate sub-plans', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(
        w,
        'Aggressive' as OwnerPersonality,
        'Brute Force',
        undefined,
        'VENDETTA',
        10
      );

      expect(plan.OE).toBeLessThanOrEqual(10);
      expect(plan.AL).toBeLessThanOrEqual(10);
      expect(plan.killDesire).toBeLessThanOrEqual(10);

      expect(plan.phases).toBeDefined();
      expect(plan.desperatePlan).toBeDefined();
      expect(plan.conditions).toBeDefined();
      // Conditions should include at least the universal endurance threshold (1)
      expect(plan.conditions!.length).toBeGreaterThan(0);
    });

    it('exports getStyleMatchupMods correctly', async () => {
      const { getStyleMatchupMods } = await import('@/engine/ai/plan/coreGenerator');
      expect(typeof getStyleMatchupMods).toBe('function');
    });

    it('removes shield from plan equipment when warrior has a two-handed weapon', () => {
      const w = createMockWarrior({
        equipment: {
          weapon: 'greatsword' as any,
          armor: 'leather' as any,
          shield: 'kite_shield' as any,
          helm: 'none_helm' as any,
        },
      });
      const plan = aiPlanForWarrior(w, 'Pragmatic' as OwnerPersonality, 'Balanced');
      expect(plan.equipment?.shield).toBe('none_shield');
    });

    it('preserves shield when warrior has a one-handed weapon', () => {
      const w = createMockWarrior({
        equipment: {
          weapon: 'broadsword' as any,
          armor: 'leather' as any,
          shield: 'kite_shield' as any,
          helm: 'none_helm' as any,
        },
      });
      const plan = aiPlanForWarrior(w, 'Pragmatic' as OwnerPersonality, 'Balanced');
      // reconcileGearTwoHanded only overrides equipment when there's a conflict;
      // with a one-handed weapon, no override happens so plan.equipment stays undefined
      expect(plan.equipment?.shield).not.toBe('none_shield');
    });

    it('does not crash when warrior has no equipment', () => {
      const w = createMockWarrior();
      expect(() => aiPlanForWarrior(w, 'Pragmatic' as OwnerPersonality, 'Balanced')).not.toThrow();
    });
  });

  describe('fallbackCondition wiring', () => {
    it('Aggressive personality, no intent → fallbackCondition BERZERK', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(w, 'Aggressive' as OwnerPersonality, 'Balanced');
      expect(plan.fallbackCondition).toBe('BERZERK');
    });

    it('Methodical personality, no intent → fallbackCondition TURTLE', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(w, 'Methodical' as OwnerPersonality, 'Balanced');
      expect(plan.fallbackCondition).toBe('TURTLE');
    });

    it('Pragmatic personality, no intent → fallbackCondition FLEE', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(w, 'Pragmatic' as OwnerPersonality, 'Balanced');
      expect(plan.fallbackCondition).toBe('FLEE');
    });

    it('Showman personality, no intent → fallbackCondition None', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(w, 'Showman' as OwnerPersonality, 'Balanced');
      expect(plan.fallbackCondition).toBe('None');
    });

    it('Tactician personality, no intent → fallbackCondition TURTLE', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(w, 'Tactician' as OwnerPersonality, 'Balanced');
      expect(plan.fallbackCondition).toBe('TURTLE');
    });

    it('RECOVERY intent overrides personality → fallbackCondition YIELD', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(
        w,
        'Aggressive' as OwnerPersonality,
        'Balanced',
        undefined,
        'RECOVERY'
      );
      expect(plan.fallbackCondition).toBe('YIELD');
    });

    it('VENDETTA intent overrides personality → fallbackCondition BERZERK', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(
        w,
        'Methodical' as OwnerPersonality,
        'Balanced',
        undefined,
        'VENDETTA'
      );
      expect(plan.fallbackCondition).toBe('BERZERK');
    });

    it('defensive style (TotalParry) with Showman → fallbackCondition TURTLE', () => {
      const w = createMockWarrior({ style: FightingStyle.TotalParry });
      const plan = aiPlanForWarrior(w, 'Showman' as OwnerPersonality, 'Balanced');
      expect(plan.fallbackCondition).toBe('TURTLE');
    });

    it('EXPANSION intent with Aggressive → fallbackCondition BERZERK (falls through to personality)', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(
        w,
        'Aggressive' as OwnerPersonality,
        'Balanced',
        undefined,
        'EXPANSION'
      );
      expect(plan.fallbackCondition).toBe('BERZERK');
    });

    it('fallbackCondition is always set (not undefined) on AI-generated plans', () => {
      const w = createMockWarrior();
      for (const p of ['Aggressive', 'Methodical', 'Showman', 'Pragmatic', 'Tactician'] as const) {
        const plan = aiPlanForWarrior(w, p as OwnerPersonality, 'Balanced');
        expect(plan.fallbackCondition).toBeDefined();
      }
    });

    it('fallbackCondition coexists with desperatePlan — both are defined on the same plan', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(w, 'Aggressive' as OwnerPersonality, 'Balanced');
      expect(plan.fallbackCondition).toBeDefined();
      expect(plan.desperatePlan).toBeDefined();
    });
  });

  describe('fallbackCondition + desperatePlan coexistence', () => {
    it('fallbackCondition is preserved through handleDesperateState spread pattern', () => {
      const w = createMockWarrior();
      const plan = aiPlanForWarrior(w, 'Aggressive' as OwnerPersonality, 'Balanced');

      expect(plan.fallbackCondition).toBe('BERZERK');
      expect(plan.desperatePlan).toBeDefined();

      const dp = plan.desperatePlan!;
      const activePlan = {
        ...plan,
        OE: dp.OE,
        AL: dp.AL,
        phases: undefined,
      };

      expect(activePlan.fallbackCondition).toBe('BERZERK');
    });
  });
});
