import { describe, it, expect } from 'vitest';
import { formatNumber, formatGold, formatPercent } from '@/utils/format';

describe('formatNumber', () => {
  it('returns plain string for small ints', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(7)).toBe('7');
  });

  it('returns locale-grouped string for thousands', () => {
    const result = formatNumber(1234);
    // The exact separator depends on locale, but the grouped output
    // should contain a non-digit separator between the thousands groups.
    expect(result).toMatch(/1[,. ]234/);
  });

  it('handles negative numbers', () => {
    const result = formatNumber(-1234);
    expect(result).toMatch(/-1[,. ]234/);
  });

  it('handles large numbers', () => {
    const result = formatNumber(1000000);
    expect(result).toMatch(/1[,. ]000[,. ]000/);
  });

  it('handles decimals', () => {
    const result = formatNumber(1234.56);
    expect(result).toMatch(/1[,. ]234[,. ]56/);
  });
});

describe('formatGold', () => {
  it('appends g suffix', () => {
    expect(formatGold(0)).toBe('0g');
    expect(formatGold(42)).toBe('42g');
  });

  it('appends g suffix after locale grouping', () => {
    const result = formatGold(1234);
    expect(result).toMatch(/1[,. ]234g/);
  });

  it('handles negative amounts', () => {
    const result = formatGold(-500);
    expect(result).toMatch(/-500g/);
  });

  it('handles large numbers', () => {
    const result = formatGold(1000000);
    expect(result).toMatch(/1[,. ]000[,. ]000g/);
  });
});

describe('formatPercent', () => {
  it('formats with 0 decimals by default', () => {
    expect(formatPercent(0.85)).toBe('85%');
    expect(formatPercent(0.5)).toBe('50%');
  });

  it('formats 1.0 as 100%', () => {
    expect(formatPercent(1)).toBe('100%');
  });

  it('formats 0.0 as 0%', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercent(0.856, 2)).toBe('85.60%');
    expect(formatPercent(0.005, 1)).toBe('0.5%');
  });

  it('formats with 3 decimals', () => {
    expect(formatPercent(0.123456, 3)).toBe('12.346%');
  });

  it('handles negative ratios', () => {
    expect(formatPercent(-0.1)).toBe('-10%');
  });

  it('handles ratios greater than 1', () => {
    expect(formatPercent(1.5)).toBe('150%');
  });
});
