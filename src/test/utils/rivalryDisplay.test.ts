import { describe, it, expect } from 'vitest';
import { intensityLabel, intensityColor, intensityBgColor } from '@/engine/rivals/rivalryDisplay';

describe('intensityLabel', () => {
  it('returns Simmering for negative values', () => {
    expect(intensityLabel(-5)).toBe('Simmering');
    expect(intensityLabel(-1)).toBe('Simmering');
  });

  it('returns Simmering for 0 and 1', () => {
    expect(intensityLabel(0)).toBe('Simmering');
    expect(intensityLabel(1)).toBe('Simmering');
  });

  it('returns Tense for 2', () => {
    expect(intensityLabel(2)).toBe('Tense');
  });

  it('returns Heated for 3', () => {
    expect(intensityLabel(3)).toBe('Heated');
  });

  it('returns Bitter for 4', () => {
    expect(intensityLabel(4)).toBe('Bitter');
  });

  it('returns Blood Feud for 5 and above', () => {
    expect(intensityLabel(5)).toBe('Blood Feud');
    expect(intensityLabel(6)).toBe('Blood Feud');
    expect(intensityLabel(100)).toBe('Blood Feud');
  });
});

describe('intensityColor', () => {
  it('returns text-primary for negative values and 0, 1', () => {
    expect(intensityColor(-5)).toBe('text-primary');
    expect(intensityColor(-1)).toBe('text-primary');
    expect(intensityColor(0)).toBe('text-primary');
    expect(intensityColor(1)).toBe('text-primary');
  });

  it('returns text-arena-gold for 2 and 3', () => {
    expect(intensityColor(2)).toBe('text-arena-gold');
    expect(intensityColor(3)).toBe('text-arena-gold');
  });

  it('returns text-destructive for 4 and above', () => {
    expect(intensityColor(4)).toBe('text-destructive');
    expect(intensityColor(5)).toBe('text-destructive');
    expect(intensityColor(100)).toBe('text-destructive');
  });

  it('handles non-integer boundaries correctly', () => {
    expect(intensityColor(1.5)).toBe('text-primary');
    expect(intensityColor(3.5)).toBe('text-arena-gold');
    expect(intensityColor(4.5)).toBe('text-destructive');
  });
});

describe('intensityBgColor', () => {
  it('returns bg-destructive for 4 and above', () => {
    expect(intensityBgColor(4)).toBe('bg-destructive');
    expect(intensityBgColor(5)).toBe('bg-destructive');
    expect(intensityBgColor(100)).toBe('bg-destructive');
  });

  it('returns bg-arena-gold for below 4', () => {
    expect(intensityBgColor(-1)).toBe('bg-arena-gold');
    expect(intensityBgColor(0)).toBe('bg-arena-gold');
    expect(intensityBgColor(1)).toBe('bg-arena-gold');
    expect(intensityBgColor(2)).toBe('bg-arena-gold');
    expect(intensityBgColor(3)).toBe('bg-arena-gold');
    expect(intensityBgColor(3.9)).toBe('bg-arena-gold');
  });
});
