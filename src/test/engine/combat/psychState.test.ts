/**
 * Psych State — psychological state evaluation and desperate state handling.
 */
import { describe, it, expect } from 'vitest';
import {
  evaluatePsychState,
  getPsychStateMods,
  handleDesperateState,
} from '@/engine/combat/resolution/psychState';
import type { FighterState } from '@/engine/combat/resolution/types';

describe('psychState', () => {
  const createMockFighter = (overrides: Partial<FighterState> = {}): FighterState =>
    ({
      label: 'A',
      style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
      skills: { ATT: 10, PAR: 10, DEF: 10, INI: 10, RIP: 10, DEC: 10 },
      hp: 100,
      maxHp: 100,
      endurance: 100,
      maxEndurance: 100,
      psychState: 'Neutral',
      momentum: 0,
      consecutiveHits: 0,
      hitsLanded: 0,
      hitsTaken: 0,
      plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 5, AL: 5, killDesire: 5 },
      activePlan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 5, AL: 5, killDesire: 5 },
      desperate: false,
      ...overrides,
    }) as FighterState;

  describe('evaluatePsychState', () => {
    it('emits no events when psych state is Neutral', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, { exchange: 1, phase: 'OPENING' } as any, { psychState: 'Neutral' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(0);
    });

    it('emits STATE_CHANGE event when fighter enters InTheZone', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'InTheZone' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('STATE_CHANGE');
      expect(events[0]!.actor).toBe('A');
      expect(events[0]!.result).toBe('PSYCH_INTHEZONE');
    });

    it('emits STATE_CHANGE event when fighter enters Rattled', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'Rattled' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(1);
      expect(events[0]!.result).toBe('PSYCH_RATTLED');
    });

    it('emits STATE_CHANGE event when fighter enters Desperate', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'Desperate' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(1);
      expect(events[0]!.result).toBe('PSYCH_DESPERATE');
    });

    it('emits STATE_CHANGE event when fighter enters Cruising', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'Cruising' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(1);
      expect(events[0]!.result).toBe('PSYCH_CRUISING');
    });

    it('emits STATE_CHANGE event when fighter enters FatiguePanic', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'FatiguePanic' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(1);
      expect(events[0]!.result).toBe('PSYCH_FATIGUEPANIC');
    });

    it('emits no event when state changes to Neutral', () => {
      const fA = createMockFighter({ psychState: 'Desperate' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'Neutral' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(0);
    });

    it('emits events for both fighters when both change state', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D', psychState: 'Neutral' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'Desperate' }, { psychState: 'InTheZone' });

      expect(events).toHaveLength(2);
      expect(events.some((e) => e.actor === 'A' && e.result === 'PSYCH_DESPERATE')).toBe(true);
      expect(events.some((e) => e.actor === 'D' && e.result === 'PSYCH_INTHEZONE')).toBe(true);
    });

    it('updates fighter psychState property', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D' });

      evaluatePsychState(fA, fD, {} as any, { psychState: 'Desperate' }, { psychState: 'Neutral' });

      expect(fA.psychState).toBe('Desperate');
    });

    it('does not emit event when state unchanged', () => {
      const fA = createMockFighter({ psychState: 'Desperate' });
      const fD = createMockFighter({ label: 'D' });

      const events = evaluatePsychState(fA, fD, {} as any, { psychState: 'Desperate' }, { psychState: 'Neutral' });

      expect(events).toHaveLength(0);
    });
  });

  describe('getPsychStateMods', () => {
    it('returns neutral mods for both fighters', () => {
      const fA = createMockFighter({ psychState: 'Neutral' });
      const fD = createMockFighter({ label: 'D', psychState: 'Neutral' });

      const mods = getPsychStateMods(fA, fD);

      expect(mods.psychA.attMod).toBe(0);
      expect(mods.psychA.defMod).toBe(0);
      expect(mods.psychD.attMod).toBe(0);
      expect(mods.psychD.defMod).toBe(0);
    });

    it('returns InTheZone bonuses for fighter A', () => {
      const fA = createMockFighter({ psychState: 'InTheZone' });
      const fD = createMockFighter({ label: 'D' });

      const mods = getPsychStateMods(fA, fD);

      expect(mods.psychA.attMod).toBeGreaterThan(0);
      expect(mods.psychA.iniMod).toBeGreaterThan(0);
    });

    it('returns Rattled penalties for fighter A', () => {
      const fA = createMockFighter({ psychState: 'Rattled' });
      const fD = createMockFighter({ label: 'D' });

      const mods = getPsychStateMods(fA, fD);

      expect(mods.psychA.defMod).toBeLessThan(0);
      expect(mods.psychA.parMod).toBeLessThan(0);
    });

    it('returns Desperate penalties for fighter A', () => {
      const fA = createMockFighter({ psychState: 'Desperate' });
      const fD = createMockFighter({ label: 'D' });

      const mods = getPsychStateMods(fA, fD);

      expect(mods.psychA.attMod).toBeLessThan(0);
      expect(mods.psychA.defMod).toBeLessThan(0);
      expect(mods.psychA.decMod).toBeLessThan(0);
    });

    it('returns Cruising endurance reduction', () => {
      const fA = createMockFighter({ psychState: 'Cruising' });
      const fD = createMockFighter({ label: 'D' });

      const mods = getPsychStateMods(fA, fD);

      expect(mods.psychA.enduranceCostMult).toBeLessThan(1);
    });

    it('returns FatiguePanic severe penalties', () => {
      const fA = createMockFighter({ psychState: 'FatiguePanic' });
      const fD = createMockFighter({ label: 'D' });

      const mods = getPsychStateMods(fA, fD);

      expect(mods.psychA.attMod).toBeLessThan(mods.psychD.attMod);
      expect(mods.psychA.enduranceCostMult).toBeGreaterThan(1);
    });
  });

  describe('handleDesperateState', () => {
    it('returns empty events when no fighter is desperate', () => {
      const fA = createMockFighter({ hp: 100, maxHp: 100, endurance: 100, maxEndurance: 100 });
      const fD = createMockFighter({ label: 'D', hp: 100, maxHp: 100, endurance: 100, maxEndurance: 100 });

      const events = handleDesperateState(fA, fD);

      expect(events).toHaveLength(0);
    });

    it('triggers desperate mode when HP < 30% with FLEE fallback', () => {
      const fA = createMockFighter({
        hp: 25,
        maxHp: 100,
        plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, fallbackCondition: 'FLEE', desperatePlan: { OE: 3, AL: 3 } },
        desperate: false,
      });
      const fD = createMockFighter({ label: 'D' });

      const events = handleDesperateState(fA, fD);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]!.type).toBe('STATE_CHANGE');
      expect(fA.desperate).toBe(true);
    });

    it('triggers desperate mode when endurance < 20% with TURTLE fallback', () => {
      const fA = createMockFighter({
        hp: 100,
        maxHp: 100,
        endurance: 15,
        maxEndurance: 100,
        plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, fallbackCondition: 'TURTLE', desperatePlan: { OE: 3, AL: 3 } },
        desperate: false,
      });
      const fD = createMockFighter({ label: 'D' });

      const events = handleDesperateState(fA, fD);

      expect(events.length).toBeGreaterThan(0);
      expect(fA.desperate).toBe(true);
    });

    it('triggers desperate mode with BERZERK fallback', () => {
      const fA = createMockFighter({
        hp: 25,
        maxHp: 100,
        plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, fallbackCondition: 'BERZERK', desperatePlan: { OE: 10, AL: 9, killDesire: 10 } },
        desperate: false,
      });
      const fD = createMockFighter({ label: 'D' });

      const events = handleDesperateState(fA, fD);

      expect(events.length).toBeGreaterThan(0);
      expect(fA.desperate).toBe(true);
      expect(fA.activePlan.OE).toBe(10);
      expect(fA.activePlan.AL).toBe(9);
    });

    it('does not trigger desperate mode when already desperate', () => {
      const fA = createMockFighter({
        hp: 25,
        maxHp: 100,
        plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, fallbackCondition: 'FLEE', desperatePlan: { OE: 3, AL: 3 } },
        desperate: true,
      });
      const fD = createMockFighter({ label: 'D' });

      const events = handleDesperateState(fA, fD);

      expect(events).toHaveLength(0);
    });

    it('does not trigger without desperatePlan', () => {
      const fA = createMockFighter({
        hp: 25,
        maxHp: 100,
        plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, fallbackCondition: 'FLEE' },
        desperate: false,
      });
      const fD = createMockFighter({ label: 'D' });

      const events = handleDesperateState(fA, fD);

      expect(events).toHaveLength(0);
      expect(fA.desperate).toBe(false);
    });

    it('triggers for both fighters when both meet conditions', () => {
      const fA = createMockFighter({
        hp: 25,
        maxHp: 100,
        plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, fallbackCondition: 'FLEE', desperatePlan: { OE: 3, AL: 3 } },
        desperate: false,
      });
      const fD = createMockFighter({
        label: 'D',
        hp: 20,
        maxHp: 100,
        plan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, fallbackCondition: 'FLEE', desperatePlan: { OE: 3, AL: 3 } },
        desperate: false,
      });

      const events = handleDesperateState(fA, fD);

      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(fA.desperate).toBe(true);
      expect(fD.desperate).toBe(true);
    });

    it('applies desperatePlan overrides to activePlan', () => {
      const fA = createMockFighter({
        hp: 25,
        maxHp: 100,
        plan: {
          style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle,
          OE: 7,
          AL: 7,
          killDesire: 5,
          target: 'Head',
          fallbackCondition: 'FLEE',
          desperatePlan: { OE: 3, AL: 3, killDesire: 1, target: 'Any', offensiveTactic: 'Lunge' },
        },
        activePlan: { style: 'StrikingAttack' as import('@/types/shared.types').FightingStyle, OE: 7, AL: 7, killDesire: 5, target: 'Head' },
        desperate: false,
      });
      const fD = createMockFighter({ label: 'D' });

      handleDesperateState(fA, fD);

      expect(fA.activePlan.OE).toBe(3);
      expect(fA.activePlan.AL).toBe(3);
      expect(fA.activePlan.killDesire).toBe(1);
      expect(fA.activePlan.target).toBe('Any');
    });
  });
});
