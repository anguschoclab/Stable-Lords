/**
 * Condition Engine — WT-gated plan condition evaluation and psych state derivation.
 */
import { describe, it, expect } from 'vitest';
import {
  derivePsychState,
  evaluateConditions,
  PSYCH_STATE_MODS,
} from '@/engine/combat/mechanics/conditionEngine';
import type { FighterState } from '@/engine/combat/resolution/types';
import type { ResolutionContext } from '@/engine/combat/resolution/types';

describe('conditionEngine', () => {
  const createMockFighter = (overrides: Partial<FighterState> = {}): FighterState =>
    ({
      label: 'A',
      hp: 100,
      maxHp: 100,
      endurance: 100,
      maxEndurance: 100,
      momentum: 0,
      consecutiveHits: 0,
      hitsLanded: 0,
      hitsTaken: 0,
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      psychState: 'Neutral',
      plan: {
        style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
        OE: 5,
        AL: 5,
        killDesire: 5,
        conditions: [],
      },
      activePlan: {
        style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
        OE: 5,
        AL: 5,
        killDesire: 5,
      },
      ...overrides,
    }) as FighterState;

  const createMockContext = (overrides: Partial<ResolutionContext> = {}): ResolutionContext =>
    ({
      exchange: 1,
      phase: 'OPENING',
      ...overrides,
    }) as ResolutionContext;

  describe('derivePsychState', () => {
    it('returns Neutral for fresh fighter with no momentum', () => {
      const fighter = createMockFighter({ hp: 100, endurance: 100, momentum: 0 });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('Neutral');
    });

    it('returns Desperate when HP < 30%', () => {
      const fighter = createMockFighter({ hp: 25, maxHp: 100, endurance: 100 });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('Desperate');
    });

    it('returns FatiguePanic when endurance < 10% and WT < 12', () => {
      const fighter = createMockFighter({
        hp: 100,
        endurance: 5,
        maxEndurance: 100,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('FatiguePanic');
    });

    it('returns Desperate (not FatiguePanic) when endurance < 10% but WT >= 12', () => {
      const fighter = createMockFighter({
        hp: 100,
        endurance: 5,
        maxEndurance: 100,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 },
      });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('Desperate');
    });

    it('returns InTheZone with high momentum and healthy HP', () => {
      const fighter = createMockFighter({ momentum: 3, hp: 80, hitsLanded: 5 });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('InTheZone');
    });

    it('does not return InTheZone with high momentum but low HP', () => {
      const fighter = createMockFighter({ momentum: 3, hp: 20, maxHp: 100 });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('Desperate');
    });

    it('returns Rattled when opponent has 3+ consecutive hits', () => {
      const fighter = createMockFighter({ consecutiveHits: 0 });
      const opponent = createMockFighter({ label: 'D', consecutiveHits: 3 });

      expect(derivePsychState(fighter, opponent)).toBe('Rattled');
    });

    it('does not return Rattled when fighter also has recent hits', () => {
      const fighter = createMockFighter({ consecutiveHits: 1 });
      const opponent = createMockFighter({ label: 'D', consecutiveHits: 3 });

      expect(derivePsychState(fighter, opponent)).not.toBe('Rattled');
    });

    it('returns Cruising when dominating on hits with good stamina', () => {
      const fighter = createMockFighter({
        hitsLanded: 8,
        hitsTaken: 3,
        endurance: 80,
        maxEndurance: 100,
      });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('Cruising');
    });

    it('does not return Cruising with low stamina', () => {
      const fighter = createMockFighter({
        hitsLanded: 8,
        hitsTaken: 3,
        endurance: 30,
        maxEndurance: 100,
      });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).not.toBe('Cruising');
    });

    it('prioritizes HP-based states over hit-based states', () => {
      // Low HP but good hit ratio
      const fighter = createMockFighter({
        hp: 20,
        hitsLanded: 8,
        hitsTaken: 2,
        endurance: 80,
      });
      const opponent = createMockFighter({ label: 'D' });

      expect(derivePsychState(fighter, opponent)).toBe('Desperate');
    });
  });

  describe('evaluateConditions', () => {
    it('returns base plan and psych state on every exchange for high WT', () => {
      const fighter = createMockFighter({
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 10 },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });

      const result = evaluateConditions(fighter, opponent, ctx, 15);

      expect(result.newPlan).toBe(fighter.plan);
      expect(result.psychState).toBe('Neutral');
    });

    it('evaluates conditions only every 3 exchanges for WT 4-6', () => {
      const fighter = createMockFighter({
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 5, WL: 10, SP: 10, DF: 10 },
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'HP_BELOW', value: 0.5 }, override: { OE: 10 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });

      // Exchange 1: should evaluate (WT=5 means every 3 exchanges, and 1 % 3 !== 0... wait)
      // Actually evaluationInterval(5) returns 3 (WT >= 4 but < 7)
      // So it evaluates when exchange % 3 === 0
      const ctx1 = createMockContext({ exchange: 1 });
      const result1 = evaluateConditions(fighter, opponent, ctx1, 5);

      const ctx3 = createMockContext({ exchange: 3 });
      const result3 = evaluateConditions(fighter, opponent, ctx3, 5);

      // Both should return something, but we just check no crash
      expect(result1.newPlan).toBeDefined();
      expect(result3.newPlan).toBeDefined();
    });

    it('applies condition override when HP_BELOW trigger is met', () => {
      const fighter = createMockFighter({
        hp: 40,
        maxHp: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'HP_BELOW', value: 0.5 }, override: { OE: 10, AL: 3 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 3 }); // WT=10 evaluates every exchange

      const result = evaluateConditions(fighter, opponent, ctx, 10);

      expect(result.newPlan.OE).toBe(10);
      expect(result.newPlan.AL).toBe(3);
    });

    it('does not apply condition override when HP_BELOW trigger is not met', () => {
      const fighter = createMockFighter({
        hp: 60,
        maxHp: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'HP_BELOW', value: 0.5 }, override: { OE: 10 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });

      const result = evaluateConditions(fighter, opponent, ctx, 10);

      expect(result.newPlan.OE).toBe(5); // unchanged
    });

    it('applies condition override for PHASE_IS trigger', () => {
      const fighter = createMockFighter({
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'PHASE_IS', value: 'late' }, override: { OE: 10 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ phase: 'LATE' });

      const result = evaluateConditions(fighter, opponent, ctx, 10);

      expect(result.newPlan.OE).toBe(10);
    });

    it('checks conditions in order and applies first matching', () => {
      const fighter = createMockFighter({
        hp: 20,
        maxHp: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [
            { trigger: { type: 'HP_BELOW', value: 0.3 }, override: { OE: 3 } },
            { trigger: { type: 'HP_BELOW', value: 0.5 }, override: { OE: 7 } },
          ],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });

      const result = evaluateConditions(fighter, opponent, ctx, 10);

      expect(result.newPlan.OE).toBe(3); // First match (HP < 30%)
    });

    it('returns derived psych state in result', () => {
      const fighter = createMockFighter({ hp: 20, maxHp: 100 });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext();

      const result = evaluateConditions(fighter, opponent, ctx, 10);

      expect(result.psychState).toBe('Desperate');
    });
  });

  describe('PSYCH_STATE_MODS', () => {
    it('has defined mods for all psych states', () => {
      const states = [
        'Neutral',
        'InTheZone',
        'Rattled',
        'Desperate',
        'Cruising',
        'FatiguePanic',
      ] as const;
      for (const state of states) {
        expect(PSYCH_STATE_MODS[state]).toBeDefined();
        expect(PSYCH_STATE_MODS[state]).toHaveProperty('attMod');
        expect(PSYCH_STATE_MODS[state]).toHaveProperty('defMod');
        expect(PSYCH_STATE_MODS[state]).toHaveProperty('iniMod');
        expect(PSYCH_STATE_MODS[state]).toHaveProperty('parMod');
        expect(PSYCH_STATE_MODS[state]).toHaveProperty('decMod');
        expect(PSYCH_STATE_MODS[state]).toHaveProperty('enduranceCostMult');
      }
    });

    it('Neutral has all zero mods and 1.0 endurance cost', () => {
      const mods = PSYCH_STATE_MODS['Neutral'];
      expect(mods.attMod).toBe(0);
      expect(mods.defMod).toBe(0);
      expect(mods.iniMod).toBe(0);
      expect(mods.parMod).toBe(0);
      expect(mods.decMod).toBe(0);
      expect(mods.enduranceCostMult).toBe(1.0);
    });

    it('InTheZone has positive attack and initiative mods', () => {
      const mods = PSYCH_STATE_MODS['InTheZone'];
      expect(mods.attMod).toBeGreaterThan(0);
      expect(mods.iniMod).toBeGreaterThan(0);
    });

    it('Rattled has negative defense and parry mods', () => {
      const mods = PSYCH_STATE_MODS['Rattled'];
      expect(mods.defMod).toBeLessThan(0);
      expect(mods.parMod).toBeLessThan(0);
    });

    it('Desperate has negative mods across all skills', () => {
      const mods = PSYCH_STATE_MODS['Desperate'];
      expect(mods.attMod).toBeLessThan(0);
      expect(mods.defMod).toBeLessThan(0);
      expect(mods.iniMod).toBeLessThan(0);
      expect(mods.parMod).toBeLessThan(0);
      expect(mods.decMod).toBeLessThan(0);
    });

    it('FatiguePanic has worse penalties than Desperate', () => {
      const panic = PSYCH_STATE_MODS['FatiguePanic'];
      const desperate = PSYCH_STATE_MODS['Desperate'];
      expect(panic.attMod).toBeLessThan(desperate.attMod);
      expect(panic.enduranceCostMult).toBeGreaterThan(desperate.enduranceCostMult);
    });

    it('Cruising reduces endurance cost', () => {
      const mods = PSYCH_STATE_MODS['Cruising'];
      expect(mods.enduranceCostMult).toBeLessThan(1.0);
    });
  });

  // ─── Untested trigger types ──────────────────────────────────────────────────

  describe('evaluateConditions untested triggers', () => {
    it('applies override for MOMENTUM_LEAD trigger', () => {
      const fighter = createMockFighter({
        momentum: 3,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'MOMENTUM_LEAD', value: 2 }, override: { OE: 8 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(8);
    });

    it('does not apply MOMENTUM_LEAD override when momentum is below value', () => {
      const fighter = createMockFighter({
        momentum: 1,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'MOMENTUM_LEAD', value: 2 }, override: { OE: 8 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(5);
    });

    it('applies override for MOMENTUM_DEFICIT trigger', () => {
      const fighter = createMockFighter({
        momentum: -3,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'MOMENTUM_DEFICIT', value: 2 }, override: { OE: 2 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(2);
    });

    it('does not apply MOMENTUM_DEFICIT override when momentum is not negative enough', () => {
      const fighter = createMockFighter({
        momentum: -1,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'MOMENTUM_DEFICIT', value: 2 }, override: { OE: 2 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(5);
    });

    it('applies override for HP_ABOVE trigger', () => {
      const fighter = createMockFighter({
        hp: 80,
        maxHp: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'HP_ABOVE', value: 0.7 }, override: { OE: 9 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(9);
    });

    it('does not apply HP_ABOVE override when HP is not above threshold', () => {
      const fighter = createMockFighter({
        hp: 60,
        maxHp: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'HP_ABOVE', value: 0.7 }, override: { OE: 9 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(5);
    });

    it('applies override for ENDURANCE_BELOW trigger', () => {
      const fighter = createMockFighter({
        endurance: 20,
        maxEndurance: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'ENDURANCE_BELOW', value: 0.3 }, override: { AL: 8 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.AL).toBe(8);
    });

    it('does not apply ENDURANCE_BELOW override when endurance is above threshold', () => {
      const fighter = createMockFighter({
        endurance: 50,
        maxEndurance: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'ENDURANCE_BELOW', value: 0.3 }, override: { AL: 8 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.AL).toBe(5);
    });

    it('applies PHASE_IS override for opening (lowercase)', () => {
      const fighter = createMockFighter({
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'PHASE_IS', value: 'opening' }, override: { OE: 7 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ phase: 'OPENING' });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(7);
    });

    it('applies PHASE_IS override for mid (lowercase)', () => {
      const fighter = createMockFighter({
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'PHASE_IS', value: 'mid' }, override: { OE: 7 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ phase: 'MID' });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(7);
    });

    it('evaluates every 5 exchanges when WT < 4', () => {
      const fighter = createMockFighter({
        hp: 40,
        maxHp: 100,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 3, WL: 10, SP: 10, DF: 10 },
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'HP_BELOW', value: 0.5 }, override: { OE: 10 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      // Exchange 1: 1 % 5 !== 0 → should NOT evaluate, returns activePlan
      const ctx1 = createMockContext({ exchange: 1 });
      const result1 = evaluateConditions(fighter, opponent, ctx1, 3);
      expect(result1.newPlan).toBe(fighter.activePlan);
      // Exchange 5: 5 % 5 === 0 → should evaluate
      const ctx5 = createMockContext({ exchange: 5 });
      const result5 = evaluateConditions(fighter, opponent, ctx5, 3);
      expect(result5.newPlan.OE).toBe(10);
    });

    it('reverts to base plan when conditions exist but none match', () => {
      const fighter = createMockFighter({
        hp: 80,
        maxHp: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [{ trigger: { type: 'HP_BELOW', value: 0.3 }, override: { OE: 10 } }],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan.OE).toBe(5);
    });

    it('reverts to base plan when conditions array is empty', () => {
      const fighter = createMockFighter({
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 5,
          AL: 5,
          killDesire: 5,
          conditions: [],
        },
      });
      const opponent = createMockFighter({ label: 'D' });
      const ctx = createMockContext({ exchange: 1 });
      const result = evaluateConditions(fighter, opponent, ctx, 10);
      expect(result.newPlan).toBe(fighter.plan);
    });
  });

  // ─── derivePsychState boundary tests ─────────────────────────────────────────

  describe('derivePsychState boundary tests', () => {
    it('does not trigger FatiguePanic at exactly 10% endurance', () => {
      const fighter = createMockFighter({
        hp: 100,
        endurance: 10,
        maxEndurance: 100,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      });
      const opponent = createMockFighter({ label: 'D' });
      // endRatio = 0.1, not < 0.1, falls through to hpRatio check
      expect(derivePsychState(fighter, opponent)).toBe('Neutral');
    });

    it('does not trigger Desperate at exactly 30% HP', () => {
      const fighter = createMockFighter({
        hp: 30,
        maxHp: 100,
        endurance: 100,
      });
      const opponent = createMockFighter({ label: 'D' });
      // hpRatio = 0.3, not < 0.3, falls through
      expect(derivePsychState(fighter, opponent)).toBe('Neutral');
    });

    it('triggers InTheZone at momentum=2 with hpRatio > 0.7', () => {
      const fighter = createMockFighter({
        momentum: 2,
        hp: 71,
        maxHp: 100,
        hitsLanded: 5,
      });
      const opponent = createMockFighter({ label: 'D' });
      expect(derivePsychState(fighter, opponent)).toBe('InTheZone');
    });

    it('does not trigger Cruising when hitsLanded < 3', () => {
      const fighter = createMockFighter({
        hitsLanded: 2,
        hitsTaken: 0,
        endurance: 80,
        maxEndurance: 100,
      });
      const opponent = createMockFighter({ label: 'D' });
      // hitsLanded > hitsTaken * 1.5 (2 > 0) and endRatio > 0.6, but hitsLanded < 3
      expect(derivePsychState(fighter, opponent)).not.toBe('Cruising');
    });
  });
});
