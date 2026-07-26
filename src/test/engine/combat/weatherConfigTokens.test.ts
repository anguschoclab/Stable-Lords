/**
 * Weather config token audit — verifies no WEATHER_CONFIG entries use
 * raw Tailwind palette colors (UI Design Bible compliance).
 */
import { describe, it, expect } from 'vitest';
import { WEATHER_CONFIG } from '@/constants/arena/weather';

const RAW_TAILWIND_PATTERNS = [
  /text-(red|blue|green|yellow|purple|orange|pink|indigo|teal|cyan|emerald|amber|lime|fuchsia|rose|violet|sky)-\d/,
  /bg-(red|blue|green|yellow|purple|orange|pink|indigo|teal|cyan|emerald|amber|lime|fuchsia|rose|violet|sky)-\d/,
  /border-(red|blue|green|yellow|purple|orange|pink|indigo|teal|cyan|emerald|amber|lime|fuchsia|rose|violet|sky)-\d/,
];

describe('WEATHER_CONFIG token compliance', () => {
  for (const [weather, config] of Object.entries(WEATHER_CONFIG)) {
    it(`${weather} uses arena tokens (no raw Tailwind palette colors)`, () => {
      for (const pattern of RAW_TAILWIND_PATTERNS) {
        expect(config.colorClass, `${weather} colorClass has raw Tailwind color`).not.toMatch(pattern);
        expect(config.bgClass, `${weather} bgClass has raw Tailwind color`).not.toMatch(pattern);
        expect(config.borderClass, `${weather} borderClass has raw Tailwind color`).not.toMatch(pattern);
      }
    });
  }

  it('Temporal Rift uses arena-fame tokens', () => {
    const config = WEATHER_CONFIG['Temporal Rift' as keyof typeof WEATHER_CONFIG];
    if (config) {
      expect(config.colorClass).toContain('arena-fame');
      expect(config.bgClass).toContain('arena-fame');
      expect(config.borderClass).toContain('arena-fame');
    }
  });

  it('Chaos Squall uses arena-fame tokens (not raw purple)', () => {
    const config = WEATHER_CONFIG['Chaos Squall'];
    expect(config.colorClass).not.toContain('purple');
    expect(config.bgClass).not.toContain('purple');
    expect(config.borderClass).not.toContain('purple');
  });
});
