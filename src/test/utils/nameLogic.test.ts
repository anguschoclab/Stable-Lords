import { describe, it, expect } from 'vitest';
import { generateDynasticName } from '@/utils/nameLogic';

describe('nameLogic', () => {
  describe('generateDynasticName', () => {
    it('always returns a non-empty string', () => {
      const result = generateDynasticName('Silas Blackwood', 12345);
      expect(result.length).toBeGreaterThan(0);
    });

    it('result contains the original name or a known prefix', () => {
      const result = generateDynasticName('Silas Blackwood', 42);
      // Should be suffix (contains original), prefix (contains first name), or surname match
      const containsOriginal = result.includes('Silas') || result.includes('Blackwood');
      const knownPrefixes = ['Legacy of', 'Blood of', 'Protege of', 'Shadow of'];
      const hasKnownPrefix = knownPrefixes.some((p) => result.startsWith(p));
      expect(containsOriginal || hasKnownPrefix).toBe(true);
    });

    it('does not produce trailing whitespace for single-word names', () => {
      for (let seed = 0; seed < 50; seed++) {
        const result = generateDynasticName('Marcus', seed);
        expect(result.endsWith(' ')).toBe(false);
      }
    });

    it('does not produce empty output', () => {
      for (let seed = 0; seed < 50; seed++) {
        const result = generateDynasticName('Single', seed);
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('handles empty string input gracefully', () => {
      const result = generateDynasticName('', 0);
      expect(result).toBe('Legacy of Unknown');
    });

    it('handles leading and trailing spaces', () => {
      const result = generateDynasticName('  Marcus  ', 999);
      expect(result.endsWith(' ')).toBe(false);
      expect(result.startsWith(' ')).toBe(false);
    });

    it('handles multiple consecutive internal spaces', () => {
      const result = generateDynasticName('Marcus  Aurelius  Blackwood', 0);
      expect(result.includes('  ')).toBe(false);
    });
  });
});
