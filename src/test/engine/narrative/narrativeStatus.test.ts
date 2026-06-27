import { describe, it, expect } from 'vitest';
import {
  damageSeverityLine,
  stateChangeLine,
  fatigueLine,
  crowdReaction,
  minuteStatusLine,
} from '@/engine/narrative/narrativeStatus';
import { SeededRNG } from '@/utils/random';

const noRawTokens = (s: string) => !/\{\{|\}\}/.test(s);

describe('narrativeStatus', () => {
  describe('damageSeverityLine', () => {
    it('returns deadly line for ratio >= 0.35', () => {
      const rng = new SeededRNG(1);
      const result = damageSeverityLine(rng, 36, 100, 'Rex');
      expect(result).not.toBeNull();
      expect(noRawTokens(result!)).toBe(true);
    });

    it('returns terrific line for ratio >= 0.25', () => {
      const rng = new SeededRNG(1);
      const result = damageSeverityLine(rng, 26, 100, 'Rex');
      expect(result).not.toBeNull();
      expect(noRawTokens(result!)).toBe(true);
    });

    it('returns powerful line for ratio >= 0.15', () => {
      const rng = new SeededRNG(1);
      const result = damageSeverityLine(rng, 16, 100, 'Rex');
      expect(result).not.toBeNull();
      expect(noRawTokens(result!)).toBe(true);
    });

    it('returns glancing line for ratio <= 0.05', () => {
      const rng = new SeededRNG(1);
      const result = damageSeverityLine(rng, 5, 100, 'Rex');
      expect(result).not.toBeNull();
      expect(noRawTokens(result!)).toBe(true);
    });

    it('returns null for mid-range damage (0.06–0.14)', () => {
      const rng = new SeededRNG(1);
      expect(damageSeverityLine(rng, 10, 100, 'Rex')).toBeNull();
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(damageSeverityLine(r1, 36, 100, 'Rex')).toBe(damageSeverityLine(r2, 36, 100, 'Rex'));
    });
  });

  describe('stateChangeLine', () => {
    it('returns severe line when hp crosses 0.2 threshold', () => {
      const rng = new SeededRNG(1);
      const result = stateChangeLine(rng, 'Rex', 0.15, 0.25);
      expect(result).not.toBeNull();
      expect(noRawTokens(result!)).toBe(true);
    });

    it('returns desperate line when hp crosses 0.4 threshold', () => {
      const rng = new SeededRNG(1);
      const result = stateChangeLine(rng, 'Rex', 0.35, 0.45);
      expect(result).not.toBeNull();
    });

    it('returns serious line when hp crosses 0.6 threshold', () => {
      const rng = new SeededRNG(1);
      const result = stateChangeLine(rng, 'Rex', 0.55, 0.65);
      expect(result).not.toBeNull();
    });

    it('returns null when no threshold is crossed', () => {
      const rng = new SeededRNG(1);
      expect(stateChangeLine(rng, 'Rex', 0.8, 0.85)).toBeNull();
    });

    it('returns null when hp stays above all thresholds', () => {
      const rng = new SeededRNG(1);
      expect(stateChangeLine(rng, 'Rex', 0.7, 0.7)).toBeNull();
    });
  });

  describe('fatigueLine', () => {
    it('returns exhausted line for endRatio <= 0.15', () => {
      expect(fatigueLine(new SeededRNG(1), 'Rex', 0.1)).toBe(
        'Rex is tired and barely able to defend himself!'
      );
    });

    it('returns tired line for endRatio <= 0.3', () => {
      expect(fatigueLine(new SeededRNG(1), 'Rex', 0.25)).toBe('Rex is breathing heavily.');
    });

    it('returns null for endRatio > 0.3', () => {
      expect(fatigueLine(new SeededRNG(1), 'Rex', 0.5)).toBeNull();
    });
  });

  describe('crowdReaction', () => {
    it('returns null when RNG rolls above 0.25 threshold', () => {
      let foundNull = false;
      for (let seed = 1; seed <= 100; seed++) {
        const r = new SeededRNG(seed);
        const result = crowdReaction(r, 'Loser', 'Winner', 0.5);
        if (result === null) {
          foundNull = true;
          break;
        }
      }
      expect(foundNull).toBe(true);
    });

    it('returns a line with no raw tokens when it fires', () => {
      for (let seed = 1; seed <= 100; seed++) {
        const r = new SeededRNG(seed);
        const result = crowdReaction(r, 'Loser', 'Winner', 0.05);
        if (result !== null) {
          expect(noRawTokens(result)).toBe(true);
        }
      }
    });

    it('is deterministic with same seed', () => {
      const r1 = new SeededRNG(42);
      const r2 = new SeededRNG(42);
      expect(crowdReaction(r1, 'Loser', 'Winner', 0.05)).toBe(
        crowdReaction(r2, 'Loser', 'Winner', 0.05)
      );
    });
  });

  describe('minuteStatusLine', () => {
    it('returns "beating" line when hitsA > hitsD + 3', () => {
      const rng = new SeededRNG(1);
      expect(minuteStatusLine(rng, 1, 'A', 'D', 10, 5)).toBe('A is beating his opponent!');
    });

    it('returns "beating" line when hitsD > hitsA + 3', () => {
      const rng = new SeededRNG(1);
      expect(minuteStatusLine(rng, 1, 'A', 'D', 5, 10)).toBe('D is beating his opponent!');
    });

    it('returns stalemate line when hits are close', () => {
      const rng = new SeededRNG(1);
      const result = minuteStatusLine(rng, 1, 'A', 'D', 5, 6);
      expect(typeof result).toBe('string');
      expect(noRawTokens(result)).toBe(true);
    });
  });
});
