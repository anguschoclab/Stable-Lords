import { describe, it, expect } from 'vitest';
import { WEATHER_PENALTIES } from '@/constants/arena/weather';

describe('arena weather modifiers — new entries from PR #791', () => {
  it('ACID_RAIN_SLASHING_DAMAGE exists in WEATHER_PENALTIES', () => {
    expect(WEATHER_PENALTIES.ACID_RAIN_SLASHING_DAMAGE).toBeDefined();
  });

  it('ECLIPSE_STRIKING_BONUS exists in WEATHER_PENALTIES', () => {
    expect(WEATHER_PENALTIES.ECLIPSE_STRIKING_BONUS).toBeDefined();
  });
});
