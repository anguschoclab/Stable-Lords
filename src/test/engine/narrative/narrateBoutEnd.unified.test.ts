import { describe, it, expect } from 'vitest';
import { narrateBoutEnd } from '@/engine/narrative';
import { CombatNarrator } from '@/engine/narrative/combatNarrator';
import { BoutNarrator } from '@/engine/narrative/boutNarrator';
import { SeededRNGService } from '@/utils/random';

const FALLBACK_MARKER = 'A fierce exchange occurs.';

describe('narrateBoutEnd unified', () => {
  const rng = new SeededRNGService(42);

  describe('root narrative/index.ts export', () => {
    it('KO — returns 1 string with winner/loser names interpolated', () => {
      const lines = narrateBoutEnd(rng, 'KO', 'Varak', 'Dren');
      expect(lines).toHaveLength(1);
      const line = lines[0]!;
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
      expect(line).not.toContain('{{');
      expect(line).not.toBe(FALLBACK_MARKER);
    });

    it('Stoppage — returns 1 non-fallback interpolated string', () => {
      const lines = narrateBoutEnd(rng, 'Stoppage', 'Varak', 'Dren');
      expect(lines).toHaveLength(1);
      expect(lines[0]!).not.toContain('{{');
    });

    it('Exhaustion — returns 1 non-fallback interpolated string', () => {
      const lines = narrateBoutEnd(rng, 'Exhaustion', 'Varak', 'Dren');
      expect(lines).toHaveLength(1);
      expect(lines[0]!).not.toContain('{{');
    });

    it('Surrender — returns 1 non-fallback string (not in old categoryMap)', () => {
      const lines = narrateBoutEnd(rng, 'Surrender', 'Varak', 'Dren');
      expect(lines).toHaveLength(1);
      expect(lines[0]!.length).toBeGreaterThan(0);
      expect(lines[0]!).not.toContain('{{');
    });

    it('Incapacitated — returns 1 non-fallback string (not in old categoryMap)', () => {
      const lines = narrateBoutEnd(rng, 'Incapacitated', 'Varak', 'Dren');
      expect(lines).toHaveLength(1);
      expect(lines[0]!.length).toBeGreaterThan(0);
      expect(lines[0]!).not.toContain('{{');
    });

    it('Kill — returns 2 strings, neither is the fallback marker', () => {
      const lines = narrateBoutEnd(rng, 'Kill', 'Varak', 'Dren', 'gladius');
      expect(lines).toHaveLength(2);
      lines.forEach((line: string) => {
        expect(line.length).toBeGreaterThan(0);
        expect(line).not.toBe(FALLBACK_MARKER);
      });
    });

    it('Kill with ctx.cause=EXECUTION — does not produce fallback marker', () => {
      const lines = narrateBoutEnd(rng, 'Kill', 'Varak', 'Dren', 'gladius', {
        cause: 'EXECUTION',
      });
      expect(lines).toHaveLength(2);
      lines.forEach((line: string) => {
        expect(line).not.toBe(FALLBACK_MARKER);
      });
    });
  });

  describe('CombatNarrator delegation', () => {
    it('returns same category results as direct call for KO', () => {
      const r1 = new SeededRNGService(99);
      const r2 = new SeededRNGService(99);
      const direct = narrateBoutEnd(r1, 'KO', 'Alpha', 'Beta');
      const via = CombatNarrator.narrateBoutEnd(r2, 'KO', 'Alpha', 'Beta');
      expect(via).toEqual(direct);
    });

    it('returns same category results as direct call for Kill', () => {
      const r1 = new SeededRNGService(77);
      const r2 = new SeededRNGService(77);
      const direct = narrateBoutEnd(r1, 'Kill', 'Alpha', 'Beta', 'axe');
      const via = CombatNarrator.narrateBoutEnd(r2, 'Kill', 'Alpha', 'Beta', 'axe');
      expect(via).toEqual(direct);
    });

    it('Surrender — CombatNarrator returns non-fallback string', () => {
      const lines = CombatNarrator.narrateBoutEnd(rng, 'Surrender', 'Varak', 'Dren');
      expect(lines).toHaveLength(1);
      expect(lines[0]!.length).toBeGreaterThan(0);
    });

    it('Incapacitated — CombatNarrator returns non-fallback string', () => {
      const lines = CombatNarrator.narrateBoutEnd(rng, 'Incapacitated', 'Varak', 'Dren');
      expect(lines).toHaveLength(1);
      expect(lines[0]!.length).toBeGreaterThan(0);
    });
  });

  describe('BoutNarrator delegation', () => {
    it('returns same results as CombatNarrator for KO', () => {
      const r1 = new SeededRNGService(55);
      const r2 = new SeededRNGService(55);
      const via = BoutNarrator.narrateBoutEnd(r1, 'KO', 'Alpha', 'Beta');
      const direct = CombatNarrator.narrateBoutEnd(r2, 'KO', 'Alpha', 'Beta');
      expect(via).toEqual(direct);
    });

    it('returns same results as CombatNarrator for Kill', () => {
      const r1 = new SeededRNGService(33);
      const r2 = new SeededRNGService(33);
      const via = BoutNarrator.narrateBoutEnd(r1, 'Kill', 'Alpha', 'Beta', 'sword');
      const direct = CombatNarrator.narrateBoutEnd(r2, 'Kill', 'Alpha', 'Beta', 'sword');
      expect(via).toEqual(direct);
    });

    it('accepts optional ctx param without error', () => {
      expect(() =>
        BoutNarrator.narrateBoutEnd(rng, 'Kill', 'A', 'B', 'gladius', { cause: 'EXECUTION' })
      ).not.toThrow();
    });
  });
});
