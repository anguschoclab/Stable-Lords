/**
 * Injury Handler — bout injury processing and rest state management.
 */
import { describe, it, expect } from 'vitest';
import { handleInjuries } from '@/engine/bout/injuryHandler';
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';

describe('injuryHandler', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'warrior-a' as import('@/types/shared.types').WarriorId,
      name: 'Warrior A',
      injuries: [],
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      ...overrides,
    }) as Warrior;

  const createMockState = (): GameState =>
    ({
      week: 1,
      roster: [],
      restStates: [],
      rivalMap: new Map(),
      warriorToStableMap: new Map(),
    }) as unknown as GameState;

  describe('handleInjuries', () => {
    it('returns no injuries for non-KO outcome without injuries', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'A',
        by: 'Kill',
        minutes: 5,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 1);

      expect(result.injured).toBe(false);
      expect(result.injuredNames).toHaveLength(0);
      expect(result.impact.rosterUpdates?.size).toBe(0);
    });

    it('adds rest state for KO victim in impact', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'A',
        by: 'KO',
        minutes: 5,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 1);

      expect(result.impact.restStates?.length).toBeGreaterThan(0);
    });

    it('adds rest state for D when A wins by KO', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'A',
        by: 'KO',
        minutes: 5,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 5);

      // D should get rest state
      const restStates = result.impact.restStates || [];
      const dRestState = restStates.find((r: { warriorId: string }) => r.warriorId === 'warrior-d');
      expect(dRestState).toBeDefined();
    });

    it('adds rest state for A when D wins by KO', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'D',
        by: 'KO',
        minutes: 5,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 3);

      // A should get rest state
      const restStates = result.impact.restStates || [];
      const aRestState = restStates.find((r: { warriorId: string }) => r.warriorId === 'warrior-a');
      expect(aRestState).toBeDefined();
    });

    it('returns impact with proper structure', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'A',
        by: 'KO',
        minutes: 5,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 1);

      expect(result).toHaveProperty('impact');
      expect(result).toHaveProperty('injured');
      expect(result).toHaveProperty('injuredNames');
      expect(result.impact).toHaveProperty('restStates');
      expect(result.impact).toHaveProperty('rosterUpdates');
      expect(result.impact).toHaveProperty('rivalsUpdates');
    });

    it('handles Draw outcome (no KO, no winner)', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: null,
        by: 'Draw',
        minutes: 15,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 1);

      expect(result.injured).toBe(false);
      expect(result.injuredNames).toHaveLength(0);
    });

    it('handles Exhaustion outcome', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'A',
        by: 'Exhaustion',
        minutes: 20,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 1);

      // Exhaustion may or may not generate injuries depending on implementation
      expect(result).toHaveProperty('injured');
      expect(result).toHaveProperty('injuredNames');
    });

    it('handles Stoppage outcome', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'A',
        by: 'Stoppage',
        minutes: 15,
        log: [],
      };

      const result = handleInjuries(s, wA, wD, outcome, 1);

      expect(result).toHaveProperty('injured');
      expect(result).toHaveProperty('injuredNames');
    });

    it('passes seed to injury generation', () => {
      const s = createMockState();
      const wA = createMockWarrior();
      const wD = createMockWarrior({
        id: 'warrior-d' as import('@/types/shared.types').WarriorId,
        name: 'Warrior D',
      });
      const outcome: FightOutcome = {
        winner: 'A',
        by: 'Kill',
        minutes: 10,
        log: [],
      };

      // Should not throw when seed is provided
      expect(() => handleInjuries(s, wA, wD, outcome, 1, undefined, 12345)).not.toThrow();
    });
  });
});
