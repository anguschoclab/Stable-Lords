/**
 * Feature — Arena weather modifiers for PR #791.
 * Pre-merge test: will FAIL on main because new weather modifiers
 * (ACID_RAIN_SLASHING_DAMAGE, ECLIPSE_STRIKING_BONUS) don't exist yet.
 */
import { describe, it, expect } from 'vitest';
import { STYLE_WEATHER_MODIFIERS } from '@/constants/arena/arena';

describe('arena weather modifiers — new entries from PR #791', () => {
  it('ACID_RAIN_SLASHING_DAMAGE exists in STYLE_WEATHER_MODIFIERS', () => {
    expect(STYLE_WEATHER_MODIFIERS.ACID_RAIN_SLASHING_DAMAGE).toBeDefined();
  });

  it('ECLIPSE_STRIKING_BONUS exists in STYLE_WEATHER_MODIFIERS', () => {
    expect(STYLE_WEATHER_MODIFIERS.ECLIPSE_STRIKING_BONUS).toBeDefined();
  });
});
