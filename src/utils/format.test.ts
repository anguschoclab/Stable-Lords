import { describe, it, expect } from 'vitest';
import { formatWeek, formatDateOfDeath } from './format';

describe('formatWeek', () => {
  it('formats a week and season into a display string', () => {
    expect(formatWeek(3, 'Spring')).toBe('Week 3, Spring');
  });

  it('handles week 1', () => {
    expect(formatWeek(1, 'Winter')).toBe('Week 1, Winter');
  });

  it('handles large week numbers', () => {
    expect(formatWeek(52, 'Autumn')).toBe('Week 52, Autumn');
  });

  it('preserves season string as-is', () => {
    expect(formatWeek(7, 'Late Summer')).toBe('Week 7, Late Summer');
  });
});

describe('formatDateOfDeath', () => {
  it('formats a week and season into a death-record string', () => {
    expect(formatDateOfDeath(3, 'Spring')).toBe('Week 3, Season Spring');
  });

  it('handles week 1', () => {
    expect(formatDateOfDeath(1, 'Winter')).toBe('Week 1, Season Winter');
  });

  it('handles large week numbers', () => {
    expect(formatDateOfDeath(52, 'Autumn')).toBe('Week 52, Season Autumn');
  });

  it('preserves season string as-is', () => {
    expect(formatDateOfDeath(7, 'Late Summer')).toBe('Week 7, Season Late Summer');
  });
});
