/**
 * Warrior State Updater — post-bout warrior state transformations.
 * Pure functions with no side effects.
 */
import { describe, it, expect } from 'vitest';
import {
  updateWarriorAfterBout,
  applyFameDelta,
  applyCareerStats,
} from '@/engine/bout/warriorStateUpdater';
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
      const warrior = createMockWarrior({ name: 'Special Name', id: 'special-id' as import('@/types/shared.types').WarriorId });
      const result = updateWarriorAfterBout(warrior, 5, 3, true, false, []);

      expect(result.name).toBe('Special Name');
      expect(result.id).toBe('special-id');
    });
  });

  describe('applyFameDelta', () => {
    it('adds positive fame', () => {
      const warrior = createMockWarrior({ fame: 10 });
      const result = applyFameDelta(warrior, 5);

      expect(result.fame).toBe(15);
    });

    it('subtracts fame', () => {
      const warrior = createMockWarrior({ fame: 10 });
      const result = applyFameDelta(warrior, -3);

      expect(result.fame).toBe(7);
    });

    it('clamps fame at minimum 0', () => {
      const warrior = createMockWarrior({ fame: 5 });
      const result = applyFameDelta(warrior, -10);

      expect(result.fame).toBe(0);
    });

    it('handles undefined fame', () => {
      const warrior = createMockWarrior({ fame: undefined });
      const result = applyFameDelta(warrior, 5);

      expect(result.fame).toBe(5);
    });

    it('preserves other warrior properties', () => {
      const warrior = createMockWarrior({ name: 'Test', popularity: 10 });
      const result = applyFameDelta(warrior, 5);

      expect(result.name).toBe('Test');
      expect(result.popularity).toBe(10);
    });
  });

  describe('applyCareerStats', () => {
    it('increments wins when win=true', () => {
      const warrior = createMockWarrior({ career: { wins: 5, losses: 3, kills: 1 } });
      const result = applyCareerStats(warrior, { win: true, kill: false });

      expect(result.career.wins).toBe(6);
      expect(result.career.losses).toBe(3);
      expect(result.career.kills).toBe(1);
    });

    it('increments losses when win=false', () => {
      const warrior = createMockWarrior({ career: { wins: 5, losses: 3, kills: 1 } });
      const result = applyCareerStats(warrior, { win: false, kill: false });

      expect(result.career.wins).toBe(5);
      expect(result.career.losses).toBe(4);
      expect(result.career.kills).toBe(1);
    });

    it('increments kills when kill=true', () => {
      const warrior = createMockWarrior({ career: { wins: 5, losses: 3, kills: 1 } });
      const result = applyCareerStats(warrior, { win: true, kill: true });

      expect(result.career.kills).toBe(2);
    });

    it('handles missing career stats gracefully', () => {
      const warrior = { ...createMockWarrior(), career: { wins: 0, losses: 0, kills: 0 } };
      const result = applyCareerStats(warrior, { win: true, kill: true });

      expect(result.career.wins).toBe(1);
      expect(result.career.losses).toBe(0);
      expect(result.career.kills).toBe(1);
    });

    it('preserves other warrior properties', () => {
      const warrior = createMockWarrior({ name: 'Test', fame: 50 });
      const result = applyCareerStats(warrior, { win: true, kill: false });

      expect(result.name).toBe('Test');
      expect(result.fame).toBe(50);
    });
  });
});
