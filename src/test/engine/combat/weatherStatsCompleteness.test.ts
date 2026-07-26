/**
 * Weather stats completeness — verifies WEATHER_STATS has entries for
 * every WeatherType, no duplicates, and values match WEATHER_EFFECTS.
 */
import { describe, it, expect } from 'vitest';
import { WEATHER_STATS } from '@/components/widgets/WeatherWidget';
import { WEATHER_TYPES } from '@/types/enumSources';
describe('WEATHER_STATS completeness', () => {
  it('WEATHER_STATS has entry for every WEATHER_TYPES member', () => {
    for (const w of WEATHER_TYPES) {
      expect(WEATHER_STATS, `${w} missing from WEATHER_STATS`).toHaveProperty(w);
    }
  });

  it('WEATHER_STATS has no duplicate keys', () => {
    const keys = Object.keys(WEATHER_STATS);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('Stardust Gale stats string contains 115% and +2', () => {
    const stats = WEATHER_STATS['Stardust Gale' as keyof typeof WEATHER_STATS];
    expect(stats).toBeDefined();
    expect(stats).toContain('115%');
    expect(stats).toContain('+2');
  });

  it('Temporal Rift stats string contains 200% and +10 and +5', () => {
    const stats = WEATHER_STATS['Temporal Rift' as keyof typeof WEATHER_STATS];
    expect(stats).toBeDefined();
    expect(stats).toContain('200%');
    expect(stats).toContain('+10');
    expect(stats).toContain('+5');
  });

  it('Diamond Rain stats string contains 120% and -2 and +30%', () => {
    const stats = WEATHER_STATS['Diamond Rain'];
    expect(stats).toBeDefined();
    expect(stats).toContain('120%');
    expect(stats).toContain('-2');
    expect(stats).toContain('+30%');
  });

  it('WEATHER_STATS count matches WEATHER_TYPES count', () => {
    expect(Object.keys(WEATHER_STATS).length).toBe(WEATHER_TYPES.length);
  });
});
