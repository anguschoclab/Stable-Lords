import { describe, it, expect } from 'vitest';
import { generateDynasticName } from '@/utils/nameLogic';

describe('nameLogic', () => {
  describe('generateDynasticName', () => {
    it('always returns a non-empty string', () => {
      const result = generateDynasticName('Silas Blackwood', 12345);
      expect(result.length).toBeGreaterThan(0);
    });

    it('appends a suffix for honorific-style names', () => {
      // Seed 42 produces roll < 0.6 (suffix branch) with HONORIFICS pick
      const result = generateDynasticName('Silas Blackwood', 42);
      expect(result.startsWith('Silas Blackwood')).toBe(true);
    });

    it('produces a valid name for single-word original names', () => {
      const result = generateDynasticName('Marcus', 99999);
      expect(result.length).toBeGreaterThan(0);
      expect(result.endsWith(' ')).toBe(false);
    });
  });
});
