import { describe, it, expect } from 'vitest';
import {
  evaluatePsychState,
  getPsychStateMods,
  handleDesperateState,
} from '@/engine/combat/resolution/psychState';
import { FightingStyle } from '@/types/shared.types';
import type { FighterState, ResolutionContext } from '@/engine/combat/resolution/types';
import { PSYCH_STATE_MODS } from '@/engine/combat/mechanics/conditionEngine';

describe('Psych State Mechanics', () => {
  const defaultFighter: FighterState = {
    label: 'A',
    hp: 100,
    maxHp: 100,
    endurance: 100,
    maxEndurance: 100,
    style: FightingStyle.StrikingAttack,
    commit: 'Standard',
    psychState: 'Neutral',
    desperate: false,
    plan: {
      OE: 1,
      AL: 1,
      offensiveTactic: 'none',
      defensiveTactic: 'none',
      target: 'Chest',
      protect: 'Body',
    },
    activePlan: {
      OE: 1,
      AL: 1,
    },
  } as unknown as FighterState;

  const defaultContext: ResolutionContext = {} as ResolutionContext;

  describe('evaluatePsychState', () => {
    it('generates no events if psych state does not change', () => {
      const fA = { ...defaultFighter };
      const fD = { ...defaultFighter, label: 'D' as const };

      const events = evaluatePsychState(
        fA,
        fD,
        defaultContext,
        { psychState: 'Neutral' },
        { psychState: 'Neutral' }
      );

      expect(events).toHaveLength(0);
      expect(fA.psychState).toBe('Neutral');
      expect(fD.psychState).toBe('Neutral');
    });

    it('updates state and generates event if state changes', () => {
      const fA = { ...defaultFighter };
      const fD = { ...defaultFighter, label: 'D' as const };

      const events = evaluatePsychState(
        fA,
        fD,
        defaultContext,
        { psychState: 'Rattled' },
        { psychState: 'InTheZone' }
      );

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'STATE_CHANGE', actor: 'A', result: 'PSYCH_RATTLED' });
      expect(events[1]).toEqual({ type: 'STATE_CHANGE', actor: 'D', result: 'PSYCH_INTHEZONE' });

      expect(fA.psychState).toBe('Rattled');
      expect(fD.psychState).toBe('InTheZone');
    });
  });

  describe('getPsychStateMods', () => {
    it('returns the correct mods based on fighter psych states', () => {
      const fA = { ...defaultFighter, psychState: 'Rattled' as const } as FighterState;
      const fD = { ...defaultFighter, psychState: 'InTheZone' as const } as FighterState;

      const mods = getPsychStateMods(fA, fD);

      expect(mods.psychA).toEqual(PSYCH_STATE_MODS['Rattled']);
      expect(mods.psychD).toEqual(PSYCH_STATE_MODS['InTheZone']);
    });
  });

  describe('handleDesperateState', () => {
    it('does nothing if not desperate conditions', () => {
      const fA = {
        ...defaultFighter,
        plan: { ...defaultFighter.plan, desperatePlan: { OE: 2, AL: 2 } },
      } as FighterState;
      const fD = { ...defaultFighter, label: 'D' as const } as FighterState;

      const events = handleDesperateState(fA, fD);
      expect(events).toHaveLength(0);
      expect(fA.desperate).toBe(false);
    });

    it('triggers desperate state and updates active plan if hp is low', () => {
      const fA = {
        ...defaultFighter,
        hp: 20, // Low HP trigger
        plan: { ...defaultFighter.plan, desperatePlan: { OE: 3, AL: 3, killDesire: 10 } },
      } as FighterState;
      const fD = { ...defaultFighter, label: 'D' as const } as FighterState;

      const events = handleDesperateState(fA, fD);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'STATE_CHANGE', actor: 'A', result: 'DESPERATE' });
      expect(fA.desperate).toBe(true);
      expect(fA.activePlan.OE).toBe(3);
      expect(fA.activePlan.AL).toBe(3);
      expect(fA.activePlan.killDesire).toBe(10);
    });

    it('triggers desperate state if endurance is low', () => {
      const fA = {
        ...defaultFighter,
        endurance: 10, // Low Endurance trigger
        plan: { ...defaultFighter.plan, desperatePlan: { OE: 0, AL: 0 } },
      } as FighterState;
      const fD = { ...defaultFighter, label: 'D' as const } as FighterState;

      const events = handleDesperateState(fA, fD);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'STATE_CHANGE', actor: 'A', result: 'DESPERATE' });
      expect(fA.desperate).toBe(true);
    });

    it('does not trigger desperate state if already desperate', () => {
      const fA = {
        ...defaultFighter,
        desperate: true,
        hp: 10,
        plan: { ...defaultFighter.plan, desperatePlan: { OE: 0, AL: 0 } },
      } as FighterState;
      const fD = { ...defaultFighter, label: 'D' as const } as FighterState;

      const events = handleDesperateState(fA, fD);
      expect(events).toHaveLength(0);
    });
  });
});
