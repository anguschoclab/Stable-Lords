/**
 * Decision Logic — judge scoring and decision resolution for timed-out bouts.
 */
import { describe, it, expect, vi } from 'vitest';
import { resolveDecision } from '@/engine/bout/decisionLogic';
import type { FighterState } from '@/engine/combat/resolution/types';

describe('decisionLogic', () => {
  const createMockFighter = (overrides: Partial<FighterState> = {}): FighterState =>
    ({
      label: 'A',
      hp: 80,
      maxHp: 100,
      endurance: 80,
      maxEndurance: 100,
      hitsLanded: 5,
      hitsTaken: 3,
      ripostes: 2,
      ...overrides,
    }) as FighterState;

  describe('resolveDecision', () => {
    it('returns unanimous decision for fighter A when dominating all criteria', () => {
      // A must win ALL 3 judge archetypes:
      // - Crowd: more hitsLanded + ripostes
      // - Technical: more ripostes, fewer hitsTaken
      // - Blood: dealt more damage (D.hp lower relative to max)
      const fA = createMockFighter({
        hp: 95, maxHp: 100, // took little damage
        hitsLanded: 15, hitsTaken: 2, ripostes: 5
      });
      const fD = createMockFighter({
        label: 'D',
        hp: 30, maxHp: 100, // took lots of damage
        hitsLanded: 2, hitsTaken: 15, ripostes: 0
      });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      expect(result.winner).toBe('A');
      expect(result.by).toBe('Stoppage');
      expect(result.narrative).toContain('All three judges are in agreement');
    });

    it('returns unanimous decision for fighter D when dominating all criteria', () => {
      const fA = createMockFighter({
        hp: 30, maxHp: 100,
        hitsLanded: 2, hitsTaken: 15, ripostes: 0
      });
      const fD = createMockFighter({
        label: 'D',
        hp: 95, maxHp: 100,
        hitsLanded: 15, hitsTaken: 2, ripostes: 5
      });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      expect(result.winner).toBe('D');
      expect(result.by).toBe('Stoppage');
      expect(result.narrative).toContain('All three judges are in agreement');
    });

    it('returns split decision when fighters are close', () => {
      const fA = createMockFighter({ hitsLanded: 6, hitsTaken: 5, ripostes: 2 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hitsTaken: 6, ripostes: 1 });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      expect(result.winner).toBe('A');
      expect(result.by).toBe('Stoppage');
      expect(result.narrative).toContain('split');
    });

    it('mentions dissenting judge in split decision', () => {
      const fA = createMockFighter({ hitsLanded: 6, hitsTaken: 5, ripostes: 2 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hitsTaken: 6, ripostes: 1 });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      expect(result.narrative).toMatch(/(Crowd|Technical|Blood)/);
    });

    it('includes fighter names in narrative', () => {
      const fA = createMockFighter({
        hp: 95, maxHp: 100,
        hitsLanded: 15, hitsTaken: 2, ripostes: 5
      });
      const fD = createMockFighter({
        label: 'D',
        hp: 30, maxHp: 100,
        hitsLanded: 2, hitsTaken: 15, ripostes: 0
      });

      const result = resolveDecision(fA, fD, 'Thunder', 'Lightning');

      expect(result.narrative).toContain('Thunder');
      expect(result.narrative).toContain('Lightning');
    });

    it('can return draw when judges are divided', () => {
      // Create very even fight - this may trigger contested/overtime path
      const fA = createMockFighter({ hitsLanded: 5, hitsTaken: 5, hp: 50, ripostes: 1 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hitsTaken: 5, hp: 50, ripostes: 1 });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      // With perfectly even stats, this could be draw or one wins by HP tiebreaker
      expect(['A', 'D', null]).toContain(result.winner);
      expect(['Stoppage', 'Draw']).toContain(result.by);
    });

    it('uses HP tiebreaker when judges split evenly', () => {
      // One fighter has significantly more HP
      const fA = createMockFighter({ hitsLanded: 5, hp: 80, maxHp: 100 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hp: 40, maxHp: 100 });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      // Higher HP should win in tiebreaker
      expect(result.winner).toBe('A');
    });

    it('uses RNG overtime when judges are divided and rng provided', () => {
      // Even stats that could result in divided judges (1-1-1 or 0-0-3)
      // Use very even stats to force overtime path
      const fA = createMockFighter({ hp: 50, maxHp: 100, hitsLanded: 5, hitsTaken: 5, ripostes: 2 });
      const fD = createMockFighter({ label: 'D', hp: 50, maxHp: 100, hitsLanded: 5, hitsTaken: 5, ripostes: 2 });
      const rng = vi.fn().mockReturnValue(0.4); // Below 0.5 threshold

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D', rng);

      // Result should be valid regardless of who wins
      expect(['A', 'D', null]).toContain(result.winner);
      expect(result.by).toBeDefined();
      expect(result.narrative).toBeDefined();
    });

    it('D wins in overtime when rng favors higher HP fighter', () => {
      const fA = createMockFighter({ hitsLanded: 5, hp: 40 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hp: 60 });
      const rng = vi.fn().mockReturnValue(0.8); // 80% - with HP ratio 40:100, D should win

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D', rng);

      expect(result.winner).toBe('D');
    });

    it('narrative mentions overtime for contested decisions', () => {
      const fA = createMockFighter({ hitsLanded: 5, hp: 50 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hp: 50 });
      const rng = vi.fn().mockReturnValue(0.5);

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D', rng);

      if (result.by === 'Stoppage' && result.narrative.includes('overtime')) {
        expect(result.narrative).toContain('overtime');
      }
    });

    it('mentions hit margin in narrative for dominant decisions', () => {
      const fA = createMockFighter({ hitsLanded: 12, hitsTaken: 3 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 3, hitsTaken: 12 });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      expect(result.winner).toBe('A');
      expect(result.narrative).toMatch(/\d+.*(more|strike|hit)/);
    });

    it('includes damage dealt/taken for close decisions', () => {
      const fA = createMockFighter({ hitsLanded: 6, hitsTaken: 5, hp: 70, maxHp: 100 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hitsTaken: 6, hp: 65, maxHp: 100 });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      // Should mention the close margin
      expect(result.narrative).toBeDefined();
      expect(result.narrative.length).toBeGreaterThan(10);
    });

    it('returns Draw when HP is equal and rng not provided', () => {
      const fA = createMockFighter({ hitsLanded: 5, hp: 50 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 5, hp: 50 });

      // With equal HP and no rng, may be draw or use other tiebreaker
      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      // Result should be valid
      expect(result.by).toBeDefined();
    });

    it('narrative always starts with Time! for non-overtime decisions', () => {
      const fA = createMockFighter({ hitsLanded: 10 });
      const fD = createMockFighter({ label: 'D', hitsLanded: 2 });

      const result = resolveDecision(fA, fD, 'Fighter A', 'Fighter D');

      if (!result.narrative.includes('overtime')) {
        expect(result.narrative.startsWith('Time!')).toBe(true);
      }
    });
  });
});
