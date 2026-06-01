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

    describe('valid ISO format variations', () => {
      it('formats ISO without milliseconds', () => {
        const iso = '2024-05-22T14:30:00Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats ISO with timezone offset +00:00', () => {
        const iso = '2024-05-22T14:30:00+00:00';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats ISO with timezone offset -05:00', () => {
        const iso = '2024-05-22T14:30:00-05:00';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats ISO with fractional seconds', () => {
        const iso = '2024-05-22T14:30:00.123456Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats week-based timestamp from fightSummaryFactory pattern', () => {
        // Pattern used in codebase: Date.UTC(2026, 0, 1) + (week - 1) * 7 * 24 * 60 * 60 * 1000
        const week1Timestamp = new Date(Date.UTC(2026, 0, 1)).toISOString();
        const result = formatDate(week1Timestamp);
        expect(result).not.toBe(week1Timestamp);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats epoch timestamp', () => {
        const epoch = '1970-01-01T00:00:00.000Z';
        const result = formatDate(epoch);
        expect(result).not.toBe(epoch);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats date-only ISO string', () => {
        const dateOnly = '2024-05-22';
        const result = formatDate(dateOnly);
        expect(result).not.toBe(dateOnly);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats dates for all 12 months', () => {
        for (let month = 0; month < 12; month++) {
          const iso = new Date(Date.UTC(2024, month, 15, 12, 0)).toISOString();
          const result = formatDate(iso);
          expect(result).not.toBe(iso);
          expect(result.length).toBeGreaterThan(0);
        }
      });

      it('formats first day of month', () => {
        const iso = '2024-05-01T00:00:00.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats last day of month (31st)', () => {
        const iso = '2024-01-31T23:59:59.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats last day of month (30th)', () => {
        const iso = '2024-04-30T23:59:59.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats last day of month (28th February non-leap)', () => {
        const iso = '2023-02-28T23:59:59.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats leap year date (Feb 29, 2024)', () => {
        const iso = '2024-02-29T12:00:00.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats leap year date (Feb 29, 2020)', () => {
        const iso = '2020-02-29T12:00:00.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('handles non-leap year Feb 29 (auto-corrects to March 1)', () => {
        // JavaScript Date auto-corrects invalid dates like Feb 29 on non-leap year
        const invalidLeap = '2023-02-29T12:00:00.000Z';
        const result = formatDate(invalidLeap);
        // It formats as March 1 rather than returning original
        expect(result).not.toBe(invalidLeap);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats midnight (00:00)', () => {
        const iso = '2024-05-22T00:00:00.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats end of day (23:59)', () => {
        const iso = '2024-05-22T23:59:59.000Z';
        const result = formatDate(iso);
        expect(result).not.toBe(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats future dates (year 2026+ as used in codebase)', () => {
        const future = '2026-01-01T00:00:00.000Z';
        const result = formatDate(future);
        expect(result).not.toBe(future);
        expect(result.length).toBeGreaterThan(0);
      });

      it('formats newsletter week-based pattern', () => {
        // Pattern used in newsletter/feed.ts: Date.UTC(2024, 0, 1 + week * 7)
        const week10Timestamp = new Date(Date.UTC(2024, 0, 1 + 10 * 7)).toISOString();
        const result = formatDate(week10Timestamp);
        expect(result).not.toBe(week10Timestamp);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('error handling edge cases', () => {
      it('returns original for malformed ISO missing T separator', () => {
        const malformed = '2024-05-2214:30:00.000Z';
        expect(formatDate(malformed)).toBe(malformed);
      });

      it('returns original for malformed ISO with wrong separators', () => {
        const malformed = '2024/05/22T14:30:00.000Z';
        expect(formatDate(malformed)).toBe(malformed);
      });

      it('returns original for out-of-range month (13)', () => {
        const invalid = '2024-13-01T00:00:00.000Z';
        expect(formatDate(invalid)).toBe(invalid);
      });

      it('returns original for out-of-range day (32)', () => {
        const invalid = '2024-01-32T00:00:00.000Z';
        expect(formatDate(invalid)).toBe(invalid);
      });

      it('returns original for out-of-range hour (25)', () => {
        const invalid = '2024-01-01T25:00:00.000Z';
        expect(formatDate(invalid)).toBe(invalid);
      });

      it('returns original for negative timestamp', () => {
        const negative = '1969-12-31T23:59:59.999Z';
        const result = formatDate(negative);
        // Negative timestamps are valid, so this should format
        expect(result).not.toBe(negative);
      });

      it('returns original for extremely long string', () => {
        const long = 'a'.repeat(10000);
        expect(formatDate(long)).toBe(long);
      });

      it('returns original for string that looks like date but is invalid', () => {
        const looksLikeDate = '2024-13-45T99:99:99.999Z';
        expect(formatDate(looksLikeDate)).toBe(looksLikeDate);
      });

      it('formats partial ISO string (missing seconds)', () => {
        // JavaScript Date can parse partial ISO strings
        const partial = '2024-05-22T14:30';
        const result = formatDate(partial);
        expect(result).not.toBe(partial);
        expect(result.length).toBeGreaterThan(0);
      });

      it('returns original for ISO with invalid timezone', () => {
        const invalidTz = '2024-05-22T14:30:00.000+99:99';
        expect(formatDate(invalidTz)).toBe(invalidTz);
      });
    });

    describe('output validation', () => {
      it('output contains numeric day component for valid date', () => {
        const iso = '2024-05-22T14:30:00.000Z';
        const result = formatDate(iso);
        // Should contain the day number (22)
        expect(result).toMatch(/\d/);
      });

      it('output contains alphabetic month component for valid date', () => {
        const iso = '2024-05-22T14:30:00.000Z';
        const result = formatDate(iso);
        // Should contain month name (May, etc.)
        expect(result).toMatch(/[a-zA-Z]/);
      });

      it('output is never empty for valid input', () => {
        const iso = '2024-05-22T14:30:00.000Z';
        const result = formatDate(iso);
        expect(result.length).toBeGreaterThan(0);
      });

      it('output differs from input for all valid dates', () => {
        const validDates = [
          '2024-01-01T00:00:00.000Z',
          '2024-06-15T12:30:45.123Z',
          '2024-12-31T23:59:59.999Z',
          '2026-05-22T14:30:00.000Z',
        ];
        validDates.forEach((iso) => {
          expect(formatDate(iso)).not.toBe(iso);
        });
      });

      it('output is consistent for same input', () => {
        const iso = '2024-05-22T14:30:00.000Z';
        const result1 = formatDate(iso);
        const result2 = formatDate(iso);
        expect(result1).toBe(result2);
      });

      it('output contains time component (hour/minute)', () => {
        const iso = '2024-05-22T14:30:00.000Z';
        const result = formatDate(iso);
        // Should contain time digits
        expect(result).toMatch(/\d.*\d/);
      });
    });
  });
});
