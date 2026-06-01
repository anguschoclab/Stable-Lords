import { describe, it, expect } from 'vitest';
import { clamp, clamp01, lerp, mapRange, roundTo, addCapped } from '@/utils/math';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('clamps to min when below range', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(-100, -50, 50)).toBe(-50);
  });

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, -50, 50)).toBe(50);
  });
});

describe('clamp01', () => {
  it('returns value when between 0 and 1', () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(0.75)).toBe(0.75);
  });

  it('clamps to 0 when negative', () => {
    expect(clamp01(-0.1)).toBe(0);
    expect(clamp01(-5)).toBe(0);
  });

  it('clamps to 1 when above 1', () => {
    expect(clamp01(1.1)).toBe(1);
    expect(clamp01(5)).toBe(1);
  });
});

describe('lerp', () => {
  it('returns a when t = 0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(100, 0, 0)).toBe(100);
  });

  it('returns b when t = 1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(100, 0, 1)).toBe(0);
  });

  it('interpolates linearly for t between 0 and 1', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerp(0, 100, 0.25)).toBe(25);
    expect(lerp(0, 100, 0.75)).toBe(75);
  });

  it('works with negative direction (a > b)', () => {
    expect(lerp(20, 10, 0)).toBe(20);
    expect(lerp(20, 10, 1)).toBe(10);
    expect(lerp(20, 10, 0.5)).toBe(15);
  });

  it('clamps t < 0 to a', () => {
    expect(lerp(10, 20, -0.5)).toBe(10);
    expect(lerp(10, 20, -5)).toBe(10);
  });

  it('clamps t > 1 to b', () => {
    expect(lerp(10, 20, 1.5)).toBe(20);
    expect(lerp(10, 20, 5)).toBe(20);
  });
});

describe('mapRange', () => {
  it('maps a value from one range to another', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
    expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
  });

  it('handles out-of-range values via lerp clamping', () => {
    expect(mapRange(-5, 0, 10, 0, 100)).toBe(0);
    expect(mapRange(15, 0, 10, 0, 100)).toBe(100);
  });
});

describe('roundTo', () => {
  it('rounds to specified decimal places', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.14159, 3)).toBe(3.142);
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(2.4, 0)).toBe(2);
  });

  it('handles negative decimal places', () => {
    expect(roundTo(123, -1)).toBe(120);
    expect(roundTo(123, -2)).toBe(100);
  });
});

describe('addCapped', () => {
  it('adds normally when under cap', () => {
    expect(addCapped(10, 5, 20)).toBe(15);
    expect(addCapped(0, 10, 100)).toBe(10);
  });

  it('caps at max when sum exceeds cap', () => {
    expect(addCapped(10, 15, 20)).toBe(20);
    expect(addCapped(90, 20, 100)).toBe(100);
  });

  it('allows negative results (no floor)', () => {
    expect(addCapped(-5, -3, 0)).toBe(-8);
  });
});
