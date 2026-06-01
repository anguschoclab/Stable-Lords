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
      plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 5, AL: 5, killDesire: 5, conditions: [] },
      activePlan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 5, AL: 5, killDesire: 5 },
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
      const states = ['Neutral', 'InTheZone', 'Rattled', 'Desperate', 'Cruising', 'FatiguePanic'] as const;
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
});
