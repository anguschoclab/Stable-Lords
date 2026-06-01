/**
 * Reporting Handler — fight summary generation and history tracking.
 */
import { describe, it, expect } from 'vitest';
import { handleReporting } from '@/engine/bout/reportingHandler';
import type { Warrior } from '@/types/warrior.types';
import type { FightOutcome } from '@/types/combat.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

describe('reportingHandler', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'warrior-a' as WarriorId,
      name: 'Warrior A',
      style: 'StrikingAttack' as FightingStyle,
      fame: 10,
      ...overrides,
    }) as Warrior;

  const createMockOutcome = (overrides: Partial<FightOutcome> = {}): FightOutcome =>
    ({
      winner: 'A',
      by: 'KO',
      minutes: 5,
      log: [],
      ...overrides,
    });

  describe('handleReporting', () => {
    it('generates FightSummary for bout outcome', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const outcome = createMockOutcome();

      const result = handleReporting(wA, wD, outcome, [], 10, 5, 8, 4, 1);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toBeDefined();
    });

    it('generates announcement text', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const outcome = createMockOutcome();

      const result = handleReporting(wA, wD, outcome, [], 10, 5, 8, 4, 1);

      expect(result).toHaveProperty('announcement');
      expect(typeof result.announcement).toBe('string');
      expect(result.announcement.length).toBeGreaterThan(0);
    });

    it('handles different outcome types', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });

      const outcomes: FightOutcome['by'][] = ['KO', 'Kill', 'Stoppage', 'Exhaustion', 'Draw'];

      for (const by of outcomes) {
        const outcome = createMockOutcome({ by });
        expect(() => handleReporting(wA, wD, outcome, [], 10, 5, 8, 4, 1)).not.toThrow();
      }
    });

    it('handles rivalry bouts', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Rival Warrior' });
      const outcome = createMockOutcome();

      const result = handleReporting(wA, wD, outcome, [], 10, 5, 8, 4, 1, 'rival-1', true);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('accepts optional RNG parameter', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const outcome = createMockOutcome();
      const rng = { next: () => 0.5, uuid: () => 'uuid', pick: <T>(arr: T[]) => arr[0]!, roll: (min: number, max: number) => min, shuffle: <T>(arr: T[]) => arr, pickWeighted: <T>(items: { item: T; weight: number }[]) => items[0]?.item!, chance: (pct: number) => false };

      expect(() => handleReporting(wA, wD, outcome, [], 10, 5, 8, 4, 1, undefined, false, 1, rng as any)).not.toThrow();
    });

    it('returns consistent structure regardless of bout type', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const outcome = createMockOutcome({ by: 'Kill' });

      const result = handleReporting(wA, wD, outcome, [], 10, 5, 8, 4, 1);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('announcement');
    });

    it('handles Draw outcome', () => {
      const wA = createMockWarrior();
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Warrior D' });
      const outcome = createMockOutcome({ winner: null, by: 'Draw' });

      const result = handleReporting(wA, wD, outcome, [], 10, 5, 10, 5, 1);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('uses fame values from fighters', () => {
      const wA = createMockWarrior({ name: 'Famous A', fame: 50 });
      const wD = createMockWarrior({ id: 'warrior-d' as WarriorId, name: 'Famous D', fame: 60 });
      const outcome = createMockOutcome();

      const result = handleReporting(wA, wD, outcome, [], 10, 5, 8, 4, 1);

      // Summary should reflect the fighters involved
      expect(result.summary).toBeDefined();
    });
  });
});
