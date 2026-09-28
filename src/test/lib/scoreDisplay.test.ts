import { describe, it, expect } from 'vitest';
import { getScoreColor } from '@/lib/scoreDisplay';

describe('getScoreColor', () => {
  it('returns gold classes for score >= 85', () => {
    expect(getScoreColor(90)).toBe(
      'text-arena-gold shadow-[0_0_10px_rgba(var(--arena-gold-rgb),0.5)]'
    );
    expect(getScoreColor(85)).toBe(
      'text-arena-gold shadow-[0_0_10px_rgba(var(--arena-gold-rgb),0.5)]'
    );
  });

  it('returns primary class for score 70–84', () => {
    expect(getScoreColor(75)).toBe('text-primary');
    expect(getScoreColor(70)).toBe('text-primary');
  });

  it('returns arena-pop class for score 50–69', () => {
    expect(getScoreColor(60)).toBe('text-arena-pop');
    expect(getScoreColor(50)).toBe('text-arena-pop');
  });

  it('returns destructive class for score < 50', () => {
    expect(getScoreColor(40)).toBe('text-destructive');
    expect(getScoreColor(0)).toBe('text-destructive');
  });
});
