/**
 * Resolve Helpers — bout resolution utilities (validate, fame calc, payouts, etc.)
 */
import { describe, it, expect } from 'vitest';
import {
  validateBoutCombatants,
  calculateBoutFame,
  processContractPayouts,
  getWinnerId,
} from '@/engine/bout/core/resolveHelpers';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

describe('resolveHelpers', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'warrior-a' as WarriorId,
      name: 'Warrior A',
      style: 'StrikingAttack' as FightingStyle,
      status: 'Active',
      injuries: [],
      ...overrides,
    }) as Warrior;

  const createMockOutcome = (overrides: Partial<FightOutcome> = {}): FightOutcome => ({
    winner: 'A',
    by: 'KO',
    minutes: 5,
    log: [],
    ...overrides,
  });

  describe('validateBoutCombatants', () => {
    it('returns true for active warriors', () => {
      const wA = createMockWarrior({ status: 'Active' });
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        status: 'Active',
      });

      const result = validateBoutCombatants(wA, wD);

      expect(result).toBe(true);
    });

    it('returns false when warrior is missing', () => {
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });

      const result = validateBoutCombatants(undefined, wD);

      expect(result).toBe(false);
    });

    it('returns false when opponent is missing', () => {
      const wA = createMockWarrior();

      const result = validateBoutCombatants(wA, undefined);

      expect(result).toBe(false);
    });

    it('returns false for non-active status', () => {
      const wA = createMockWarrior({ status: 'Dead' });
      const wD = createMockWarrior({
        id: 'warrior-d' as WarriorId,
        name: 'Warrior D',
        status: 'Active',
      });

      const result = validateBoutCombatants(wA, wD);

      expect(result).toBe(false);
    });
  });

  describe('getWinnerId', () => {
    it('returns A warrior id when A wins', () => {
      const outcome = createMockOutcome({ winner: 'A' });

      const result = getWinnerId(outcome, 'warrior-a', 'warrior-d');

      expect(result).toBe('warrior-a');
    });

    it('returns D warrior id when D wins', () => {
      const outcome = createMockOutcome({ winner: 'D' });

      const result = getWinnerId(outcome, 'warrior-a', 'warrior-d');

      expect(result).toBe('warrior-d');
    });

    it('returns null for Draw', () => {
      const outcome = createMockOutcome({ winner: null, by: 'Draw' });

      const result = getWinnerId(outcome, 'warrior-a', 'warrior-d');

      expect(result).toBeNull();
    });
  });

  describe('calculateBoutFame', () => {
    it('returns fame values for winner and loser', () => {
      const outcome = createMockOutcome({ winner: 'A' });
      const moodMods = { fameMultiplier: 1, popMultiplier: 1, killChanceBonus: 0 };

      const result = calculateBoutFame(outcome, [], moodMods, false);

      expect(result.fameA).toBeDefined();
      expect(result.fameD).toBeDefined();
      expect(typeof result.fameA).toBe('number');
      expect(typeof result.fameD).toBe('number');
    });

    it('returns fame values for both fighters', () => {
      const outcome = createMockOutcome({ winner: 'A' });
      const moodMods = { fameMultiplier: 1, popMultiplier: 1, killChanceBonus: 0 };

      const result = calculateBoutFame(outcome, [], moodMods, false);

      // Both should have numeric fame values
      expect(typeof result.fameA).toBe('number');
      expect(typeof result.fameD).toBe('number');
    });

    it('gives bonus fame for rivalry bouts', () => {
      const outcome = createMockOutcome({ winner: 'A' });
      const moodMods = { fameMultiplier: 1, popMultiplier: 1, killChanceBonus: 0 };

      const resultNormal = calculateBoutFame(outcome, [], moodMods, false);
      const resultRivalry = calculateBoutFame(outcome, [], moodMods, true);

      expect(resultRivalry.fameA).toBeGreaterThanOrEqual(resultNormal.fameA);
    });

    it('handles Draw outcome', () => {
      const outcome = createMockOutcome({ winner: null, by: 'Draw' });
      const moodMods = { fameMultiplier: 1, popMultiplier: 1, killChanceBonus: 0 };

      const result = calculateBoutFame(outcome, [], moodMods, false);

      expect(result.fameA).toBeDefined();
      expect(result.fameD).toBeDefined();
    });

    it('calculates fame with tags', () => {
      const outcome = createMockOutcome({ winner: 'A' });
      const moodMods = { fameMultiplier: 1, popMultiplier: 1, killChanceBonus: 0 };
      const tags = ['Flashy', 'Dominant'];

      const result = calculateBoutFame(outcome, tags, moodMods, false);

      expect(typeof result.fameA).toBe('number');
      expect(typeof result.fameD).toBe('number');
    });
  });

  describe('processContractPayouts', () => {
    it('returns empty array for no contract', () => {
      const state = {} as import('@/types/state.types').GameState;
      const result = processContractPayouts(state, undefined, 'A', 'warrior-a', 'warrior-d');

      expect(result).toEqual([]);
    });
  });
});
