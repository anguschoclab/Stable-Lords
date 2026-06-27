import { describe, it, expect } from 'vitest';
import {
  narrateBoutEnd,
  popularityLine,
  skillLearnLine,
  tradingBlowsLine,
  stalemateLine,
  tauntLine,
  conservingLine,
  type BoutEndContext,
} from '@/engine/narrative/narrativePostBout';
import { SeededRNG } from '@/utils/random';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

describe('narrativePostBout', () => {
  describe('narrateBoutEnd', () => {
    it('returns 2 lines for Kill category', () => {
      const rng = new SeededRNG(1);
      const result = narrateBoutEnd(rng, 'Kill', 'Winner', 'Loser', 'longsword');
      expect(result).toHaveLength(2);
      for (const line of result) {
        expect(noRawTokens(line)).toBe(true);
      }
    });

    it('returns 1 line for non-Kill categories', () => {
      const rng = new SeededRNG(1);
      const result = narrateBoutEnd(rng, 'KO', 'Winner', 'Loser', 'longsword');
      expect(result).toHaveLength(1);
      expect(noRawTokens(result[0]!)).toBe(true);
    });

    it('handles all end categories', () => {
      const categories = ['Kill', 'KO', 'Stoppage', 'Exhaustion', 'Surrender', 'Incapacitated'];
      for (const cat of categories) {
        const rng = new SeededRNG(1);
        const result = narrateBoutEnd(rng, cat, 'Winner', 'Loser', 'longsword');
        expect(result.length).toBeGreaterThanOrEqual(1);
        for (const line of result) {
          expect(noRawTokens(line)).toBe(true);
        }
      }
    });

    it('uses tiered kill-text lookup with BoutEndContext', () => {
      const ctx: BoutEndContext = {
        cause: 'EXECUTION',
        style: 'AimedBlow',
        mood: 'Calm',
      };
      const rng = new SeededRNG(1);
      const result = narrateBoutEnd(rng, 'Kill', 'Winner', 'Loser', 'epee', ctx);
      expect(result).toHaveLength(2);
      for (const line of result) {
        expect(noRawTokens(line)).toBe(true);
      }
    });

    it('falls back gracefully for unknown cause', () => {
      const ctx: BoutEndContext = { cause: 'UNKNOWN_CAUSE' };
      const rng = new SeededRNG(1);
      const result = narrateBoutEnd(rng, 'Kill', 'Winner', 'Loser', 'longsword', ctx);
      expect(result).toHaveLength(2);
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(narrateBoutEnd(r1, 'Kill', 'W', 'L', 'longsword')).toEqual(
        narrateBoutEnd(r2, 'Kill', 'W', 'L', 'longsword')
      );
    });
  });

  describe('popularityLine', () => {
    it('returns great line for popDelta >= 3', () => {
      const rng = new SeededRNG(1);
      const result = popularityLine(rng, 'Rex', 5);
      expect(result).not.toBeNull();
      expect(noRawTokens(result!)).toBe(true);
    });

    it('returns normal line for popDelta >= 1', () => {
      const rng = new SeededRNG(1);
      const result = popularityLine(rng, 'Rex', 2);
      expect(result).not.toBeNull();
    });

    it('returns null for popDelta < 1', () => {
      const rng = new SeededRNG(1);
      expect(popularityLine(rng, 'Rex', 0)).toBeNull();
    });
  });

  describe('skillLearnLine', () => {
    it('returns a non-empty string', () => {
      const rng = new SeededRNG(1);
      const result = skillLearnLine(rng, 'Rex');
      expect(typeof result).toBe('string');
      expect(noRawTokens(result)).toBe(true);
    });
  });

  describe('tradingBlowsLine', () => {
    it('returns a non-empty string', () => {
      const rng = new SeededRNG(1);
      const result = tradingBlowsLine(rng);
      expect(typeof result).toBe('string');
    });
  });

  describe('stalemateLine', () => {
    it('returns a non-empty string', () => {
      const rng = new SeededRNG(1);
      const result = stalemateLine(rng);
      expect(typeof result).toBe('string');
    });
  });

  describe('tauntLine', () => {
    it('returns null or a no-raw-token string for winner', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const r = new SeededRNG(seed);
        const result = tauntLine(r, 'Rex', true);
        if (result !== null) expect(noRawTokens(result)).toBe(true);
      }
    });

    it('returns null or a no-raw-token string for loser', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const r = new SeededRNG(seed);
        const result = tauntLine(r, 'Rex', false);
        if (result !== null) expect(noRawTokens(result)).toBe(true);
      }
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(tauntLine(r1, 'Rex', true)).toBe(tauntLine(r2, 'Rex', true));
    });
  });

  describe('conservingLine', () => {
    it('returns the expected string', () => {
      expect(conservingLine('Rex')).toBe('Rex is conserving his energy.');
    });
  });
});
