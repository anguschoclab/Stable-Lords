import { describe, it, expect } from 'vitest';
import {
  narrateRangeShift,
  narrateFeint,
  narrateZoneShift,
  arenaIntroLine,
  tacticStreakLine,
  pressingLine,
  narrateInsightHint,
  RANGE_NAMES,
} from '@/engine/narrative/narrativePositioning';
import { SeededRNG } from '@/utils/random';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

describe('narrativePositioning', () => {
  describe('narrateRangeShift', () => {
    it('produces no-raw-token text for all ranges', () => {
      for (const range of Object.keys(RANGE_NAMES)) {
        const rng = new SeededRNG(1);
        const result = narrateRangeShift(rng, 'Rex', range);
        expect(noRawTokens(result)).toBe(true);
        expect(result).toContain('Rex');
      }
    });

    it('handles unknown range by lowercasing', () => {
      const rng = new SeededRNG(1);
      const result = narrateRangeShift(rng, 'Rex', 'Unknown');
      expect(noRawTokens(result)).toBe(true);
      expect(result).toContain('unknown');
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(narrateRangeShift(r1, 'Rex', 'Tight')).toBe(narrateRangeShift(r2, 'Rex', 'Tight'));
    });
  });

  describe('narrateFeint', () => {
    it('produces no-raw-token text for successful feint', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const r = new SeededRNG(seed);
        const result = narrateFeint(r, 'Rex', true, 'Vellis');
        expect(noRawTokens(result)).toBe(true);
      }
    });

    it('produces no-raw-token text for failed feint', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const r = new SeededRNG(seed);
        const result = narrateFeint(r, 'Rex', false, 'Vellis');
        expect(noRawTokens(result)).toBe(true);
      }
    });
  });

  describe('narrateZoneShift', () => {
    it('produces no-raw-token text for Corner', () => {
      const rng = new SeededRNG(1);
      expect(noRawTokens(narrateZoneShift(rng, 'Rex', 'Corner'))).toBe(true);
    });

    it('produces no-raw-token text for Edge', () => {
      const rng = new SeededRNG(1);
      expect(noRawTokens(narrateZoneShift(rng, 'Rex', 'Edge'))).toBe(true);
    });

    it('produces no-raw-token text for Center', () => {
      const rng = new SeededRNG(1);
      expect(noRawTokens(narrateZoneShift(rng, 'Rex', 'Center'))).toBe(true);
    });
  });

  describe('arenaIntroLine', () => {
    it('formats arena name and description', () => {
      const result = arenaIntroLine({ name: 'The Pit', description: 'A bloody arena' });
      expect(result).toContain('THE PIT');
      expect(result).toContain('A bloody arena');
    });
  });

  describe('tacticStreakLine', () => {
    it('returns line for streak === 3', () => {
      expect(tacticStreakLine('Rex', 'parry', 3)).toBe('Rex is leaning heavily on the parry.');
    });

    it('returns line for streak >= 5', () => {
      const result = tacticStreakLine('Rex', 'parry', 5);
      expect(result).toContain('obvious');
    });

    it('returns null for streak < 3', () => {
      expect(tacticStreakLine('Rex', 'parry', 2)).toBeNull();
    });
  });

  describe('pressingLine', () => {
    it('returns no-raw-token string', () => {
      const rng = new SeededRNG(1);
      const result = pressingLine(rng, 'Rex');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('narrateInsightHint', () => {
    it('returns null or no-raw-token string for valid attributes', () => {
      const attrs = ['ST', 'SP', 'DF', 'WL', 'CN', 'CT'];
      for (const attr of attrs) {
        const rng = new SeededRNG(1);
        const result = narrateInsightHint(rng, attr, 'Rex', 'Vellis');
        if (result !== null) expect(noRawTokens(result)).toBe(true);
      }
    });

    it('returns null for fallback template', () => {
      const rng = new SeededRNG(1);
      const result = narrateInsightHint(rng, 'NONEXISTENT', 'Rex', 'Vellis');
      expect(result).toBeNull();
    });
  });
});
