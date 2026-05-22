import { describe, it, expect } from 'vitest';
import { formatDate } from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a valid ISO date string correctly', () => {
      // Using a valid date string. Because toLocaleDateString output format
      // depends on the environment running the test, we mainly assert that
      // it successfully parsed the date and didn't return the raw input.
      const validIso = '2024-05-22T14:30:00.000Z';
      const result = formatDate(validIso);

      expect(result).not.toBe(validIso);
      // It should contain some date component (like '22' or 'May')
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe('Invalid Date');
    });

    it('returns the original string for an invalid date string', () => {
      const invalid = 'invalid-date';
      expect(formatDate(invalid)).toBe(invalid);
    });

    it('returns the original string for an empty string', () => {
      const empty = '';
      expect(formatDate(empty)).toBe(empty);
    });

    it('returns the original string for a random unparsable string', () => {
      const randomStr = 'this is not a date format';
      expect(formatDate(randomStr)).toBe(randomStr);
    });
  });
});
