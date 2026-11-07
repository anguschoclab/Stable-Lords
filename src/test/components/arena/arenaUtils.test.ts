/**
 * arenaUtils — pure arena display helpers: percentage clamping, shield-name
 * parsing, and winner/death status derivation. Pins current behavior
 * including unguarded NaN propagation and size parsing on non-shield names.
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePercent,
  parseShieldInfo,
  calculateFighterStatuses,
} from '@/components/arena/arenaUtils';

describe('calculatePercent', () => {
  it('computes a plain percentage', () => {
    expect(calculatePercent(50, 200)).toBe(25);
  });

  it('returns 0 when max is zero or negative', () => {
    expect(calculatePercent(50, 0)).toBe(0);
    expect(calculatePercent(50, -5)).toBe(0);
  });

  it('clamps results above 100', () => {
    expect(calculatePercent(150, 100)).toBe(100);
  });

  it('clamps negative currents to 0', () => {
    expect(calculatePercent(-10, 100)).toBe(0);
  });

  it('returns boundary values exactly', () => {
    expect(calculatePercent(0, 100)).toBe(0);
    expect(calculatePercent(100, 100)).toBe(100);
  });

  it('returns fractional percentages unrounded', () => {
    expect(calculatePercent(1, 3)).toBeCloseTo(33.333, 2);
  });

  // No NaN guard in clamp — pins propagation, not a contract.
  it('propagates NaN and clamps Infinity', () => {
    expect(calculatePercent(NaN, 100)).toBeNaN();
    expect(calculatePercent(Infinity, 100)).toBe(100);
    expect(calculatePercent(50, Infinity)).toBe(0);
  });
});

describe('parseShieldInfo', () => {
  it('reports no shield for undefined, empty, and none names', () => {
    for (const name of [undefined, '', 'none', 'None', 'NONE']) {
      expect(parseShieldInfo(name)).toEqual({ hasShield: false, size: 'medium' });
    }
  });

  it('reports no shield for non-shield names', () => {
    expect(parseShieldInfo('Broadsword')).toEqual({ hasShield: false, size: 'medium' });
  });

  it('detects size keywords in shield names', () => {
    expect(parseShieldInfo('small shield')).toEqual({ hasShield: true, size: 'small' });
    expect(parseShieldInfo('Small Shield')).toEqual({ hasShield: true, size: 'small' });
    expect(parseShieldInfo('large shield')).toEqual({ hasShield: true, size: 'large' });
  });

  it('defaults to medium size when the name has no size keyword', () => {
    expect(parseShieldInfo('shield')).toEqual({ hasShield: true, size: 'medium' });
    expect(parseShieldInfo('tower shield')).toEqual({ hasShield: true, size: 'medium' });
  });

  // Quirk pin: size keywords are parsed independently — a non-shield name
  // still yields its size even though hasShield is false.
  it('parses size keywords even on non-shield names', () => {
    expect(parseShieldInfo('small buckler')).toEqual({ hasShield: false, size: 'small' });
    expect(parseShieldInfo('large rock')).toEqual({ hasShield: false, size: 'large' });
  });
});

describe('calculateFighterStatuses', () => {
  it('marks A the winner and D dead when A wins a completed fight', () => {
    expect(calculateFighterStatuses('A', true)).toEqual({
      isDeadA: false,
      isDeadD: true,
      isWinnerA: true,
      isWinnerD: false,
    });
  });

  it('marks D the winner and A dead when D wins a completed fight', () => {
    expect(calculateFighterStatuses('D', true)).toEqual({
      isDeadA: true,
      isDeadD: false,
      isWinnerA: false,
      isWinnerD: true,
    });
  });

  it('reports no outcome for a completed fight with no winner', () => {
    expect(calculateFighterStatuses(null, true)).toEqual({
      isDeadA: false,
      isDeadD: false,
      isWinnerA: false,
      isWinnerD: false,
    });
  });

  it('reports nothing until the fight completes, even with a winner set', () => {
    const allFalse = {
      isDeadA: false,
      isDeadD: false,
      isWinnerA: false,
      isWinnerD: false,
    };
    expect(calculateFighterStatuses('A', false)).toEqual(allFalse);
    expect(calculateFighterStatuses('D', false)).toEqual(allFalse);
    expect(calculateFighterStatuses(null, false)).toEqual(allFalse);
  });
});
