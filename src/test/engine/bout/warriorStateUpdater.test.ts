/**
 * Warrior State Updater — post-bout warrior state transformations.
 * Pure functions with no side effects.
 */
import { describe, it, expect } from 'vitest';
import { updateWarriorAfterBout } from '@/engine/bout/warriorStateUpdater';
import type { Warrior } from '@/types/warrior.types';

describe('warriorStateUpdater', () => {
  const createMockWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
    ({
      id: 'test-warrior' as import('@/types/shared.types').WarriorId,
      name: 'Test Warrior',
      fame: 10,
      popularity: 5,
      fatigue: 20,
      career: { wins: 3, losses: 2, kills: 1 },
      flair: ['Veteran'],
      ...overrides,
    }) as Warrior;

  describe('updateWarriorAfterBout', () => {
    it('updates fame and popularity for winner', () => {
      const warrior = createMockWarrior();
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, []);

      expect(result.fame).toBe(15); // 10 + 5
      expect(result.popularity).toBe(8); // 5 + 3
    });

    it('updates fame and popularity for loser', () => {
      const warrior = createMockWarrior();
      const result = updateWarriorAfterBout(warrior, 1, 1, false, false, []);

      expect(result.fame).toBe(11); // 10 + 1
      expect(result.popularity).toBe(6); // 5 + 1
    });

    it('updates career stats for winner', () => {
      const warrior = createMockWarrior();
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, []);

      expect(result.career.wins).toBe(4); // 3 + 1
      expect(result.career.losses).toBe(2); // unchanged
    });

    it('updates career stats for loser', () => {
      const warrior = createMockWarrior();
      const result = updateWarriorAfterBout(warrior, 0, 0, false, false, []);

      expect(result.career.wins).toBe(3); // unchanged
      expect(result.career.losses).toBe(3); // 2 + 1
    });

    it('updates kills when wasKilled=true', () => {
      const warrior = createMockWarrior();
      const result = updateWarriorAfterBout(warrior, 10, 5, true, true, []);

      expect(result.career.kills).toBe(2); // 1 + 1
    });

    it('does not update kills when wasKilled=false', () => {
      const warrior = createMockWarrior();
      const result = updateWarriorAfterBout(warrior, 10, 5, true, false, []);

      expect(result.career.kills).toBe(1); // unchanged
    });

    it('adds Flashy flair when winner has Flashy tag', () => {
      const warrior = createMockWarrior({ flair: ['Veteran'] });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, ['Flashy']);

      expect(result.flair).toContain('Flashy');
      expect(result.flair).toContain('Veteran');
    });

    it('does not duplicate Flashy flair if already present', () => {
      const warrior = createMockWarrior({ flair: ['Veteran', 'Flashy'] });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, ['Flashy']);

      expect(result.flair.filter((f) => f === 'Flashy').length).toBe(1);
    });

    it('increases fatigue by 25 (capped at 100)', () => {
      const warrior = createMockWarrior({ fatigue: 50 });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, []);

      expect(result.fatigue).toBe(75); // 50 + 25
    });

    it('caps fatigue at 100', () => {
      const warrior = createMockWarrior({ fatigue: 90 });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, []);

      expect(result.fatigue).toBe(100); // capped, not 115
    });

    it('resets fatigue to 0 when wasKilled', () => {
      const warrior = createMockWarrior({ fatigue: 50 });
      const result = updateWarriorAfterBout(warrior, 0, 0, false, true, []);

      expect(result.fatigue).toBe(0);
    });

    it('skips fatigue accrual when skipFatigue=true', () => {
      const warrior = createMockWarrior({ fatigue: 50 });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, [], true);

      expect(result.fatigue).toBe(50); // unchanged
    });

    it('handles undefined fatigue gracefully', () => {
      const warrior = createMockWarrior({ fatigue: undefined });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, []);

      expect(result.fatigue).toBe(25); // 0 + 25
    });

    it('prevents negative fame', () => {
      const warrior = createMockWarrior({ fame: 5 });
      const result = updateWarriorAfterBout(warrior, -10, 0, false, false, []);

      expect(result.fame).toBe(0); // clamped, not negative
    });

    it('prevents negative popularity', () => {
      const warrior = createMockWarrior({ popularity: 3 });
      const result = updateWarriorAfterBout(warrior, 0, -10, false, false, []);

      expect(result.popularity).toBe(0); // clamped, not negative
    });

    it('preserves other warrior properties', () => {
      const warrior = createMockWarrior({
        name: 'Special Name',
        id: 'special-id' as import('@/types/shared.types').WarriorId,
      });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, []);

      expect(result.name).toBe('Special Name');
      expect(result.id).toBe('special-id');
    });
  });
});
