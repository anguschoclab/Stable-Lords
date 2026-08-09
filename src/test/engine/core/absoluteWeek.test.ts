import { describe, it, expect } from 'vitest';
import { deriveAbsoluteWeek, displayWeek } from '@/engine/core/absoluteWeek';

describe('absolute week helpers', () => {
  it('derives the monotonic week from (year, week)', () => {
    expect(deriveAbsoluteWeek(1, 1)).toBe(1);
    expect(deriveAbsoluteWeek(1, 52)).toBe(52);
    expect(deriveAbsoluteWeek(2, 1)).toBe(53); // the rollover boundary
    expect(deriveAbsoluteWeek(3, 10)).toBe(114);
  });

  it('handles negative or zero values by defaulting to 1', () => {
    expect(deriveAbsoluteWeek(0, 0)).toBe(1);
    expect(deriveAbsoluteWeek(-1, -10)).toBe(1);
    expect(deriveAbsoluteWeek(1, -5)).toBe(1);
    expect(deriveAbsoluteWeek(0, 5)).toBe(5);
  });

  it('round-trips back to a display week in [1, 52]', () => {
    expect(displayWeek(1)).toBe(1);
    expect(displayWeek(52)).toBe(52);
    expect(displayWeek(53)).toBe(1);
    expect(displayWeek(114)).toBe(10);
  });

  it('handles zero or negative inputs correctly for displayWeek', () => {
    expect(displayWeek(0)).toBe(1);
    expect(displayWeek(-5)).toBe(1);
  });

  it('defaults missing/garbage inputs to week 1', () => {
    expect(deriveAbsoluteWeek(undefined, undefined)).toBe(1);
    expect(deriveAbsoluteWeek(2, undefined)).toBe(53);
    expect(deriveAbsoluteWeek(undefined, 5)).toBe(5);
  });
});
